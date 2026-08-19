import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export default function VoiceInput({ onTranscript, className = '' }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      if (finalText) {
        onTranscript(finalText.trim());
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // already stopped
      }
    };
  }, [onTranscript]);

  const toggle = () => {
    if (!supported || !recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setInterimText('');
      recognitionRef.current.start();
      setListening(true);
    }
  };

  if (!supported) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
          listening
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={listening ? 'Stop voice input' : 'Start voice input'}
      >
        {listening ? (
          <>
            <span className="absolute inset-0 animate-pulse-ring rounded-lg bg-rose-400/30" />
            <MicOff className="relative h-4 w-4" />
            <span className="relative hidden sm:inline">Listening...</span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Voice</span>
          </>
        )}
      </button>
      {listening && interimText && (
        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {interimText}
        </div>
      )}
    </div>
  );
}
