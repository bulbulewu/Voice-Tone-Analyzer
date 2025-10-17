import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, MusicIcon, MicrophoneIcon, StopIcon } from './Icons';

interface AudioUploaderProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled: boolean;
  isRecording: boolean;
  audioURL: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? 'border-b-2 border-sky-400 text-sky-400'
        : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
    }`}
    aria-selected={active}
    role="tab"
  >
    {children}
  </button>
);

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  file,
  onFileSelect,
  disabled,
  isRecording,
  audioURL,
  onStartRecording,
  onStopRecording,
  onClearRecording,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileName = file?.name ?? null;

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      onFileSelect(files[0]);
      setStatusMessage(`File selected: ${files[0].name}`);
    } else {
      if (file) {
        setStatusMessage('File removed.');
      }
      onFileSelect(null);
    }
  }, [onFileSelect, file]);

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
        const files = e.dataTransfer.files;
        handleFileChange(files);
    }
  }, [disabled, handleFileChange]);

  const onButtonClick = () => {
      fileInputRef.current?.click();
  }

  const handleTabChange = (tab: 'upload' | 'record') => {
    if (tab === 'record' && file) {
      onFileSelect(null);
    }
    if (tab === 'upload' && (audioURL || isRecording)) {
      onStopRecording();
      onClearRecording();
    }
    setActiveTab(tab);
  };

  return (
    <>
      <div className="flex border-b border-slate-700" role="tablist">
        <TabButton active={activeTab === 'upload'} onClick={() => handleTabChange('upload')}>Upload File</TabButton>
        <TabButton active={activeTab === 'record'} onClick={() => handleTabChange('record')}>Record Audio</TabButton>
      </div>

      <div className="pt-4">
        {activeTab === 'upload' && (
          <div
            role="tabpanel"
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
              isDragging ? 'border-sky-500 bg-sky-500/10' : 'border-slate-600 hover:border-slate-500'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files)}
              disabled={disabled}
            />
            {fileName ? (
              <div className="flex flex-col items-center gap-2">
                  <MusicIcon className="w-12 h-12 text-green-400" aria-hidden="true" />
                  <p className="text-slate-300 font-medium">{fileName}</p>
                  <button onClick={() => handleFileChange(null)} className="text-sm text-sky-400 hover:underline">
                      Choose a different file
                  </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <UploadIcon className="w-12 h-12 text-slate-500" aria-hidden="true" />
                <p className="text-slate-400">
                  <button onClick={onButtonClick} disabled={disabled} className="font-semibold text-sky-400 hover:text-sky-500 focus:outline-none focus:underline">
                    Click to upload
                  </button>
                  {' '}or drag and drop
                </p>
                <div className="text-xs text-slate-500 text-center">
                  <p>Supported formats: MP3, WAV, M4A, OGG, FLAC.</p>
                  <p>For best results, use a 30-60 second audio clip.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'record' && (
          <div role="tabpanel" className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-600 rounded-lg">
            {!isRecording && !audioURL && (
                <button onClick={onStartRecording} disabled={disabled} className="flex flex-col items-center gap-4 text-slate-400 hover:text-sky-400 transition-colors">
                  <MicrophoneIcon className="w-12 h-12" />
                  <span className="font-semibold">Start Recording</span>
                </button>
            )}

            {isRecording && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-red-400">
                      <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      Recording...
                  </div>
                  <button onClick={onStopRecording} className="flex items-center gap-2 bg-red-500 text-white font-bold py-2 px-6 rounded-full hover:bg-red-600 transition-colors">
                    <StopIcon className="w-5 h-5" />
                    Stop
                  </button>
                </div>
            )}

            {!isRecording && audioURL && (
              <div className="w-full flex flex-col items-center gap-4">
                <p className="font-semibold text-green-400">Recording complete!</p>
                <audio src={audioURL} controls className="w-full max-w-sm rounded-full" />
                <button onClick={onClearRecording} className="text-sm text-sky-400 hover:underline">
                  Re-record
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
    </>
  );
};