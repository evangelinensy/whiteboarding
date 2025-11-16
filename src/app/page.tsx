'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Whiteboard from './components/Whiteboard';
import CameraRecorder from './components/CameraRecorder';
import PromptSelector from './components/PromptSelector';

type Phase = 'Discovery' | 'Heads-down' | 'Presentation';

interface Message {
  sender: 'Coach' | 'You';
  text: string;
  timestamp: Date;
}

interface Coverage {
  framing: boolean;
  constraints: boolean;
  users: boolean;
  ideation: boolean;
  systems: boolean;
  metrics: boolean;
  accessibility: boolean;
}

const PHASE_DURATIONS: Record<Phase, number> = {
  Discovery: 20 * 60,
  'Heads-down': 25 * 60,
  Presentation: 15 * 60,
};

const DEFAULT_PROMPT = `Design a feature for a food delivery app that helps users manage their dietary restrictions and allergies.

Strong constraint: The feature must work entirely offline after initial setup.

Consider:
- How users discover and set up their restrictions
- How the feature surfaces safe menu items
- Edge cases (cross-contamination, unclear ingredients)
- Metrics to track success`;

export default function Home() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>('Discovery');
  const [timeRemaining, setTimeRemaining] = useState(PHASE_DURATIONS.Discovery);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [coverage, setCoverage] = useState<Coverage>({
    framing: false,
    constraints: false,
    users: false,
    ideation: false,
    systems: false,
    metrics: false,
    accessibility: false,
  });
  const [canvasSummary, setCanvasSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'whiteboard' | 'camera'>('transcript');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(true);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        addMessage('You', transcript);
        updateCoverageFromText(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current?.start();
        }
      };
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-advance to next phase
          if (phase === 'Discovery') {
            setPhase('Heads-down');
            return PHASE_DURATIONS['Heads-down'];
          } else if (phase === 'Heads-down') {
            setPhase('Presentation');
            return PHASE_DURATIONS.Presentation;
          } else {
            setIsTimerRunning(false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, phase]);

  // Send intro message when session starts
  useEffect(() => {
    if (!sessionStarted) return;

    const sendIntro = async () => {
      const intro = `Welcome to your design challenge! You have 60 minutes to work through this problem. Let's begin with the Discovery phase. Take time to understand the problem, clarify constraints, and explore the solution space.`;
      addMessage('Coach', intro);
      await speakText(intro);
      setIsTimerRunning(true);
    };
    sendIntro();
  }, [sessionStarted]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender: 'Coach' | 'You', text: string) => {
    setMessages((prev) => [...prev, { sender, text, timestamp: new Date() }]);
  };

  const updateCoverageFromText = (text: string) => {
    const lower = text.toLowerCase();
    setCoverage((prev) => ({
      ...prev,
      framing: prev.framing || lower.includes('goal') || lower.includes('problem'),
      constraints: prev.constraints || lower.includes('constraint') || lower.includes('limit'),
      users: prev.users || lower.includes('user') || lower.includes('persona'),
      ideation: prev.ideation || lower.includes('idea') || lower.includes('approach'),
      systems: prev.systems || lower.includes('state') || lower.includes('flow') || lower.includes('error'),
      metrics: prev.metrics || lower.includes('metric') || lower.includes('kpi') || lower.includes('experiment'),
      accessibility: prev.accessibility || lower.includes('accessibility') || lower.includes('wcag'),
    }));
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakText = async (text: string) => {
    if (isMuted) return;

    setIsSpeaking(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      // Fallback to Web Speech API for TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const askCoach = async () => {
    if (userInput.trim()) {
      addMessage('You', userInput);
      updateCoverageFromText(userInput);
      setUserInput('');
    }

    setIsCoachLoading(true);
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase,
          prompt,
          messages,
          coverage,
          canvasSummary,
        }),
      });

      const data = await response.json();

      if (data.error) {
        addMessage('Coach', `Error: ${data.error}`);
      } else {
        addMessage('Coach', data.nudge);
        await speakText(data.nudge);
      }
    } catch (error: any) {
      addMessage('Coach', `Error communicating with coach: ${error.message}`);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const endAndDebrief = async () => {
    setIsTimerRunning(false);
    setIsCoachLoading(true);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase,
          prompt,
          messages,
          coverage,
          canvasSummary,
        }),
      });

      const data = await response.json();

      if (data.error) {
        addMessage('Coach', `Evaluation error: ${data.error}`);
      } else {
        setEvaluation(data);
        addMessage('Coach', 'Debrief ready. Check the evaluation panel below.');
      }
    } catch (error: any) {
      addMessage('Coach', `Error generating evaluation: ${error.message}`);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const changePhase = (newPhase: Phase) => {
    setPhase(newPhase);
    setTimeRemaining(PHASE_DURATIONS[newPhase]);
    setIsTimerRunning(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      addMessage('You', userInput);
      updateCoverageFromText(userInput);
      setUserInput('');
    }
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  const handleStartSession = () => {
    setSessionStarted(true);
  };

  // Show prompt selector before session starts
  if (!sessionStarted) {
    return (
      <PromptSelector
        onSelectPrompt={handleSelectPrompt}
        onStartSession={handleStartSession}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-300 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Design Challenge Coach</h1>
        </div>

        {/* Phase & Timer */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Phase:</span>
            <span className="text-sm font-bold text-blue-600">{phase}</span>
          </div>
          <div className="text-3xl font-mono text-center mb-3">{formatTime(timeRemaining)}</div>
          <div className="flex gap-2">
            <button
              onClick={() => changePhase('Discovery')}
              className="flex-1 px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200"
            >
              Discovery
            </button>
            <button
              onClick={() => changePhase('Heads-down')}
              className="flex-1 px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200"
            >
              Heads-down
            </button>
            <button
              onClick={() => changePhase('Presentation')}
              className="flex-1 px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200"
            >
              Presentation
            </button>
          </div>
        </div>

        {/* Mic Controls */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Microphone:</span>
            <span className={`text-xs ${isListening ? 'text-green-600' : 'text-gray-500'}`}>
              {isListening ? 'Listening...' : 'Idle'}
            </span>
          </div>
          <button
            onClick={toggleListening}
            className={`w-full px-4 py-2 rounded ${
              isListening
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
        </div>

        {/* Coach Voice */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Coach Voice:</span>
            <span className={`text-xs ${isSpeaking ? 'text-blue-600' : 'text-gray-500'}`}>
              {isSpeaking ? 'Speaking...' : 'Silent'}
            </span>
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-full px-4 py-2 rounded ${
              isMuted
                ? 'bg-gray-500 text-white hover:bg-gray-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isMuted ? 'Unmute Coach' : 'Mute Coach'}
          </button>
        </div>

        {/* Prompt */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Design Prompt:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-32 p-2 border border-gray-300 rounded text-sm"
            placeholder="Enter design prompt..."
          />
        </div>

        {/* Ask Coach */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Your Message:</label>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') askCoach();
            }}
            className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
            placeholder="Type your thoughts or question..."
          />
          <button
            onClick={askCoach}
            disabled={isCoachLoading}
            className="w-full px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50"
          >
            {isCoachLoading ? 'Thinking...' : 'Ask Coach'}
          </button>
        </div>

        {/* Coverage Tags */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Coverage:</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(coverage).map(([key, value]) => (
              <span
                key={key}
                className={`px-2 py-1 rounded text-xs ${
                  value ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {key}
              </span>
            ))}
          </div>
        </div>

        {/* End & Debrief */}
        <div className="p-4">
          <button
            onClick={endAndDebrief}
            disabled={isCoachLoading}
            className="w-full px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            End & Debrief
          </button>
        </div>
      </div>

      {/* Main Pane */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-300 bg-white">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'transcript'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Transcript
          </button>
          <button
            onClick={() => setActiveTab('whiteboard')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'whiteboard'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Whiteboard
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'camera'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Camera
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'transcript' ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'You'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="text-xs font-semibold mb-1">{msg.sender}</div>
                      <div className="text-sm">{msg.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Evaluation Display */}
              {evaluation && (
                <div className="border-t border-gray-300 p-4 bg-gray-50 max-h-64 overflow-y-auto">
                  <h3 className="font-bold text-lg mb-2">Evaluation</h3>
                  {evaluation.error ? (
                    <div className="text-red-600">
                      <p>{evaluation.error}</p>
                      <pre className="text-xs mt-2 bg-white p-2 rounded overflow-x-auto">
                        {evaluation.raw}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Rubric:</strong>
                        <ul className="ml-4 mt-1">
                          {Object.entries(evaluation.rubric || {}).map(([key, value]) => (
                            <li key={key}>
                              {key.replace(/_/g, ' ')}: {String(value)}/5
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>Strengths:</strong>
                        <ul className="ml-4 mt-1 list-disc">
                          {evaluation.strengths?.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>Weaknesses:</strong>
                        <ul className="ml-4 mt-1 list-disc">
                          {evaluation.weaknesses?.map((w: string, i: number) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                      {evaluation.communication_breakdown && (
                        <div>
                          <strong className="text-purple-700">Communication Breakdown:</strong>
                          <div className="ml-4 mt-1 space-y-1">
                            <div>
                              <span className="font-semibold">Naming Clarity ({evaluation.communication_breakdown.naming_clarity?.score}/5):</span>
                              <p className="text-xs text-gray-700">{evaluation.communication_breakdown.naming_clarity?.feedback}</p>
                            </div>
                            <div>
                              <span className="font-semibold">Pattern Explanation ({evaluation.communication_breakdown.pattern_explanation?.score}/5):</span>
                              <p className="text-xs text-gray-700">{evaluation.communication_breakdown.pattern_explanation?.feedback}</p>
                            </div>
                            <div>
                              <span className="font-semibold">Trade-off Articulation ({evaluation.communication_breakdown.tradeoff_articulation?.score}/5):</span>
                              <p className="text-xs text-gray-700">{evaluation.communication_breakdown.tradeoff_articulation?.feedback}</p>
                            </div>
                            <div>
                              <span className="font-semibold">Whiteboard Narration ({evaluation.communication_breakdown.whiteboard_narration?.score}/5):</span>
                              <p className="text-xs text-gray-700">{evaluation.communication_breakdown.whiteboard_narration?.feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {evaluation.whiteboard_analysis && (
                        <div>
                          <strong className="text-blue-700">Whiteboard Analysis:</strong>
                          <div className="ml-4 mt-1 space-y-1">
                            <div>
                              <span className="font-semibold">Completeness:</span>
                              <p className="text-xs text-gray-700">{evaluation.whiteboard_analysis.completeness}</p>
                            </div>
                            <div>
                              <span className="font-semibold">Labeling Quality:</span>
                              <p className="text-xs text-gray-700">{evaluation.whiteboard_analysis.labeling_quality}</p>
                            </div>
                            <div>
                              <span className="font-semibold">Flow Clarity:</span>
                              <p className="text-xs text-gray-700">{evaluation.whiteboard_analysis.flow_clarity}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <strong>Narrative:</strong>
                        <p className="mt-1">{evaluation.narrative}</p>
                      </div>
                      <div>
                        <strong>Practice Drills:</strong>
                        <ul className="ml-4 mt-1">
                          {evaluation.drills?.map((drill: any, i: number) => (
                            <li key={i}>
                              {drill.title} ({drill.time} min) - {drill.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-300 p-4 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded"
                    placeholder="Type your message..."
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'whiteboard' ? (
            <Whiteboard onCanvasSummaryChange={setCanvasSummary} />
          ) : (
            <CameraRecorder isSessionActive={isTimerRunning} />
          )}
        </div>
      </div>
    </div>
  );
}
