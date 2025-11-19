import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AnomalyRecord } from '../types';

interface AnomalyTableProps {
  anomalies: AnomalyRecord[];
}

export const AnomalyTable: React.FC<AnomalyTableProps> = ({ anomalies }) => {
  if (anomalies.length === 0) return null;

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100 bg-red-50/50 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900">Top Detected Anomalies</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ActCode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Reasoning (Thai)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {anomalies.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.actCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.monthly}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium text-red-600">
                  {item.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.severity === 'High' ? 'bg-red-100 text-red-800' :
                    item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {item.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-md whitespace-normal">
                  {item.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};