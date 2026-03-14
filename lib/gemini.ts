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
    model: "gemini-3-flash-preview",
    systemInstruction,
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent(userInput);
  const text = result?.response?.text?.() ?? "";
  if (!text) throw new Error("Empty response from Gemini");
  return parseJsonFromText(text);
}

const GEMINI_MODEL = "gemini-3-flash-preview";

/**
 * Generate JSON with Google Search grounding for real-time, accurate info.
 * Uses REST API with google_search tool for company-specific prep.
 */
export async function generateJsonWithSearch(
  systemInstruction: string,
  userInput: string,
): Promise<{ data: unknown; groundingMetadata?: unknown }> {
  const key = API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not configured",
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: userInput }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { responseMimeType: "application/json" },
    tools: [{ google_search: {} }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      groundingMetadata?: unknown;
    }>;
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Empty response from Gemini");
  const groundingMetadata = json.candidates?.[0]?.groundingMetadata;

  return {
    data: parseJsonFromText(text),
    groundingMetadata,
  };
}
