# Design Challenge Coach

A local Next.js web app that simulates a 60-minute product design interview exercise with AI coaching, speech-to-text, text-to-speech, and a built-in whiteboard for low-fidelity wireframes.

## Features

- **60-Minute Timer with Phases**: Discovery (20 min), Heads-down (25 min), Presentation (15 min)
- **Speech-to-Text**: Capture your spoken thinking using Web Speech API (Chrome)
- **AI Coaching**: Live coaching from Gemini AI with spoken feedback
- **Whiteboard Canvas**: Draw low-fi wireframes with rectangles, text, arrows, and ellipses
- **Coverage Tracking**: Automatically tracks problem framing, constraints, users, ideation, systems thinking, metrics, and accessibility
- **Structured Evaluation**: Get a detailed scorecard with strengths, weaknesses, and practice drills

## Tech Stack

- **Framework**: Next.js 14 (App Router), React 18
- **AI**: Google Gemini (via @google/generative-ai)
- **Canvas**: HTML5 SVG with React
- **Speech**: Web Speech API (Chrome)
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Chrome browser (for Speech-to-Text)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:

   Edit `.env.local` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in Chrome**:
   ```
   http://localhost:3000
   ```

## Usage

1. **Start the Session**: The timer begins automatically when you load the app
2. **Speak Your Thinking**: Click "Start Listening" to enable speech-to-text
3. **Sketch Wireframes**: Switch to the "Whiteboard" tab to draw low-fi wireframes
   - Use keyboard shortcuts: V (select), R (rectangle), T (text), A (arrow), Space (pan)
   - Create rectangles for frames/components, add text labels, draw arrows
   - Undo/Redo with Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z
   - Export your canvas as PNG
4. **Ask the Coach**: Type questions or click "Ask Coach" during Discovery or Heads-down phases
5. **End & Debrief**: Click "End & Debrief" when done to get your evaluation scorecard

## Whiteboard Features

- **Tools**: Select, Rectangle, Ellipse, Text, Arrow, Pan
- **Operations**: Create, select, move, resize, delete
- **Multi-select**: Drag marquee or Cmd/Ctrl+click
- **Z-order**: Bring to front / send to back
- **Undo/Redo**: Full history stack
- **Export**: PNG download
- **Keyboard Shortcuts**:
  - V: Select tool
  - R: Rectangle tool
  - T: Text tool
  - A: Arrow tool
  - Space: Pan tool
  - Delete/Backspace: Delete selected
  - Cmd/Ctrl+Z: Undo
  - Cmd/Ctrl+Shift+Z: Redo

## API Routes

- **POST /api/coach**: Get coaching nudges based on your progress
- **POST /api/tts**: Generate speech from text (uses browser fallback)
- **POST /api/evaluate**: Get structured evaluation scorecard

## Models Used

- **Coaching**: `gemini-2.0-flash-exp` (temperature: 0.7)
- **Evaluation**: `gemini-2.0-flash-exp` (temperature: 0.2, JSON mode)
- **TTS**: Browser Web Speech API (Gemini TTS as fallback if available)

## Coverage Tags

The app automatically tracks these topics in your conversation:

- **framing**: Problem framing and goals
- **constraints**: Constraints and limitations
- **users**: User personas and needs
- **ideation**: Idea generation and approaches
- **systems**: Systems thinking, state, and flows
- **metrics**: Metrics, KPIs, and experiments
- **accessibility**: Accessibility and WCAG

## Security

- GEMINI_API_KEY is read server-side only from `.env.local`
- Never exposed to the client
- All AI calls happen in API routes

## Troubleshooting

- **Speech recognition not working**: Make sure you're using Chrome and have granted microphone permissions
- **TTS not working**: The app falls back to browser TTS if Gemini TTS is unavailable
- **API errors**: Check that your GEMINI_API_KEY is valid in `.env.local`

## Build for Production

```bash
npm run build
npm start
```

## License

MIT
