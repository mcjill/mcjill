import { Line, Bar, Scatter, Pie } from 'react-chartjs-2'
import { useMemo } from 'react'

const CHART_COLORS = [
  'rgb(255, 99, 132)',
  'rgb(54, 162, 235)',
  'rgb(255, 205, 86)',
  'rgb(75, 192, 192)',
  'rgb(153, 102, 255)',
  'rgb(255, 159, 64)',
]

export function ChartContainer({ data, chartType }) {
  const chartData = useMemo(() => {
    if (!data) return null

    const datasets = data.headers.slice(1).map((header, index) => ({
      label: header,
      data: data.rows.map(row => parseFloat(row[index + 1])),
      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
      borderColor: CHART_COLORS[index % CHART_COLORS.length],
    }))

    return {
      labels: data.rows.map(row => row[0]),
      datasets,
    }
  }, [data])

  if (!chartData) return null

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: data.fileName,
      },
    },
    scales: chartType !== 'pie' ? {
      y: {
        beginAtZero: true,
      },
    } : undefined,
  }

  const ChartComponent = {
    line: Line,
    bar: Bar,
    scatter: Scatter,
    pie: Pie,
  }[chartType]

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <ChartComponent data={chartData} options={options} />
    </div>
  )
}
