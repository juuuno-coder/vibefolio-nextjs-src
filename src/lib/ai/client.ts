
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables.");
}

export const genAI = new GoogleGenerativeAI(apiKey || "");

export const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const visionModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
