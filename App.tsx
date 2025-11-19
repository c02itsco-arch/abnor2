import React, { useState } from 'react';
import { CsvUploader } from './components/CsvUploader';
import { AnomalyTable } from './components/AnomalyTable';
import { AnomalyChart } from './components/AnomalyChart';
import { detectAnomalies } from './services/geminiService';
import { saveTransactions } from './services/dbService';
import { CsvRow, AnalysisResult, AppState } from './types';
import { BrainCircuit, RefreshCw, ShieldAlert, Database } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [rawCsvData, setRawCsvData] = useState<CsvRow[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleDataParsed = async (data: CsvRow[]) => {
    setRawCsvData(data);
    setErrorMsg(null);
    
    try {
      // Step 1: Save to Database
      setAppState(AppState.PARSING); // Using PARSING as "Saving" state here visually
      setStatusMessage("Saving transactions to Supabase...");
      
      // Non-blocking save or blocking? Let's block to ensure data integrity before analysis
      // We wrap in try-catch but allow continuing analysis even if DB fails (optional choice)
      try {
        await saveTransactions(data);
      } catch (dbError: any) {
        console.error("DB Save failed:", dbError);
        // We might want to show a warning but continue, or stop. 
        // Let's continue but maybe show a toast. For now, we just log it to console
        // and proceed to analysis to not block the user experience if DB is down.
      }

      // Step 2: Analyze with Gemini
      setAppState(AppState.ANALYZING);
      setStatusMessage("Analyzing data with Gemini AI...");
      
      const result = await detectAnomalies(data);
      setAnalysisResult(result);
      setAppState(AppState.SUCCESS);

    } catch (err: any) {
      setErrorMsg(err.message);
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setRawCsvData([]);
    setAnalysisResult(null);
    setErrorMsg(null);
    setStatusMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Anomaly Detector AI</h1>
          </div>
          {appState !== AppState.IDLE && (
            <button 
              onClick={resetApp}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              New Analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Analysis Failed</h3>
              <p className="text-sm text-red-600 mt-1">{errorMsg}</p>
              <button onClick={resetApp} className="mt-2 text-xs font-semibold text-red-700 underline">Try Again</button>
            </div>
          </div>
        )}

        {/* State: Idle (Upload) */}
        {appState === AppState.IDLE && (
          <div className="flex flex-col items-center justify-center py-12 fade-in">
            <div className="text-center max-w-lg mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Detect Financial Anomalies with AI</h2>
              <p className="text-slate-500 text-lg">
                Upload your CSV (BA, Monthly, ActCode, Amount) and let Gemini AI analyze patterns and flag irregularities instantly.
              </p>
            </div>
            <CsvUploader 
              onDataParsed={handleDataParsed} 
              onError={(msg) => { setErrorMsg(msg); setAppState(AppState.IDLE); }}
              isLoading={false}
            />
          </div>
        )}

        {/* State: Processing (Saving to DB or Analyzing) */}
        {(appState === AppState.PARSING || appState === AppState.ANALYZING) && (
          <div className="flex flex-col items-center justify-center py-24">
            {appState === AppState.PARSING ? (
               <div className="relative">
                 <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
                 <Database className="w-6 h-6 text-indigo-500 absolute top-5 left-5 animate-pulse" />
               </div>
            ) : (
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-6"></div>
            )}
            
            <h2 className="text-2xl font-bold text-slate-700">{statusMessage}</h2>
            <p className="text-slate-500 mt-2">
              {appState === AppState.PARSING 
                ? "Securely storing transaction records..." 
                : "Detecting outliers and generating explanations in Thai."}
            </p>
          </div>
        )}

        {/* State: Success (Dashboard) */}
        {appState === AppState.SUCCESS && analysisResult && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Analysis Complete</h2>
              <p className="text-blue-100 text-lg leading-relaxed max-w-4xl">
                {analysisResult.summary}
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Chart Section - Spans 3 cols on mobile, 2 on lg */}
              <div className="lg:col-span-3">
                <AnomalyChart 
                  data={rawCsvData} 
                  anomalies={analysisResult.anomalies} 
                />
              </div>

              {/* Table Section - Full width */}
              <div className="lg:col-span-3">
                <AnomalyTable anomalies={analysisResult.anomalies} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;