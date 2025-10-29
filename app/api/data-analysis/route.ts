import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { resumeDetails } = await req.json();
    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

    const prompt = `You are an expert resume and job-fit analyst.
    Analyze this resume and provide comprehensive feedback in this JSON format:

    Resume Text:
    ${resumeDetails?.resumeText || 'No resume text provided'}

    Provide analysis in this JSON format:
    {
      "overallScore": 85,
      "strengths": ["strength1", "strength2", "strength3"],
      "gaps": ["gap1", "gap2", "gap3"],
      "recommendations": ["rec1", "rec2", "rec3"],
      "atsScore": 78
    }`;

    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysisText = response.text() || 'No analysis generated'

    try {
      const analysis = JSON.parse(analysisText)
      return NextResponse.json({ analysis });
    } catch (parseError) {
      const fallbackAnalysis = {
        overallScore: 75,
        strengths: ["Resume processed successfully"],
        gaps: ["Analysis format parsing failed"],
        recommendations: ["Please review the analysis manually"],
        atsScore: 70
      }
      return NextResponse.json({ analysis: fallbackAnalysis });
    }
  } catch (error: any) {
    const status = error?.status || 500
    if (status === 429) {
      return NextResponse.json({ error: 'LLM quota exceeded. Please retry shortly.' }, { status })
    }
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume', details: error.message },
      { status }
    );
  }
}