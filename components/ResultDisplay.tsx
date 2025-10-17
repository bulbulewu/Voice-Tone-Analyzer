import React, { useState } from 'react';
import { CopyIcon, CheckIcon, AILogo } from './Icons';

interface ResultDisplayProps {
  resultText: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ resultText }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <div className="mt-8 bg-slate-800/50 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-700">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-sky-400 mb-4 flex items-center gap-2">
          <AILogo className="w-6 h-6" aria-hidden="true" />
          Generated Voice Description
        </h2>
        <div className="relative bg-slate-900 p-4 rounded-lg">
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{resultText}</p>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
            aria-label="Copy to clipboard"
          >
            {copyStatus === 'copied' ? <CheckIcon className="w-5 h-5 text-green-400" aria-hidden="true" /> : <CopyIcon className="w-5 h-5" aria-hidden="true" />}
          </button>
          <div className="sr-only" aria-live="polite">
            {copyStatus === 'copied' ? 'Copied to clipboard' : ''}
          </div>
        </div>
        <div className="mt-6 text-center">
            <a 
                href="https://aistudio.google.com/generate-speech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-2 px-6 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
            >
                Create TTS on AI Studio
            </a>
            <p className="text-xs text-slate-500 mt-2">Use the copied description to generate speech.</p>
        </div>
      </div>
    </div>
  );
};