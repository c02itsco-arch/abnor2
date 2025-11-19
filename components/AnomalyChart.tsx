import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { CsvRow, AnomalyRecord } from '../types';

interface AnomalyChartProps {
  data: CsvRow[];
  anomalies: AnomalyRecord[];
}

export const AnomalyChart: React.FC<AnomalyChartProps> = ({ data, anomalies }) => {
  // Prepare data for chart
  const anomalyIds = new Set(anomalies.map(a => a.id)); // Assuming ID corresponds to index if coming from array index

  // We need to map the raw data to chart format. 
  // If Gemini returns IDs as indices, we use that. 
  // Otherwise we might need to match by keys. 
  // For this implementation, we assume Gemini 'id' refers to the array index sent.
  
  const chartData = data.slice(0, 2000).map((row, index) => ({ // Slice for performance
    x: row.monthly, 
    y: row.amount,
    index: index,
    isAnomaly: anomalyIds.has(index),
    actCode: row.actCode,
    ...row
  }));

  // Separate for coloring
  const normalData = chartData.filter(d => !d.isAnomaly);
  const anomalyData = chartData.filter(d => d.isAnomaly);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded text-sm">
          <p className="font-bold text-gray-800">Monthly: {d.x}</p>
          <p className="text-blue-600">Amount: {d.y.toLocaleString()}</p>
          <p className="text-gray-600">ActCode: {d.actCode}</p>
          {d.isAnomaly && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded font-medium">
              Anomaly
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribution Analysis (Amount vs Monthly)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="category" 
            dataKey="x" 
            name="Monthly" 
            allowDuplicatedCategory={false}
            tick={{fontSize: 12}}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Amount" 
            unit="" 
            tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          
          <Scatter name="Normal Transactions" data={normalData} fill="#94a3b8" fillOpacity={0.6} shape="circle" />
          <Scatter name="Anomalies" data={anomalyData} fill="#ef4444" shape="cross" r={6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};