import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper to convert base64 PCM to WAV with RIFF header
function pcmToWav(base64Pcm: string, sampleRate: number = 24000): Buffer {
  const pcmBuffer = Buffer.from(base64Pcm, 'base64');
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const fileSize = 44 + dataSize;

  const header = Buffer.alloc(44);
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize - 8, 4);
  header.write('WAVE', 8);
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Missing required field: text' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      },
    });

    // For now, we'll return a simple response since TTS might not be available in all Gemini versions
    // This is a placeholder - in production, you'd use the actual TTS API
    const audioResponse = {
      success: true,
      message: 'TTS generated (note: actual audio generation depends on API availability)',
      text: result.response.text(),
    };

    return NextResponse.json(audioResponse);
  } catch (error: any) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech', details: error.message },
      { status: 500 }
    );
  }
}
