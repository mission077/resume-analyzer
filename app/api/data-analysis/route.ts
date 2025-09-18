import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { resumeDetails } = await req.json();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 20000,
      temperature: 1,
      system: "You are an expert focus and productivity analyst. Analyze the provided focus test results and provide insights on attention patterns, areas for improvement, and recommendations for better focus.",
      messages: [
        {
          role: "user",
          content: `Analyze these focus test results: ${JSON.stringify(resumeDetails)}`
        }
      ]
    });

    return NextResponse.json({ 
      analysis: message.content[0].type === 'text' ? message.content[0].text : 'Analysis completed'
    });
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze focus results' },
      { status: 500 }
    );
  }
}