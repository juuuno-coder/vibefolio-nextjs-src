import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const runtime = 'edge'; // Optional: Use Edge Runtime if supported, helps with timeouts

export async function POST(req: NextRequest) {
  // API 키가 없으면 즉시 종료하여 리소스 낭비 방지
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ 
      error: "AI 서비스 점검 중",
      message: "현재 AI 서비스 점검 중입니다."
    }, { status: 200 });
  }

  try {
    const { type, topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing");
        // Fallback for development if key is missing (optional)
        return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use efficient model

    let prompt = "";
    
    if (type === 'lean-canvas') {
        prompt = `
You are a professional Startup Consultant.
Please generate a Lean Canvas for a service/product idea: "${topic}"

Current Language: Korean (한국어) - **MUST OUTPUT IN KOREAN**

Output Format: JSON only. DO NOT include any markdown code blocks (like \`\`\`json). Just the raw JSON string.
Structure:
{
  "problem": "3 key problems (bullet points using numbers)",
  "customerSegments": "Target customers (bullet points)",
  "uniqueValueProposition": "Single clear, compelling message that states why you are different and worth buying.",
  "solution": "Top 3 features (bullet points)",
  "channels": "Path to customers (bullet points)",
  "revenueStreams": "Revenue model (bullet points)",
  "costStructure": "Customer acquisition costs, distribution costs, hosting, people, etc. (bullet points)",
  "keyMetrics": "Key activities you measure (bullet points)",
  "unfairAdvantage": "Something that cannot be easily copied or bought (bullet points)"
}
Start JSON:
`;
    } else if (type === 'persona') {
        prompt = `
You are a UX Researcher.
Please define a detailed target persona for a service/product idea: "${topic}"

Current Language: Korean (한국어) - **MUST OUTPUT IN KOREAN**

Output Format: JSON only. DO NOT include any markdown code blocks.
Structure:
{
  "name": "Korean Name",
  "age": "e.g., 28세",
  "job": "Specific Job Title",
  "location": "City/District in Korea",
  "quote": "A short, memorable quote representing their pain point.",
  "bio": "A short paragraph (2-3 sentences) describing their lifestyle, personality, and relationship with technology.",
  "goals": ["Goal 1", "Goal 2", "Goal 3"],
  "frustrations": ["Frustration 1", "Frustration 2", "Frustration 3"],
  "brands": ["Brand 1", "Brand 2", "Brand 3", "Brand 4"],
  "mbti": "MBTI Type",
  "imageKeyword": "A single English keyword to search for a stock photo of this person (e.g., 'young asian businessman', 'female student', etc.)"
}
Start JSON:
`;
    } else if (type === 'assistant') {
        prompt = `
You are a professional Content Writing Assistant.
Based on the following request: "${topic}", please write a high-quality draft.

Current Language: Korean (한국어) - **MUST OUTPUT IN KOREAN**

Output Format: JSON only.
Structure:
{
  "title": "Title of the content",
  "content": "Full markdown-formatted content. Use headers, bullet points, and appropriate tone."
}
Start JSON:
`;
    } else {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown if present (Gemini sometimes adds ```json ... ```)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const json = JSON.parse(text);
        
        // For Persona, we need a real image URL. In a real app, we'd use Unsplash API or similar.
        // For now, we'll use a high-quality placeholder based on gender/keyword guess or just generic.
        if (type === 'persona' && json.imageKeyword) {
            // Using Source.unsplash for a random image matching keyword
            json.image = `https://source.unsplash.com/400x400/?portrait,${encodeURIComponent(json.imageKeyword)}`;
            // NOTE: source.unsplash is deprecated/unreliable. We can use a predetermined set or just a generic one.
            // Better approach: Use a reliable placeholder service with keywords, or hardcode a few avatars.
            // Let's use a reliable placeholder for now to avoid broken images.
            json.image = `https://api.dicebear.com/7.x/avataaars/svg?seed=${json.name}&backgroundColor=b6e3f4`; // Cartoon avatar is safe
            // Or try a real photo URL service if available, but DiceBear is safest.
        }

        return NextResponse.json(json);
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Text:", text);
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
