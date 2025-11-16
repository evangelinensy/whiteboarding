# Design Challenge Coach

A local Next.js web app that simulates a 60-minute product design interview exercise with AI coaching, speech-to-text, text-to-speech, video recording, and a built-in whiteboard for low-fidelity wireframes.

## Features

### Core Interview Simulation
- **60-Minute Timer with Phases**: Discovery (20 min), Heads-down (25 min), Presentation (15 min)
- **Video Recording**: Record your entire interview session with camera and audio using MediaRecorder API
- **Speech-to-Text**: Capture your spoken thinking using Web Speech API (Chrome)
- **AI Coaching**: Live coaching from Gemini AI with spoken feedback
- **Whiteboard Canvas**: Draw low-fi wireframes with rectangles, text, arrows, and ellipses
- **Coverage Tracking**: Automatically tracks problem framing, constraints, users, ideation, systems thinking, metrics, and accessibility

### Multimodal Feedback System
- **Enhanced Evaluation**: AI analyzes BOTH what you said AND what you drew
- **Communication Breakdown**:
  - Naming Clarity: Did you clearly name screens, components, and UI elements?
  - Pattern Explanation: Did you explain UX patterns you chose? (e.g., "Using tabs instead of drawer because...")
  - Trade-off Articulation: Did you call out design trade-offs? (e.g., "Cards vs list - pros/cons")
  - Whiteboard Narration: Did you verbally explain what you were drawing?
- **Whiteboard Analysis**:
  - Completeness: Did you create enough wireframes/flows?
  - Labeling Quality: Were elements clearly labeled?
  - Flow Clarity: Did arrows show clear user journeys?
- **Structured Scorecard**: Detailed rubric with strengths, weaknesses, and personalized practice drills

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
2. **Record Your Interview**: Switch to the "Camera" tab
   - Click "Start Camera" to enable your webcam
   - Click "Start Recording" to begin capturing your interview
   - The recording includes both video and audio
   - Download your recording after the session for review
3. **Speak Your Thinking**: Click "Start Listening" to enable speech-to-text
   - Your spoken words are transcribed and analyzed for evaluation
   - Make sure to verbalize your design decisions as you work!
4. **Sketch Wireframes**: Switch to the "Whiteboard" tab to draw low-fi wireframes
   - Use keyboard shortcuts: V (select), R (rectangle), T (text), A (arrow), Space (pan)
   - Create rectangles for frames/components, add text labels, draw arrows
   - **Important**: Name your screens and components clearly while drawing
   - Explain UX patterns and trade-offs verbally as you sketch
   - Undo/Redo with Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z
   - Export your canvas as PNG
5. **Ask the Coach**: Type questions or click "Ask Coach" during Discovery or Heads-down phases
6. **End & Debrief**: Click "End & Debrief" when done to get your multimodal evaluation scorecard
   - See how well you communicated design decisions
   - Get specific feedback on naming, pattern explanation, and trade-off articulation
   - Review whiteboard analysis and receive personalized practice drills

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

- **Coaching**: `gemini-1.5-flash` (temperature: 0.7) - Provides contextual nudges during the session
- **Evaluation**: `gemini-1.5-pro` (temperature: 0.2, JSON mode) - Analyzes multimodal performance (speech + whiteboard)
- **TTS**: Browser Web Speech API (Chrome's built-in TTS for coach voice)
- **Video Recording**: MediaRecorder API (WebM format with VP8/VP9 codec)

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
