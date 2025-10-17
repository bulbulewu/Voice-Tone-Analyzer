import React from 'react';
import { SpeakerIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="inline-block bg-sky-500/10 p-4 rounded-full border border-sky-500/20 mb-4">
        <SpeakerIcon className="w-10 h-10 text-sky-400" aria-hidden="true" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
        Voice Tone Analyzer
      </h1>
      <p className="mt-4 max-w-xl mx-auto text-lg text-slate-400">
        Get a detailed description of any voice. Perfect for creating consistent Text-to-Speech voices for your projects.
      </p>
    </header>
  );
};