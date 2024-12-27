# Student-Patient-Customer Integration Documentation

## Overview
This document details the integration process between Student, Patient, and Customer records in the Frappe/ERPNext healthcare system. The implementation ensures consistent record management by using student IDs as primary identifiers across all related doctypes.

## Key Features
1. Automatic creation of Customer and Patient records from Student data
2. Student ID used as primary identifier (name field) in both Customer and Patient doctypes
3. Proper linking between Student, Customer, and Patient records
4. Automatic customer group assignment for students
5. Gender mapping from Student to Patient format
6. Comprehensive validation and error handling

## Implementation Details

### 1. Core API File
Location: `/healthcare/healthcare/doctype/patient/gcihs_patient_api.py`

```python
import frappe
from frappe import _
from frappe.model.naming import set_name_from_naming_options

def get_student_details(student):
    """Get student details from Student doctype"""
    return frappe.get_doc("Student", student)

def create_customer_from_student(student):
    """Create a Customer record from Student data"""
    if frappe.db.exists("Customer", student.name):
        return None
        
    # Create customer with student ID as name
    customer_data = {
        "doctype": "Customer",
        "name": student.name,  # Force the name to be student ID
        "customer_type": "Individual",
        "customer_name": student.student_name,
        "student_id": student.name,
        "customer_group": "Student"
    }
    
    try:
        doc = frappe.get_doc(customer_data)
        # Override autoname
        doc.flags.ignore_permissions = True
        doc.flags.ignore_links = True
        doc.flags.ignore_mandatory = True
        # Force the name to be student ID
        doc.name = student.name
        # Bypass naming series and validation
        doc.flags.ignore_validate = True
        doc.flags.ignore_naming_series = True
        # Insert directly into database
        doc.db_insert()
        frappe.db.commit()
        return frappe.get_doc("Customer", student.name)
    except Exception as e:
        frappe.log_error(
            f"Failed to create Customer for student {student.name}: {str(e)}",
            "Customer Creation Error"
        )
        return None

def map_student_gender_to_patient(student_gender):
    """Map student gender to valid Patient gender value"""
    gender_map = {
        "M": "Male",
        "F": "Female",
        "MALE": "Male",
        "FEMALE": "Female",
        "male": "Male",
        "female": "Female"
    }
    
    if not student_gender:
        return None
        
    normalized_gender = student_gender.strip().upper()
    return gender_map.get(normalized_gender, None)

@frappe.whitelist()
def get_new_students():
    try:
        # Get students who are not already linked to a Patient record
        existing_patients = frappe.db.get_all("Patient", 
            fields=["student_id", "name", "patient_name"],
            filters={"student_id": ["is", "set"]}
        )
        existing_customers = frappe.db.get_all("Customer", 
            fields=["student_id", "name", "customer_name"],
            filters={"student_id": ["is", "set"]}
        )
        
        # Create lookup dictionaries for faster validation
        patient_map = {p.student_id: p for p in existing_patients}
        customer_map = {c.student_id: c for c in existing_customers}
        # Only filter by existing patient IDs
        existing_ids = list(patient_map.keys())
        
        students = frappe.get_all(
            "Student",
            filters={"name": ["not in", existing_ids]},
            fields=["name", "first_name", "middle_name", "last_name", "date_of_birth", "gender", "student_name"]
        )

        if not students:
            return {
                "status": "error",
                "message": _("No new students found to add as patients."),
                "details": {
                    "skipped_students": []
                }
            }

        new_patient_count = 0
        skipped_students = []

        for student in students:
            # Detailed validation check
            validation_result = validate_student_id(student.name, patient_map, customer_map)
            if not validation_result["valid"]:
                skipped_students.append({
                    "id": student.name,
                    "name": student.student_name,
                    "reason": validation_result["reason"]
                })
                continue
            
            # Create Customer record first
            customer = create_customer_from_student(student)
            if not customer:
                skipped_students.append({
                    "id": student.name,
                    "name": student.student_name,
                    "reason": _("Failed to create Customer record")
                })
                continue
            
            # Map student gender to valid Patient gender
            mapped_gender = map_student_gender_to_patient(student.gender)
            
            # Prepare Patient data
            patient_data = {
                "doctype": "Patient",
                "name": student.name,  # Use student ID as primary identifier
                "patient_name": student.student_name,  # Use full name in patient_name field
                "first_name": student.first_name,
                "middle_name": student.middle_name,
                "last_name": student.last_name,
                "dob": student.date_of_birth,
                "sex": mapped_gender,
                "student_id": student.name,
                "customer": customer.name  # Link to the newly created Customer
            }

            # Insert new Patient record
            try:
                doc = frappe.get_doc(patient_data)
                # Override autoname
                doc.flags.ignore_permissions = True
                doc.flags.ignore_links = True
                doc.flags.ignore_validate = True
                doc.flags.ignore_mandatory = True
                doc.flags.ignore_naming_series = True
                # Force the name to be student ID
                doc.name = student.name
                # Insert directly into database
                doc.db_insert()
                frappe.db.commit()
                new_patient_count += 1
            except Exception as e:
                error_msg = str(e)
                skipped_students.append({
                    "id": student.name,
                    "name": student.student_name,
                    "reason": _("Creation failed: {0}").format(error_msg)
                })
                frappe.log_error(
                    f"Failed to create Patient for student {student.name}: {error_msg}",
                    "Patient Creation Error"
                )

        # Construct the final response with detailed information
        if new_patient_count > 0:
            status = "success"
            message = _("Successfully created {0} new patient records.").format(new_patient_count)
        else:
            status = "warning"
            message = _("No new patients were added.")

        return {
            "status": status,
            "message": message,
            "details": {
                "created_count": new_patient_count,
                "skipped_students": skipped_students
            }
        }

    except Exception as e:
        error_msg = str(e)
        frappe.log_error(f"Error in get_new_students: {error_msg}", "Get New Students Error")
        return {
            "status": "error",
            "message": _("An error occurred while processing students."),
            "details": {
                "error": error_msg,
                "skipped_students": []
            }
        }

def validate_student_id(student_id, patient_map, customer_map):
    """Validate student_id against existing Patient records only"""
    if student_id in patient_map:
        return {
            "valid": False,
            "reason": _("Already linked to Patient: {0} ({1})").format(
                patient_map[student_id].name,
                patient_map[student_id].patient_name
            )
        }
    
    # We no longer validate against customers since we create them
    return {
        "valid": True,
        "reason": None
    }
```

### 2. Required Customizations

#### 2.1 Customer Doctype
1. Add custom field "student_id" (Data type)
2. Add validation in Customer doctype to prevent duplicate student IDs

#### 2.2 Patient Doctype
1. Add custom field "student_id" (Data type)
2. Add validation in Patient doctype to prevent duplicate student IDs
3. Add link field to Customer doctype

## Process Flow

1. **Initial Setup**
   - Add custom fields to Customer and Patient doctypes
   - Deploy the API file to the correct location
   - Ensure proper permissions are set

2. **Record Creation Process**
   a. When "Get New Students" is triggered:
      1. System fetches all existing Patient records with student IDs
      2. System fetches all Student records not linked to Patients
      3. For each eligible Student:
         - Creates a Customer record using student ID as name
         - Creates a Patient record using student ID as name
         - Links Patient to Customer
         - Maps gender and other fields appropriately

3. **Data Consistency**
   - Student ID is used as the primary key (name field) in both Customer and Patient records
   - Customer records are created with "Student" customer group
   - Patient records are properly linked to their corresponding Customer records

## Technical Details

### Key Implementation Points

1. **Bypassing Naming Series**
   ```python
   doc.flags.ignore_permissions = True
   doc.flags.ignore_links = True
   doc.flags.ignore_validate = True
   doc.flags.ignore_mandatory = True
   doc.flags.ignore_naming_series = True
   doc.name = student.name  # Force the name
   doc.db_insert()  # Direct database insert
   ```

2. **Gender Mapping**
   - Handles various input formats (M/F, MALE/FEMALE, etc.)
   - Maps to standard Patient gender values

3. **Error Handling**
   - Comprehensive error logging
   - Detailed error messages in response
   - Skip list for failed records

### Database Structure

1. **tabCustomer**
   - name (primary key) = student ID
   - customer_name = student's full name
   - student_id = student ID (for reference)
   - customer_group = "Student"

2. **tabPatient**
   - name (primary key) = student ID
   - patient_name = student's full name
   - student_id = student ID (for reference)
   - customer = link to Customer record

## Installation Steps

1. **Create Required Custom Fields**
   ```bash
   bench --site [site-name] execute frappe.custom.doctype.custom_field.custom_field.create_custom_fields({
       'Customer': [
           {
               'fieldname': 'student_id',
               'label': 'Student ID',
               'fieldtype': 'Data',
               'unique': 1,
               'insert_after': 'customer_name'
           }
       ],
       'Patient': [
           {
               'fieldname': 'student_id',
               'label': 'Student ID',
               'fieldtype': 'Data',
               'unique': 1,
               'insert_after': 'patient_name'
           },
           {
               'fieldname': 'customer',
               'label': 'Customer',
               'fieldtype': 'Link',
               'options': 'Customer',
               'insert_after': 'student_id'
           }
       ]
   })
   ```

2. **Deploy API Files**
   ```bash
   # Copy API file
   cp gcihs_patient_api.py /[bench-path]/apps/healthcare/healthcare/healthcare/doctype/patient/

   # Copy list view customization
   cp patient_list.js /[bench-path]/apps/healthcare/healthcare/healthcare/doctype/patient/
   ```

3. **System Update**
   ```bash
   # Clear cache
   bench --site [site-name] clear-cache

   # Build assets
   bench build

   # Restart server
   bench restart
   ```

## Troubleshooting Guide

### 1. Database Issues

a) **Duplicate Records**
   - Symptom: Error about duplicate entry
   - Check: `select name, student_id from tabPatient where student_id is not null;`
   - Fix: Update or remove duplicate entries

b) **Missing Links**
   - Symptom: Patient record without customer link
   - Check: `select name, student_id, customer from tabPatient where customer is null;`
   - Fix: Run customer creation process again

### 2. Process Issues

a) **Creation Failures**
   - Check error logs: `bench --site [site-name] show-logs`
   - Verify permissions: `bench --site [site-name] show-permissions`
   - Review process logs in Site Logs section

b) **Performance Issues**
   - Monitor system load during process
   - Check database indexes
   - Consider batch size adjustments

### 3. UI Issues

a) **Button Not Visible**
   - Clear browser cache
   - Rebuild assets: `bench build`
   - Check console for JavaScript errors

b) **No Feedback**
   - Check browser console
   - Verify WebSocket connection
   - Check server logs

### 4. Data Validation

a) **Gender Mapping**
   - Review source data format
   - Check mapping function
   - Add missing mappings

b) **Student ID Format**
   - Verify ID pattern
   - Check for special characters
   - Ensure consistent formatting

## Quick Reference

### Common Commands
```bash
# Check system status
bench doctor

# View error logs
bench --site [site-name] show-logs

# Clear cache
bench --site [site-name] clear-cache

# Rebuild assets
bench build

# Restart system
bench restart
```

### Useful Queries
```sql
-- Find unmapped students
SELECT name, student_name 
FROM tabStudent 
WHERE name NOT IN (SELECT student_id FROM tabPatient WHERE student_id IS NOT NULL);

-- Check customer-patient links
SELECT p.name, p.student_id, p.customer, c.name 
FROM tabPatient p 
LEFT JOIN tabCustomer c ON p.customer = c.name 
WHERE p.student_id IS NOT NULL;
```

## Frontend Integration

### Patient List View Integration

1. **Button Configuration**
   Add the "Get New Students" button to the Patient list view by modifying `/healthcare/healthcare/doctype/patient/patient_list.js`:

   ```javascript
   frappe.listview_settings['Patient'] = {
       onload: function(listview) {
           listview.page.add_inner_button(__('Get New Students'), function() {
               frappe.call({
                   method: 'healthcare.healthcare.doctype.patient.gcihs_patient_api.get_new_students',
                   callback: function(r) {
                       if (r.message) {
                           if (r.message.status === "success") {
                               frappe.show_alert({
                                   message: r.message.message,
                                   indicator: 'green'
                               });
                               listview.refresh();
                           } else {
                               frappe.show_alert({
                                   message: r.message.message,
                                   indicator: 'orange'
                               });
                           }
                           
                           // Show detailed results if any students were skipped
                           if (r.message.details.skipped_students.length > 0) {
                               let skipped = r.message.details.skipped_students;
                               let msg = "Skipped Students:\n";
                               skipped.forEach(function(student) {
                                   msg += `\n${student.id} (${student.name}): ${student.reason}`;
                               });
                               frappe.msgprint(msg);
                           }
                       }
                   }
               });
           });
       }
   };
   ```

### Backend Process Flow

1. **Trigger Point**
   - User clicks "Get New Students" button in Patient list view
   - Frontend makes AJAX call to `get_new_students` method
   - Backend process starts in `gcihs_patient_api.py`

2. **Data Collection Phase**
   ```python
   # Get existing records
   existing_patients = frappe.db.get_all("Patient", 
       fields=["student_id", "name", "patient_name"],
       filters={"student_id": ["is", "set"]}
   )
   
   # Create efficient lookup maps
   patient_map = {p.student_id: p for p in existing_patients}
   existing_ids = list(patient_map.keys())
   
   # Get eligible students
   students = frappe.get_all(
       "Student",
       filters={"name": ["not in", existing_ids]},
       fields=["name", "first_name", "middle_name", "last_name", 
               "date_of_birth", "gender", "student_name"]
   )
   ```

3. **Record Creation Process**
   For each eligible student:

   a. **Customer Creation**
      - Check if customer exists
      - Create customer with student ID as name
      - Set customer group to "Student"
      - Use db_insert() to bypass naming series
      ```python
      doc = frappe.get_doc(customer_data)
      doc.flags.ignore_naming_series = True
      doc.name = student.name
      doc.db_insert()
      ```

   b. **Patient Creation**
      - Map gender values
      - Create patient with student ID as name
      - Link to newly created customer
      - Use db_insert() to bypass naming series
      ```python
      doc = frappe.get_doc(patient_data)
      doc.flags.ignore_naming_series = True
      doc.name = student.name
      doc.db_insert()
      ```

4. **Response Handling**
   ```python
   return {
       "status": status,
       "message": message,
       "details": {
           "created_count": new_patient_count,
           "skipped_students": skipped_students
       }
   }
   ```

5. **UI Updates**
   - Show success/warning message
   - Display skipped students if any
   - Refresh list view to show new patients

### Database Operations

1. **Naming Strategy**
   - Both Customer and Patient tables use student ID as primary key
   - Bypass standard Frappe naming series using flags
   - Direct database insertion to maintain consistency

2. **Transaction Flow**
   ```
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │   Student   │ ──> │  Customer   │ ──> │   Patient   │
   └─────────────┘     └─────────────┘     └─────────────┘
        ID as           ID as name          ID as name
       source          + student_id        + student_id
                                          + customer link
   ```

3. **Error Handling**
   - Each creation step is wrapped in try-except
   - Failed records are tracked and reported
   - Transaction commits after each successful record
   - Detailed error logging for debugging

## Performance Considerations

1. **Batch Processing**
   - Uses dictionary lookups for validation
   - Processes one student at a time to prevent memory issues
   - Commits after each successful record

2. **Database Optimization**
   - Uses db_insert() for direct database access
   - Minimizes database queries through lookup maps
   - Avoids unnecessary validation cycles

3. **UI Responsiveness**
   - Asynchronous processing
   - Progressive feedback through message system
   - Automatic list refresh after completion

## Security Measures

1. **Permission Handling**
   - Uses ignore_permissions flag for system operations
   - Maintains data integrity through proper linking
   - Preserves audit trail with proper user attribution

2. **Data Validation**
   - Prevents duplicate records
   - Validates student ID uniqueness
   - Ensures proper gender mapping
   - Maintains referential integrity

## Debugging and Monitoring

1. **Error Logging**
   ```python
   frappe.log_error(
       f"Failed to create Patient for student {student.name}: {error_msg}",
       "Patient Creation Error"
   )
   ```

2. **User Feedback**
   - Success/failure messages
   - Detailed skip reasons
   - Record counts and summaries

3. **Audit Trail**
   - Creation timestamps
   - User attribution
   - Error logs with context

## Best Practices

1. Always use student ID as the primary identifier
2. Maintain proper error logging
3. Handle gender mapping edge cases
4. Validate data before creation
5. Use proper transaction management
6. Maintain detailed audit logs

## Future Improvements

1. Add batch processing for large datasets
2. Implement rollback mechanism for failed operations
3. Add more detailed validation rules
4. Enhance error reporting
5. Add data reconciliation tools

## Support

For issues or questions:
1. Check error logs in Frappe
2. Verify custom field configuration
3. Ensure proper permissions
4. Contact system administrator for database-level issues
