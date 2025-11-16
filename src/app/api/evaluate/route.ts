import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { phase, prompt, messages, coverage, canvasSummary, canvasPngBase64 } =
      await request.json();

    if (!phase || !prompt || !messages || !coverage) {
      return NextResponse.json(
        { error: 'Missing required fields: phase, prompt, messages, coverage' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const systemInstruction = `You are an expert product design interviewer. Evaluate this design challenge session and produce compact JSON adhering exactly to this schema:

{
  "rubric": {
    "problem_framing": 1-5,
    "idea_breadth": 1-5,
    "systems_thinking": 1-5,
    "prioritization": 1-5,
    "metrics_discipline": 1-5,
    "communication": 1-5,
    "velocity_with_rigor": 1-5
  },
  "strengths": [string],
  "weaknesses": [string],
  "drills": [{"title": string, "time": number, "description": string}],
  "narrative": string
}

Provide specific, actionable feedback. Reference the canvas artifacts if provided. Be constructive but honest.

Design Prompt: ${prompt}
Coverage Tags Completed: ${Object.entries(coverage)
      .filter(([_, val]) => val)
      .map(([key]) => key)
      .join(', ') || 'none'}
Canvas Summary: ${canvasSummary ? `${canvasSummary.elementsCount || 0} elements created (${canvasSummary.rectanglesCount || 0} rectangles, ${canvasSummary.textCount || 0} text labels, ${canvasSummary.arrowsCount || 0} arrows). Labels: ${canvasSummary.titles?.join(', ') || 'none'}` : 'No canvas activity'}`;

    const conversationHistory = messages
      .map((msg: any) => `${msg.sender}: ${msg.text}`)
      .join('\n');

    const fullPrompt = `${conversationHistory}

Based on the above session, generate the evaluation JSON.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      systemInstruction,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text();

    try {
      const evaluation = JSON.parse(responseText);
      return NextResponse.json(evaluation);
    } catch (parseError) {
      console.error('Failed to parse evaluation JSON:', parseError);
      return NextResponse.json({
        error: 'Failed to parse evaluation response',
        raw: responseText,
      });
    }
  } catch (error: any) {
    console.error('Evaluate API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate evaluation', details: error.message },
      { status: 500 }
    );
  }
}
