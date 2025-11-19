export interface CsvRow {
  BA: string;
  monthly: string;
  actCode: string;
  amount: number;
  [key: string]: any; // Allow loose indexing
}

export interface AnomalyRecord {
  id: number; // Original index in the CSV or a generated ID
  actCode: string;
  monthly: string;
  amount: number;
  reason: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface AnalysisResult {
  anomalies: AnomalyRecord[];
  summary: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
