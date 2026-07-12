import type { Cosmetic, CharacterAppearance } from '../types';
import { colors } from '../theme';

export const SKIN_TONES: readonly string[] = ['#f2c9a3', '#c98d5e', '#8d5a3b', '#5c3a26'];

export const HAIR_COLORS: readonly string[] = [
  colors.cyan,
  colors.magenta,
  colors.yellow,
  colors.green,
  colors.purple,
  '#e8ecff',
];

export const HAIR_STYLES: readonly string[] = ['SPIKES', 'MOHAWK', 'BUZZ', 'FIBER-OPTIC'];

export const DEFAULT_APPEARANCE: CharacterAppearance = {
  skinTone: SKIN_TONES[0] ?? '#f2c9a3',
  hairStyle: 0,
  hairColor: colors.cyan,
};

export const COSMETICS: readonly Cosmetic[] = [
  // ── Outfits ────────────────────────────────────────────────────────────
  {
    id: 'street-jacket',
    name: 'Alley Runner Jacket',
    lore: 'Standard issue for anyone who sleeps below the megatower line.',
    slot: 'outfit',
    tier: 'street',
    unlock: { type: 'starter' },
    art: { shape: 'jacket', primary: '#2c3a6e', secondary: colors.cyan },
  },
  {
    id: 'synth-trench',
    name: 'Synth-Leather Trench',
    lore: 'Turns rain and small-arms glances alike.',
    slot: 'outfit',
    tier: 'chrome',
    unlock: { type: 'level', level: 5 },
    art: { shape: 'trench', primary: '#1a1030', secondary: colors.magenta },
  },
  {
    id: 'neon-rig',
    name: 'Neon Circuit Rig',
    lore: 'Live traces run across the weave. The grid knows your name.',
    slot: 'outfit',
    tier: 'netrunner',
    unlock: { type: 'streak', days: 14 },
    art: { shape: 'rig', primary: '#0a0d1c', secondary: colors.yellow },
  },
  {
    id: 'ghost-suit',
    name: 'Ghostwire Suit',
    lore: 'Woven from decommissioned blackwall filament. Cameras forget you.',
    slot: 'outfit',
    tier: 'ghost',
    unlock: { type: 'prestige', count: 1 },
    art: { shape: 'suit', primary: '#05060e', secondary: '#e8ecff' },
  },
  // ── Headgear ───────────────────────────────────────────────────────────
  {
    id: 'visor-hud',
    name: 'Streetline Visor',
    lore: 'Cheap AR overlay. The ads are unskippable but the map is solid.',
    slot: 'headgear',
    tier: 'street',
    unlock: { type: 'level', level: 3 },
    art: { shape: 'visor', primary: colors.cyan, secondary: '#0a0d1c' },
  },
  {
    id: 'chrome-halo',
    name: 'Chrome Halo Array',
    lore: 'Sensor ring salvaged from a corpo security drone.',
    slot: 'headgear',
    tier: 'chrome',
    unlock: { type: 'achievement', achievementId: 'streak_7' },
    art: { shape: 'halo', primary: colors.cyan, secondary: colors.magenta },
  },
  {
    id: 'net-crown',
    name: 'Netrunner Crown',
    lore: 'Twelve antennae, zero permission requests.',
    slot: 'headgear',
    tier: 'netrunner',
    unlock: { type: 'level', level: 20 },
    art: { shape: 'crown', primary: colors.magenta, secondary: colors.yellow },
  },
  {
    id: 'ghost-mask',
    name: 'Ghost Protocol Mask',
    lore: 'Whoever wore it before you was never identified. Keep it that way.',
    slot: 'headgear',
    tier: 'ghost',
    unlock: { type: 'fragments', cost: 60 },
    art: { shape: 'mask', primary: '#e8ecff', secondary: colors.cyan },
  },
  // ── Enhancements ───────────────────────────────────────────────────────
  {
    id: 'optic-implant',
    name: 'Kirosaki Optics Mk.I',
    lore: 'Sees heat, lies, and the exit routes. Mostly the exit routes.',
    slot: 'enhancement',
    tier: 'street',
    unlock: { type: 'achievement', achievementId: 'completions_10' },
    art: { shape: 'optics', primary: colors.yellow, secondary: '#0a0d1c' },
  },
  {
    id: 'chrome-arm',
    name: 'Chrome Arm Mk.II',
    lore: 'Hydraulic grip rated for one metric ton and zero handshakes.',
    slot: 'enhancement',
    tier: 'chrome',
    unlock: { type: 'level', level: 8 },
    art: { shape: 'chromeArm', primary: '#9aa7c7', secondary: colors.cyan },
  },
  {
    id: 'neural-spikes',
    name: 'Neural Spike Array',
    lore: 'Direct cortical bus. Thought becomes packet becomes consequence.',
    slot: 'enhancement',
    tier: 'netrunner',
    unlock: { type: 'streak', days: 30 },
    art: { shape: 'spikes', primary: colors.magenta, secondary: '#e8ecff' },
  },
  {
    id: 'ghost-core',
    name: 'Ghost Core Reactor',
    lore: 'Runs cold. Runs silent. Runs forever.',
    slot: 'enhancement',
    tier: 'ghost',
    unlock: { type: 'prestige', count: 2 },
    art: { shape: 'core', primary: colors.yellow, secondary: colors.magenta },
  },
  // ── Accessories ────────────────────────────────────────────────────────
  {
    id: 'neon-tattoo',
    name: 'Neon Sleeve Tattoo',
    lore: 'Subdermal light-ink. Glows brighter the longer you keep promises.',
    slot: 'accessory',
    tier: 'street',
    unlock: { type: 'achievement', achievementId: 'completions_25' },
    art: { shape: 'tattoo', primary: colors.green, secondary: colors.cyan },
  },
  {
    id: 'data-scarf',
    name: 'Dataflow Scarf',
    lore: 'Fiber-optic weave streaming last night’s market crash in real time.',
    slot: 'accessory',
    tier: 'chrome',
    unlock: { type: 'fragments', cost: 25 },
    art: { shape: 'scarf', primary: colors.cyan, secondary: colors.magenta },
  },
  {
    id: 'watchdog-drone',
    name: 'Watchdog Drone',
    lore: 'It hovers. It judges. It occasionally saves your life.',
    slot: 'accessory',
    tier: 'netrunner',
    unlock: { type: 'level', level: 15 },
    art: { shape: 'drone', primary: colors.orange, secondary: '#0a0d1c' },
  },
  {
    id: 'spectral-aura',
    name: 'Spectral Aura',
    lore: 'A rendering artifact that followed you out of the net. It stayed.',
    slot: 'accessory',
    tier: 'ghost',
    unlock: { type: 'fragments', cost: 100 },
    art: { shape: 'aura', primary: colors.purple, secondary: colors.cyan },
  },
];

export function cosmeticById(id: string): Cosmetic | undefined {
  return COSMETICS.find((c) => c.id === id);
}

export const STARTER_COSMETIC_IDS: string[] = COSMETICS.filter((c) => c.unlock.type === 'starter').map((c) => c.id);
