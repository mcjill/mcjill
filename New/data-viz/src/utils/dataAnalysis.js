// Statistical analysis utilities for educational data
const calculateMean = (values) => {
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

const calculateMedian = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const calculateStandardDeviation = (values) => {
  const mean = calculateMean(values);
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = calculateMean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
};

const calculatePercentile = (value, array) => {
  const sorted = [...array].sort((a, b) => a - b);
  const index = sorted.findIndex(item => item >= value);
  return Math.round((index / sorted.length) * 100);
};

const calculateGradeDistribution = (grades) => {
  const distribution = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0
  };

  grades.forEach(grade => {
    if (grade >= 90) distribution.A++;
    else if (grade >= 80) distribution.B++;
    else if (grade >= 70) distribution.C++;
    else if (grade >= 60) distribution.D++;
    else distribution.F++;
  });

  // Convert to percentages
  const total = grades.length;
  Object.keys(distribution).forEach(grade => {
    distribution[grade] = ((distribution[grade] / total) * 100).toFixed(1);
  });

  return distribution;
};

const calculateImprovement = (currentScores, previousScores) => {
  const currentMean = calculateMean(currentScores);
  const previousMean = calculateMean(previousScores);
  return ((currentMean - previousMean) / previousMean) * 100;
};

const findOutliers = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(value => value < lowerBound || value > upperBound);
};

export function analyzeDataset(data) {
  try {
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'No data provided'
      };
    }

    // Extract subject columns (excluding non-grade columns)
    const subjects = Object.keys(data[0]).filter(key => 
      !['Student_ID', 'Name', 'Class', 'Term', 'Year', 'Attendance'].includes(key)
    );

    // Basic statistics calculations
    const totalStudents = data.length;
    const academicPeriod = `${data[0].Term} Term ${data[0].Year}`;

    // Calculate overall performance metrics
    const allGrades = data.flatMap(student => 
      subjects.map(subject => parseFloat(student[subject]))
    ).filter(grade => !isNaN(grade));

    const overallAverage = calculateMean(allGrades);
    const passingRate = (allGrades.filter(grade => grade >= 60).length / allGrades.length) * 100;

    // Calculate subject-wise performance
    const subjectPerformance = subjects.map(subject => {
      const grades = data.map(student => parseFloat(student[subject])).filter(grade => !isNaN(grade));
      return {
        subject,
        average: calculateMean(grades),
        median: calculateMedian(grades),
        stdDev: calculateStandardDeviation(grades),
        passingRate: (grades.filter(grade => grade >= 60).length / grades.length) * 100
      };
    });

    // Identify top performers
    const studentAverages = data.map(student => {
      const average = calculateMean(
        subjects.map(subject => parseFloat(student[subject]))
      );
      return { name: student.Name, average };
    }).sort((a, b) => b.average - a.average);

    // Analyze attendance correlation
    const attendanceCorrelation = calculateAttendanceCorrelation(data, subjects);

    // Generate insights
    const insights = [
      {
        category: 'Overall Performance',
        insights: [
          `Class average across all subjects: ${overallAverage.toFixed(1)}%`,
          `Overall passing rate: ${passingRate.toFixed(1)}%`,
          ...generatePerformanceInsights(subjectPerformance)
        ]
      },
      {
        category: 'Subject Analysis',
        insights: subjects.map(subject => {
          const perf = subjectPerformance.find(p => p.subject === subject);
          return `${subject}: Average ${perf.average.toFixed(1)}% (Passing Rate: ${perf.passingRate.toFixed(1)}%)`;
        })
      },
      {
        category: 'Student Recognition',
        insights: [
          'Top Performing Students:',
          ...studentAverages.slice(0, 5).map(student => 
            `  ${student.name} (Average: ${student.average.toFixed(1)}%)`
          )
        ]
      },
      {
        category: 'Areas for Improvement',
        insights: generateImprovementSuggestions(subjectPerformance, attendanceCorrelation)
      }
    ];

    return {
      success: true,
      summary: {
        totalStudents,
        academicPeriod,
        overallAverage: overallAverage.toFixed(1),
        passingRate: passingRate.toFixed(1)
      },
      insights
    };
  } catch (error) {
    return {
      success: false,
      error: 'Error analyzing data: ' + error.message
    };
  }
}

// Helper functions
function calculateAttendanceCorrelation(data, subjects) {
  const studentPerformances = data.map(student => {
    const avgGrade = calculateMean(
      subjects.map(subject => parseFloat(student[subject]))
    );
    return {
      attendance: parseFloat(student.Attendance),
      performance: avgGrade
    };
  });

  const attendanceAvg = calculateMean(studentPerformances.map(s => s.attendance));
  const performanceAvg = calculateMean(studentPerformances.map(s => s.performance));

  return {
    correlation: studentPerformances.every(s => s.attendance === attendanceAvg) ? 0 :
      studentPerformances.reduce((acc, curr) => 
        acc + (curr.attendance - attendanceAvg) * (curr.performance - performanceAvg), 0
      ) / (studentPerformances.length * 
        Math.sqrt(calculateVariance(studentPerformances.map(s => s.attendance)) * 
        calculateVariance(studentPerformances.map(s => s.performance)))),
    averageAttendance: attendanceAvg
  };
}

function calculateVariance(numbers) {
  const mean = calculateMean(numbers);
  return calculateMean(numbers.map(num => Math.pow(num - mean, 2)));
}

function generatePerformanceInsights(subjectPerformance) {
  const insights = [];
  
  // Find strongest and weakest subjects
  const sortedByAverage = [...subjectPerformance].sort((a, b) => b.average - a.average);
  insights.push(`Strongest subject: ${sortedByAverage[0].subject} (Average: ${sortedByAverage[0].average.toFixed(1)}%)`);
  insights.push(`Subject needing most attention: ${sortedByAverage[sortedByAverage.length - 1].subject} (Average: ${sortedByAverage[sortedByAverage.length - 1].average.toFixed(1)}%)`);

  // Identify subjects with high variance
  const highVarianceSubjects = subjectPerformance
    .filter(subject => subject.stdDev > 15)
    .map(subject => subject.subject);
  
  if (highVarianceSubjects.length > 0) {
    insights.push(`High performance variation in: ${highVarianceSubjects.join(', ')}`);
  }

  return insights;
}

function generateImprovementSuggestions(subjectPerformance, attendanceCorrelation) {
  const suggestions = [];

  // Identify subjects with low passing rates
  const lowPerformingSubjects = subjectPerformance
    .filter(subject => subject.passingRate < 70)
    .sort((a, b) => a.passingRate - b.passingRate);

  if (lowPerformingSubjects.length > 0) {
    suggestions.push('Priority Areas for Improvement:');
    lowPerformingSubjects.forEach(subject => {
      suggestions.push(`  ${subject.subject}: Focus on increasing passing rate (currently ${subject.passingRate.toFixed(1)}%)`);
    });
  }

  // Attendance correlation insights
  if (attendanceCorrelation.correlation > 0.3) {
    suggestions.push('Attendance Impact:');
    suggestions.push(`  Strong correlation between attendance and performance (correlation: ${attendanceCorrelation.correlation.toFixed(2)})`);
    if (attendanceCorrelation.averageAttendance < 90) {
      suggestions.push(`  Recommend improving class attendance (current average: ${attendanceCorrelation.averageAttendance.toFixed(1)}%)`);
    }
  }

  // Add general suggestions if no specific issues found
  if (suggestions.length === 0) {
    suggestions.push('Overall Performance is Good');
    suggestions.push('  Continue maintaining current teaching methods and student support');
    suggestions.push('  Consider introducing advanced topics for high-performing students');
  }

  return suggestions;
}
