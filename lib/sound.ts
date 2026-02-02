"use client";

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = AC ? new AC() : null;
  }
  return audioContext;
}

export function playBeep(frequency: number, duration: number, type: OscillatorType = "square") {
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function playCardSound() {
  playBeep(440, 0.05);
  setTimeout(() => playBeep(660, 0.05), 50);
}

export function playVictorySound() {
  [523, 659, 784, 1047].forEach((freq, i) => {
    setTimeout(() => playBeep(freq, 0.15), i * 100);
  });
}

export function playSubmitSound() {
  playBeep(330, 0.08);
}
