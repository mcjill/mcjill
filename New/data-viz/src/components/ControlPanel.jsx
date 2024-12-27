import { RadioGroup } from '@headlessui/react'

const chartTypes = [
  { id: 'bar', name: 'Bar Chart' },
  { id: 'line', name: 'Line Chart' },
  { id: 'scatter', name: 'Scatter Plot' },
  { id: 'pie', name: 'Pie Chart' },
]

export function ControlPanel({ chartType, onChartTypeChange }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Chart Controls</h2>
      
      <div className="space-y-4">
        <RadioGroup value={chartType} onChange={onChartTypeChange}>
          <RadioGroup.Label className="text-sm font-medium text-gray-700">
            Chart Type
          </RadioGroup.Label>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {chartTypes.map((type) => (
              <RadioGroup.Option
                key={type.id}
                value={type.id}
                className={({ active, checked }) =>
                  `${
                    active ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  } ${
                    checked
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-900 hover:bg-gray-50'
                  } cursor-pointer rounded-lg px-4 py-2 shadow-sm focus:outline-none`
                }
              >
                {({ checked }) => (
                  <div className="flex items-center justify-center">
                    <div className="text-sm">
                      <RadioGroup.Label
                        as="p"
                        className={`font-medium ${
                          checked ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {type.name}
                      </RadioGroup.Label>
                    </div>
                  </div>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}
