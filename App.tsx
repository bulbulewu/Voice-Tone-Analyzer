import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { AudioUploader } from './components/AudioUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { Loader } from './components/Loader';
import { analyzeVoiceTone } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { playAudioFeedback } from './utils/audioFeedback';
import { ErrorIcon, SparklesIcon, CheckIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './components/Icons';

const EXAMPLES = [
  {
    label: 'Warm & Friendly',
    resultText: 'A medium-pitched female voice with a warm, friendly, and engaging tone. The pace is relaxed and conversational, with very clear articulation. The timbre is smooth and pleasant, conveying a sense of genuine sincerity and positivity.'
  },
  {
    label: 'Authoritative & Clear',
    resultText: 'A low-pitched male voice with a confident and authoritative tone. The pace is deliberate and measured, with precise articulation, emphasizing key points. The timbre is rich and resonant, projecting professionalism and expertise.'
  },
  {
    label: 'Energetic & Upbeat',
    resultText: 'A high-pitched female voice with an energetic and upbeat tone. The pace is fast and lively, with a dynamic range of inflection. The timbre is bright and crisp, conveying enthusiasm and excitement.'
  }
];

const isEnvKeySet = !!process.env.API_KEY;

export default function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string>('');
  const [isAudioFeedbackEnabled, setIsAudioFeedbackEnabled] = useState<boolean>(() => {
    const savedPreference = localStorage.getItem('AUDIO_FEEDBACK_ENABLED');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isEnvKeySet) {
      const savedKey = localStorage.getItem('GEMINI_API_KEY');
      if (savedKey) {
        setApiKey(savedKey);
        setIsKeySaved(true);
      }
    }
  }, []);

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = useCallback((file: File | null) => {
    setAudioFile(file);
    setAnalysisResult('');
    setError('');
    // Clear recording state if a file is selected
    setAudioURL(null);
    if (mediaRecorderRef.current && isRecording) {
        handleStopRecording();
    }
  }, [isRecording]);

  const handleStartRecording = async () => {
    setError('');
    setAnalysisResult('');
    setAudioFile(null);
    setAudioURL(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          const recordedFile = new File([audioBlob], `recording.${mimeType.split('/')[1]}`, { type: mimeType });
          
          setAudioURL(audioUrl);
          setAudioFile(recordedFile);
          
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setError("Microphone access was denied. Please allow microphone access in your browser's settings to use this feature.");
        if (isAudioFeedbackEnabled) playAudioFeedback('error');
      }
    } else {
      setError("Audio recording is not supported in this browser.");
      if (isAudioFeedbackEnabled) playAudioFeedback('error');
    }
  };

  const handleClearRecording = () => {
    setAudioURL(null);
    setAudioFile(null);
  };

  const validateApiKey = (key: string): boolean => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setApiKeyError('API key cannot be empty.');
      return false;
    }
    if (!trimmedKey.startsWith('AIza')) {
      setApiKeyError('Invalid API key format. It should typically start with "AIza".');
      return false;
    }
    setApiKeyError('');
    return true;
  };
  
  const handleApiKeySave = () => {
    if (validateApiKey(apiKey)) {
      localStorage.setItem('GEMINI_API_KEY', apiKey);
      setIsKeySaved(true);
      setApiKeyError('');
    }
  };

  const handleApiKeyEdit = () => {
    setIsKeySaved(false);
    setApiKeyError('');
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    if (apiKeyError) {
      setApiKeyError('');
    }
  };

  const handleAnalyze = async () => {
    if (!audioFile) {
      setError('Please select or record an audio file first.');
      if (isAudioFeedbackEnabled) playAudioFeedback('error');
      return;
    }

    const finalApiKey = isEnvKeySet ? process.env.API_KEY! : apiKey;
    if (!finalApiKey) {
      setError('Please enter and save your Gemini API key before analyzing.');
      if (isAudioFeedbackEnabled) playAudioFeedback('error');
      return;
    }

    setIsLoading(true);
    setAnalysisResult('');
    setError('');

    try {
      const { base64, mimeType } = await fileToBase64(audioFile);
      if (!mimeType.startsWith('audio/')) {
        throw new Error('Invalid file type. Please upload an audio file.');
      }
      const result = await analyzeVoiceTone(base64, mimeType, finalApiKey);
      setAnalysisResult(result);
      if (isAudioFeedbackEnabled) playAudioFeedback('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      if (isAudioFeedbackEnabled) playAudioFeedback('error');
      // Detailed logging is handled in the service layer.
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (resultText: string) => {
    handleFileSelect(null);
    setAnalysisResult(resultText);
    if (isAudioFeedbackEnabled) playAudioFeedback('success');
  };

  const toggleAudioFeedback = () => {
    setIsAudioFeedbackEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('AUDIO_FEEDBACK_ENABLED', JSON.stringify(newState));
      return newState;
    });
  };

  const canAnalyze = audioFile && !isLoading && (isEnvKeySet || isKeySaved);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl mx-auto relative">
        <Header />

        <div className="absolute top-4 right-4">
          <button
            onClick={toggleAudioFeedback}
            className="p-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-sky-400 hover:border-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label={isAudioFeedbackEnabled ? "Disable audio feedback" : "Enable audio feedback"}
          >
            {isAudioFeedbackEnabled ? <SpeakerWaveIcon className="w-5 h-5" aria-hidden="true" /> : <SpeakerXMarkIcon className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>

        {!isEnvKeySet && (
          <div className="mt-8 bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-sky-400 mb-2">Configure API Key</h2>
            {isKeySaved ? (
              <div className="flex items-center justify-between">
                <p className="text-green-400 flex items-center gap-2">
                  <CheckIcon className="w-5 h-5" aria-hidden="true" /> API Key is saved.
                </p>
                <button onClick={handleApiKeyEdit} className="text-sm text-sky-400 hover:underline font-semibold">
                  Edit Key
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-400 mb-4">
                  Please enter your Gemini API key. It will be stored in your browser's local storage.
                  You can get a key from{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline hover:text-sky-300">
                    Google AI Studio
                  </a>.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    placeholder="Enter your API Key"
                    className="flex-grow bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    aria-label="Gemini API Key"
                  />
                  <button
                    onClick={handleApiKeySave}
                    disabled={!apiKey.trim()}
                    className="bg-sky-500 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Key
                  </button>
                </div>
                {apiKeyError && (
                  <p className="text-red-400 text-sm mt-2">{apiKeyError}</p>
                )}
              </>
            )}
          </div>
        )}

        <main className="mt-8">
          <div className="bg-slate-800/50 rounded-2xl shadow-lg p-6 backdrop-blur-sm border border-slate-700">
            <h2 className="text-lg font-semibold text-sky-400 mb-1">1. Provide Your Audio</h2>
            <p className="text-sm text-slate-400 mb-4">Upload a file (MP3, WAV, etc.) or record audio directly. A 30-60 second clip is recommended.</p>
            <AudioUploader
              file={audioFile}
              onFileSelect={handleFileSelect}
              disabled={isLoading}
              isRecording={isRecording}
              audioURL={audioURL}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onClearRecording={handleClearRecording}
            />
          </div>

          <div className="text-center my-6">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="inline-flex items-center gap-2 bg-sky-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-500/50 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader aria-hidden="true" />
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" aria-hidden="true" />
                  Analyze Voice Tone
                </>
              )}
            </button>
          </div>
          
          <div className="my-8 text-center">
            <p className="text-slate-400 mb-3 text-sm">Or try an example:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  onClick={() => handleExampleClick(example.resultText)}
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-slate-700/50 text-sky-300 text-sm font-medium rounded-full border border-slate-600 hover:bg-slate-700 hover:border-sky-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative flex items-start gap-3" role="alert">
              <ErrorIcon className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">{error}</span>
              </div>
            </div>
          )}

          {analysisResult && !isLoading && (
            <ResultDisplay resultText={analysisResult} />
          )}
        </main>
      </div>
    </div>
  );
}