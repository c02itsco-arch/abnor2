import React, { useCallback } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import { CsvRow } from '../types';
import { cn } from '../utils/cn';

interface CsvUploaderProps {
  onDataParsed: (data: CsvRow[]) => void;
  onError: (error: string) => void;
  isLoading: boolean;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ onDataParsed, onError, isLoading }) => {
  
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Automatically convert numbers
      complete: (results) => {
        if (results.errors.length > 0) {
          onError(`CSV Parsing Error: ${results.errors[0].message}`);
          return;
        }

        const data = results.data as CsvRow[];
        
        // Basic validation
        if (data.length === 0) {
          onError("The CSV file is empty.");
          return;
        }
        
        const requiredCols = ['BA', 'monthly', 'actCode', 'amount'];
        const headers = results.meta.fields || [];
        const missing = requiredCols.filter(col => !headers.includes(col));

        if (missing.length > 0) {
          onError(`Missing required columns: ${missing.join(', ')}`);
          return;
        }

        onDataParsed(data);
      },
      error: (err) => {
        onError(`File Read Error: ${err.message}`);
      }
    });
  }, [onDataParsed, onError]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label 
        className={cn(
          "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          isLoading ? "opacity-50 cursor-not-allowed bg-gray-50" : "border-gray-300 bg-white hover:bg-gray-50 hover:border-primary"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isLoading ? (
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          ) : (
            <UploadCloud className="w-12 h-12 mb-4 text-gray-400" />
          )}
          <p className="mb-2 text-sm text-gray-500 font-semibold">
            {isLoading ? "Processing..." : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-gray-500">CSV file (BA, monthly, actCode, amount)</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".csv" 
          onChange={handleFileUpload} 
          disabled={isLoading}
        />
      </label>
      
      <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
        <FileText className="w-4 h-4 mt-0.5 text-blue-500" />
        <div>
          <p className="font-medium">Expected CSV Format:</p>
          <code className="text-xs bg-white px-1 py-0.5 rounded border">BA,monthly,actCode,amount</code>
        </div>
      </div>
    </div>
  );
};