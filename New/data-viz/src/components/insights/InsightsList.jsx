import React from 'react';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const INSIGHT_ICONS = {
  summary: ChartBarIcon,
  data_quality: ExclamationTriangleIcon,
  correlation: ArrowsRightLeftIcon,
  clustering: UserGroupIcon,
};

const INSIGHT_COLORS = {
  summary: 'text-blue-700 bg-blue-50',
  data_quality: 'text-yellow-700 bg-yellow-50',
  correlation: 'text-purple-700 bg-purple-50',
  clustering: 'text-green-700 bg-green-50',
};

export function InsightsList({ insights }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">AI-Generated Insights</h2>
      
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = INSIGHT_ICONS[insight.type] || ChartBarIcon;
          const colorClasses = INSIGHT_COLORS[insight.type] || 'text-gray-700 bg-gray-50';
          
          return (
            <div
              key={index}
              className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50"
            >
              <div className={`flex-shrink-0 p-1.5 rounded-lg ${colorClasses}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-900">{insight.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
