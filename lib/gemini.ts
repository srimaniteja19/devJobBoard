import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

export function getGeminiClient() {
  if (!API_KEY) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not configured",
    );
  }
  return new GoogleGenerativeAI(API_KEY);
}

export function isGeminiConfigured(): boolean {
  return !!API_KEY;
}

function parseJsonFromText(text: string): unknown {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  return JSON.parse(s);
}

export async function generateJson(
  systemInstruction: string,
  userInput: string,
): Promise<unknown> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction,
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent(userInput);
  const text = result?.response?.text?.() ?? "";
  if (!text) throw new Error("Empty response from Gemini");
  return parseJsonFromText(text);
}
