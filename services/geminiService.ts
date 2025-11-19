import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CsvRow, AnalysisResult } from "../types";

// Initialize API Client
// Note: Vercel/Vite exposes env vars with VITE_ prefix on the client side.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing VITE_GEMINI_API_KEY in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const ANOMALY_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A brief summary of the overall data quality and findings in Thai language.",
    },
    anomalies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER, description: "The index of the row in the provided dataset (0-based)." },
          actCode: { type: Type.STRING },
          monthly: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          reason: { type: Type.STRING, description: "Explanation in Thai language why this is an anomaly." },
          severity: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
        },
        required: ["id", "actCode", "monthly", "amount", "reason", "severity"]
      }
    }
  },
  required: ["summary", "anomalies"]
};

export const detectAnomalies = async (data: CsvRow[]): Promise<AnalysisResult> => {
  if (!apiKey) throw new Error("API Key is missing. Please check your environment variables.");

  // Optimize payload: limit rows if too large to prevent token overflow.
  // For a real app, you might summarize or batch, but here we take a robust sample.
  const MAX_ROWS = 1500; 
  const sampleData = data.slice(0, MAX_ROWS); 
  
  const csvString = JSON.stringify(sampleData);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: `
            You are an expert financial auditor AI. 
            Analyze the following JSON dataset of account transactions.
            Columns: BA (Business Area), monthly (YYYYMM), actCode (Account Code), amount.
            
            Task:
            1. Identify statistical anomalies in the 'amount' field. Look for values that are significantly higher or lower than the average for similar 'actCode' or general distribution.
            2. Flag at most top 10 significant anomalies.
            3. Provide the output in strictly valid JSON format matching the schema.
            4. The 'reason' and 'summary' fields MUST be in Thai language (ภาษาไทย).
            
            Dataset (First ${sampleData.length} rows):
            ${csvString}
          `
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANOMALY_SCHEMA,
        temperature: 0.1, // Low temperature for consistent analytical results
      }
    });

    let resultText = response.text;
    if (!resultText) throw new Error("Empty response from Gemini.");

    // Robust Parsing: Remove markdown code blocks if Gemini includes them despite responseMimeType
    resultText = resultText.replace(/```json\n?|```/g, '').trim();

    const parsedResult = JSON.parse(resultText) as AnalysisResult;
    return parsedResult;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to analyze data with AI.");
  }
};