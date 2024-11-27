import { useState, useCallback } from 'react'
import Papa from 'papaparse'

export function FileUploader({ onDataLoaded }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((file) => {
    Papa.parse(file, {
      complete: (results) => {
        const headers = results.data[0]
        const rows = results.data.slice(1).filter(row => row.some(cell => cell !== ''))
        
        onDataLoaded({
          headers,
          rows,
          fileName: file.name
        })
      },
      header: false
    })
  }, [onDataLoaded])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/csv') {
      handleFile(file)
    }
  }, [handleFile])

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="space-y-4">
        <div className="text-gray-600">
          {isDragging ? (
            'Drop your CSV file here'
          ) : (
            <>
              <p>Drag and drop your CSV file here, or</p>
              <label className="inline-block px-4 py-2 mt-2 text-sm font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700">
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileInput}
                />
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
