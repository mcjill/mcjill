import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Card, Title as TremorTitle, DonutChart } from "@tremor/react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
};

export function DataVisualizations({ data }) {
  if (!data || data.length === 0) return null;

  // Extract subject columns (excluding non-grade columns)
  const subjects = Object.keys(data[0]).filter(key => 
    !['Student_ID', 'Name', 'Class', 'Term', 'Year', 'Attendance'].includes(key)
  );

  // Calculate subject averages
  const subjectAverages = subjects.reduce((acc, subject) => {
    acc[subject] = data.reduce((sum, student) => sum + parseFloat(student[subject]), 0) / data.length;
    return acc;
  }, {});

  // Grade distribution data
  const gradeRanges = {
    A: { min: 90, max: 100, count: 0 },
    B: { min: 80, max: 89, count: 0 },
    C: { min: 70, max: 79, count: 0 },
    D: { min: 60, max: 69, count: 0 },
    F: { min: 0, max: 59, count: 0 }
  };

  // Calculate overall grade distribution
  subjects.forEach(subject => {
    data.forEach(student => {
      const grade = parseFloat(student[subject]);
      for (const [letter, range] of Object.entries(gradeRanges)) {
        if (grade >= range.min && grade <= range.max) {
          range.count++;
          break;
        }
      }
    });
  });

  // Prepare data for charts
  const subjectPerformanceData = {
    labels: subjects,
    datasets: [
      {
        label: 'Class Average',
        data: subjects.map(subject => subjectAverages[subject]),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1,
      },
    ],
  };

  // Student performance distribution
  const gradeDistributionData = {
    labels: Object.keys(gradeRanges),
    datasets: [
      {
        data: Object.values(gradeRanges).map(range => range.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Individual student performance
  const studentPerformanceData = {
    labels: data.map(student => student.Name),
    datasets: [
      {
        label: 'Average Score',
        data: data.map(student => {
          const scores = subjects.map(subject => parseFloat(student[subject]));
          return scores.reduce((a, b) => a + b) / scores.length;
        }),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  // Attendance correlation data
  const attendanceData = data.map(student => ({
    name: student.Name,
    attendance: parseFloat(student.Attendance),
    performance: subjects.reduce((sum, subject) => sum + parseFloat(student[subject]), 0) / subjects.length,
  }));

  return (
    <div className="space-y-8">
      {/* Subject Performance Chart */}
      <Card>
        <TremorTitle>Subject Performance Overview</TremorTitle>
        <div className="h-80 mt-4">
          <Bar options={chartOptions} data={subjectPerformanceData} />
        </div>
      </Card>

      {/* Grade Distribution Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <TremorTitle>Grade Distribution</TremorTitle>
          <div className="h-64 mt-4">
            <Pie data={gradeDistributionData} />
          </div>
        </Card>

        <Card>
          <TremorTitle>Attendance vs Performance</TremorTitle>
          <DonutChart
            className="h-64 mt-4"
            data={attendanceData}
            category="performance"
            index="name"
            valueFormatter={(number) => number.toFixed(1) + '%'}
          />
        </Card>
      </div>

      {/* Student Performance Trend */}
      <Card>
        <TremorTitle>Individual Student Performance</TremorTitle>
        <div className="h-80 mt-4">
          <Line options={chartOptions} data={studentPerformanceData} />
        </div>
      </Card>
    </div>
  );
}
