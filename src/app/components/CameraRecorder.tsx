'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface CameraRecorderProps {
  isSessionActive: boolean;
}

const CameraRecorder: React.FC<CameraRecorderProps> = ({ isSessionActive }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      });

      streamRef.current = stream;
      setHasPermission(true);
      setIsCameraOn(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please grant camera permissions.');
      setHasPermission(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    try {
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
      };

      // Fallback to vp8 if vp9 is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start recording. Please try again.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const downloadRecording = useCallback(() => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `design-interview-${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [recordedChunks]);

  const deleteRecording = useCallback(() => {
    setRecordedChunks([]);
    setRecordingDuration(0);
  }, []);

  useEffect(() => {
    // Auto-start camera when session becomes active
    if (isSessionActive && !isCameraOn) {
      startCamera();
    }

    return () => {
      stopRecording();
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Video Preview */}
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="max-w-full max-h-full object-contain mirror"
          style={{ transform: 'scaleX(-1)' }}
        />

        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <svg
                className="mx-auto h-16 w-16 text-gray-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-400">Camera Off</p>
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-full shadow-lg">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-mono font-semibold">{formatDuration(recordingDuration)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-between gap-3">
          {/* Camera Toggle */}
          <button
            onClick={isCameraOn ? stopCamera : startCamera}
            className={`flex-1 px-4 py-2 rounded font-medium ${
              isCameraOn
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isCameraOn ? 'Stop Camera' : 'Start Camera'}
          </button>

          {/* Recording Toggle */}
          {isCameraOn && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isCameraOn}
              className={`flex-1 px-4 py-2 rounded font-medium disabled:opacity-50 ${
                isRecording
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          )}
        </div>

        {/* Recording Actions */}
        {recordedChunks.length > 0 && !isRecording && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={downloadRecording}
              className="flex-1 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-medium"
            >
              Download Recording ({formatDuration(recordingDuration)})
            </button>
            <button
              onClick={deleteRecording}
              className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
            >
              Delete
            </button>
          </div>
        )}

        <div className="mt-2 text-xs text-gray-400 text-center">
          {!hasPermission && 'Grant camera/microphone permissions to record your interview'}
          {hasPermission && !isCameraOn && 'Click "Start Camera" to begin'}
          {isCameraOn && !isRecording && 'Ready to record'}
          {isRecording && 'Recording in progress - your interview is being captured'}
        </div>
      </div>
    </div>
  );
};

export default CameraRecorder;
