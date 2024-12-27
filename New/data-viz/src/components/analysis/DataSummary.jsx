import React from 'react';
import Plot from 'react-plotly.js';

export function DataSummary({ data, analysis }) {
  if (!data || !analysis) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Dataset Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Dataset Size</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {data.rows.length} rows × {data.headers.length} columns
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Numeric Columns</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {Object.keys(analysis.summary).length}
          </p>
        </div>

        {analysis.clusters && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700">Clusters Detected</h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {analysis.clusters.centroids.length}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Column Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mean</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Median</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Std Dev</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(analysis.summary).map(([column, stats]) => (
                <tr key={column}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{column}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.mean.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.median.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.std.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.min.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.max.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {Object.keys(analysis.correlations).length > 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Correlation Heatmap</h3>
          <Plot
            data={[{
              type: 'heatmap',
              z: Object.values(analysis.correlations).map(row => Object.values(row)),
              x: Object.keys(analysis.correlations),
              y: Object.keys(analysis.correlations),
              colorscale: 'RdBu'
            }]}
            layout={{
              width: 500,
              height: 500,
              title: 'Correlation Matrix',
              xaxis: { side: 'bottom' },
              yaxis: { autorange: 'reversed' }
            }}
            config={{ responsive: true }}
          />
        </div>
      )}
    </div>
  );
}
