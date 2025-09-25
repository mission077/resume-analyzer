import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { resumeDetails } = await req.json();
    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert resume and job-fit analyst.
    Given this extracted resume/job data, analyze strengths, gaps, and provide clear, actionable recommendations:

    Company: ${resumeDetails?.companyName || 'N/A'}
    Job Title: ${resumeDetails?.jobTitle || 'N/A'}
    Job Description: ${resumeDetails?.jobDescription || 'N/A'}

    Resume Text:
    ${resumeDetails?.resumeText || 'No resume text provided'}

    Return a concise analysis in Markdown with headings and bullet points.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ analysis: text });
  } catch (error: any) {
    const status = error?.status || 500
    if (status === 429) {
      return NextResponse.json({ error: 'LLM quota exceeded. Please retry shortly.' }, { status })
    }
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { status }
    );
  }
}