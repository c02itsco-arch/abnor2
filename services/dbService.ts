import { supabase } from './supabaseClient';
import { CsvRow } from '../types';

export const saveTransactions = async (data: CsvRow[]) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    console.warn("Skipping DB save: No Supabase configuration found.");
    return;
  }

  // Map CSV data (camelCase) to Database columns (snake_case)
  const records = data.map(row => ({
    ba: row.BA,
    monthly: row.monthly,
    act_code: row.actCode,
    amount: row.amount
  }));

  // Insert in batches to avoid payload size limits (Supabase handles large batches well, but 1000 is safe)
  const BATCH_SIZE = 1000;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('transactions')
      .insert(batch);

    if (error) {
      console.error("Supabase Insert Error:", error);
      throw new Error(`Database Error: ${error.message}`);
    }
  }
};