import { GoogleGenerativeAI } from "@google/generative-ai";
import { nanoid } from "nanoid";

import { BlocksArrayZ } from "../validators/policies.schema.js";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

const PROMPT_PREFIX = `Return JSON array of blocks with {id,type,title?,content}; keep lists as arrays; professional corporate ESG tone.`;

function extractJSON(text) {
  // Strip code fences if present
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = m ? m[1] : text;
  // Try to find the first [ and last ]
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function generatePolicyBlocks(topic) {
  const prompt = [
    PROMPT_PREFIX,
    "",
    `Topic: ${topic}`,
    "",
    `Each block: { id: short string, type: "heading"|"paragraph"|"list", title?: string, content: string | string[] }`,
    `Only output valid JSON array; do not add explanations.`
  ].join("\n");

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: Number(process.env.GEMINI_TEMP ?? 0.3),
        maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 8192),
        responseMimeType: "application/json"
      }
    });

    const txt = result.response?.text?.() ?? "";
    const json = extractJSON(txt);

    // Validate with Zod
    const blocks = BlocksArrayZ.parse(
      json.map((b, i) => ({
        id: b.id || nanoid(8),
        type: b.type,
        title: b.title,
        content: b.content,
        order: i + 1
      }))
    );

    return blocks;
  } catch (err) {
    const e = new Error("Upstream AI provider returned invalid JSON.");
    e.code = "GEMINI_PARSE";
    e.details = err?.message;
    throw e;
  }
}
