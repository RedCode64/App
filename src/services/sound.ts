import { createAudioPlayer } from 'expo-audio';

/**
 * Synth tones generated at runtime as WAV data URIs — no bundled audio files,
 * so a cold clone runs without any external asset downloads.
 */

export type ToneKind = 'complete' | 'levelup' | 'unlock' | 'error';

const SAMPLE_RATE = 22050;

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const triplet = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
    out += BASE64_CHARS[(triplet >> 18) & 0x3f];
    out += BASE64_CHARS[(triplet >> 12) & 0x3f];
    out += b1 === undefined ? '=' : BASE64_CHARS[(triplet >> 6) & 0x3f];
    out += b2 === undefined ? '=' : BASE64_CHARS[triplet & 0x3f];
  }
  return out;
}

interface ToneSegment {
  freq: number;
  durationMs: number;
}

function synthWavBase64(segments: ToneSegment[]): string {
  const totalSamples = segments.reduce((sum, s) => sum + Math.floor((s.durationMs / 1000) * SAMPLE_RATE), 0);
  const dataSize = totalSamples * 2;
  const buffer = new Uint8Array(44 + dataSize);
  const view = new DataView(buffer.buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let sampleIndex = 0;
  for (const seg of segments) {
    const segSamples = Math.floor((seg.durationMs / 1000) * SAMPLE_RATE);
    for (let i = 0; i < segSamples; i++) {
      const t = i / SAMPLE_RATE;
      const envelope = Math.min(1, i / 200) * Math.exp(-3 * (i / segSamples));
      // Square-ish synth: fundamental + a third harmonic for the retro bite.
      const raw = Math.sin(2 * Math.PI * seg.freq * t) + 0.35 * Math.sin(2 * Math.PI * seg.freq * 3 * t);
      const value = Math.max(-1, Math.min(1, raw * 0.6)) * envelope;
      view.setInt16(44 + sampleIndex * 2, Math.round(value * 32767), true);
      sampleIndex += 1;
    }
  }
  return bytesToBase64(buffer);
}

const TONES: Record<ToneKind, ToneSegment[]> = {
  complete: [
    { freq: 660, durationMs: 70 },
    { freq: 990, durationMs: 110 },
  ],
  levelup: [
    { freq: 440, durationMs: 90 },
    { freq: 660, durationMs: 90 },
    { freq: 880, durationMs: 90 },
    { freq: 1320, durationMs: 180 },
  ],
  unlock: [
    { freq: 523, durationMs: 80 },
    { freq: 784, durationMs: 140 },
  ],
  error: [
    { freq: 220, durationMs: 120 },
    { freq: 160, durationMs: 180 },
  ],
};

const uriCache = new Map<ToneKind, string>();

function toneUri(kind: ToneKind): string {
  const cached = uriCache.get(kind);
  if (cached) return cached;
  const uri = `data:audio/wav;base64,${synthWavBase64(TONES[kind])}`;
  uriCache.set(kind, uri);
  return uri;
}

export function playTone(kind: ToneKind, enabled: boolean): void {
  if (!enabled) return;
  try {
    const player = createAudioPlayer(toneUri(kind));
    player.volume = 0.5;
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        player.remove();
      }
    });
    player.play();
  } catch {
    // Audio is a garnish; never let it break the interaction.
  }
}
