import { useState } from 'react'
import Papa from 'papaparse'
import { analyzeDataset } from './utils/dataAnalysis'
import { DataVisualizations } from './components/DataVisualizations'

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setAnalysis(null);
    }
  };

  const processFile = () => {
    if (!selectedFile) return;

    Papa.parse(selectedFile, {
      complete: (result) => {
        if (result.errors.length) {
          setError('Error parsing CSV file');
          return;
        }
        setData(result.data);
        const analysisResults = analyzeDataset(result.data);
        if (analysisResults.success) {
          setAnalysis(analysisResults);
        } else {
          setError(analysisResults.error);
        }
      },
      header: true,
      skipEmptyLines: true,
      error: (error) => {
        setError('Error reading file: ' + error.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            School Performance Analysis Dashboard
          </h1>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl py-6 px-4">
        <div className="bg-white p-8 rounded-lg shadow">
          {/* File Upload Section */}
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <label className="relative cursor-pointer">
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Upload student performance data (CSV)'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Required: Student grades, attendance, and basic information
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}
              {selectedFile && (
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={processFile}
                  >
                    Analyze Performance
                  </button>
                </div>
              )}
            </div>
          </div>

          {analysis && analysis.success && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-center">Class Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
                    <p className="mt-1 text-lg font-semibold">{analysis.summary.totalStudents}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Academic Period</h3>
                    <p className="mt-1 text-lg font-semibold">{analysis.summary.academicPeriod}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Overall Average</h3>
                    <p className="mt-1 text-lg font-semibold">{analysis.summary.overallAverage}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Passing Rate</h3>
                    <p className="mt-1 text-lg font-semibold">{analysis.summary.passingRate}%</p>
                  </div>
                </div>
              </div>

              {/* Data Visualizations */}
              <div className="mt-8">
                <DataVisualizations data={data} />
              </div>

              {/* Detailed Analysis */}
              <div className="space-y-6">
                {analysis.insights.map((category, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 text-center">
                      {category.category}
                    </h3>
                    <ul className="space-y-2">
                      {category.insights.map((insight, i) => (
                        <li 
                          key={i} 
                          className={`text-gray-600 ${insight.startsWith('  ') ? 'ml-4' : ''}`}
                        >
                          {insight.startsWith('  ') ? insight.slice(2) : `• ${insight}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
