import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { phase, prompt, messages, coverage, canvasSummary } = await request.json();

    if (!phase || !prompt || !messages || !coverage) {
      return NextResponse.json(
        { error: 'Missing required fields: phase, prompt, messages, coverage' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const systemInstruction = `You are a product design challenge coach. Guide without dictating solutions. Enforce current phase. Keep the strong constraint central. Probe for: problem framing, constraints, users, ideation breadth, systems thinking, metrics, accessibility. Prefer questions over advice. Return a short nudge (<= 2 sentences). Escalate specificity when the user stalls. Reference canvas artifacts if present (e.g., 'label your error state').

Current Phase: ${phase}
Design Prompt: ${prompt}
Coverage Tags: ${Object.entries(coverage)
      .filter(([_, val]) => val)
      .map(([key]) => key)
      .join(', ') || 'none'}
Canvas Summary: ${canvasSummary ? `${canvasSummary.elementsCount || 0} elements (${canvasSummary.rectanglesCount || 0} rectangles, ${canvasSummary.textCount || 0} text labels, ${canvasSummary.arrowsCount || 0} arrows). Labels: ${canvasSummary.titles?.join(', ') || 'none'}` : 'No canvas activity yet'}`;

    // Build conversation history
    const conversationHistory = messages
      .map((msg: any) => `${msg.sender}: ${msg.text}`)
      .join('\n');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: conversationHistory }] }],
      systemInstruction,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      },
    });

    const nudge = result.response.text();

    return NextResponse.json({ nudge });
  } catch (error: any) {
    console.error('Coach API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate coach response', details: error.message },
      { status: 500 }
    );
  }
}
