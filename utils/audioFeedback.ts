// A single AudioContext is created and reused to optimize performance.
let audioContext: AudioContext | null = null;

/**
 * Lazily initializes and retrieves the global AudioContext instance.
 * This ensures compatibility with browsers that require user interaction
 * before an AudioContext can be created.
 * @returns {AudioContext | null} The shared AudioContext or null if not supported.
 */
const getAudioContext = (): AudioContext | null => {
  if (window.AudioContext || (window as any).webkitAudioContext) {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
  }
  return null;
};

/**
 * Plays a predefined sound effect for success or error states.
 * Uses the Web Audio API to generate tones dynamically.
 * @param {'success' | 'error'} type The type of feedback sound to play.
 */
export const playAudioFeedback = (type: 'success' | 'error'): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Browsers may suspend the AudioContext until a user gesture.
  // This ensures it resumes before trying to play a sound.
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);

  if (type === 'success') {
    // A short, rising, pleasant tone.
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    
    gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } else if (type === 'error') {
    // A brief, lower-pitched, "buzz" tone.
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(220, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.15);

    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
  }
};