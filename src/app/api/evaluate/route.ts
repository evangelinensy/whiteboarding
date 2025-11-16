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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const systemInstruction = `You are an expert product design interviewer specializing in multimodal assessment. Evaluate this design challenge session by analyzing BOTH what they said AND what they drew. Produce compact JSON adhering exactly to this schema:

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
  "communication_breakdown": {
    "naming_clarity": {
      "score": 1-5,
      "feedback": "Did they clearly name screens, components, and UI elements? Examples: 'Home Screen', 'Profile Card', 'Navigation Bar'"
    },
    "pattern_explanation": {
      "score": 1-5,
      "feedback": "Did they explain UX patterns they chose? e.g., 'Using tabs instead of navigation drawer because...'"
    },
    "tradeoff_articulation": {
      "score": 1-5,
      "feedback": "Did they call out design trade-offs? e.g., 'Cards vs list - cards are more visual but take more space'"
    },
    "whiteboard_narration": {
      "score": 1-5,
      "feedback": "Did they verbally explain what they were drawing as they sketched?"
    }
  },
  "whiteboard_analysis": {
    "completeness": "Did they create enough wireframes/flows to convey their solution?",
    "labeling_quality": "Were elements clearly labeled with descriptive names?",
    "flow_clarity": "Did arrows and connections show clear user journeys?"
  },
  "strengths": [string],
  "weaknesses": [string],
  "drills": [{"title": string, "time": number, "description": string}],
  "narrative": string
}

CRITICAL EVALUATION CRITERIA:
1. **Naming**: Did they say things like "This is the Home Screen" or "This card component shows..." vs just drawing silently?
2. **Patterns**: Did they verbalize WHY they chose specific UI patterns? "I'm using cards instead of a list because they allow for richer imagery"
3. **Trade-offs**: Did they articulate pros/cons of their choices?
4. **Speech-Sketch Alignment**: Did their verbal explanation match what they were drawing?

Provide specific, actionable feedback with concrete examples from their transcript and canvas. Be constructive but honest.

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
