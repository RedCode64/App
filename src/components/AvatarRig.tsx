import { memo } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import type { CharacterState, CosmeticShape } from '../types';
import { cosmeticById } from '../data/cosmetics';
import { colors } from '../theme';

interface AvatarRigProps {
  character: CharacterState;
  size?: number;
}

/**
 * The runner's avatar, composed from layered SVG slots on a 200×260 viewBox:
 * aura → base body → hair → outfit → enhancement → headgear → accessory.
 * Every layer is inline vector art — no image assets.
 */
export const AvatarRig = memo(function AvatarRig({ character, size = 200 }: AvatarRigProps) {
  const { appearance, equipped } = character;
  const outfit = equipped.outfit ? cosmeticById(equipped.outfit) : undefined;
  const headgear = equipped.headgear ? cosmeticById(equipped.headgear) : undefined;
  const enhancement = equipped.enhancement ? cosmeticById(equipped.enhancement) : undefined;
  const accessory = equipped.accessory ? cosmeticById(equipped.accessory) : undefined;

  const skin = appearance.skinTone;
  const hair = appearance.hairColor;

  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 200 260">
      {/* Accessory: aura renders behind everything */}
      {accessory?.art.shape === 'aura' && (
        <Ellipse cx={100} cy={140} rx={78} ry={110} fill="none" stroke={accessory.art.primary} strokeWidth={3} opacity={0.5} />
      )}

      {/* ── Base body ── */}
      <G>
        {/* legs */}
        <Rect x={78} y={185} width={16} height={60} rx={5} fill="#141a33" />
        <Rect x={106} y={185} width={16} height={60} rx={5} fill="#141a33" />
        <Rect x={76} y={242} width={20} height={10} rx={3} fill="#20294d" />
        <Rect x={104} y={242} width={20} height={10} rx={3} fill="#20294d" />
        {/* torso under-suit */}
        <Path d="M70 110 L130 110 L124 190 L76 190 Z" fill="#1a2140" />
        {/* arms */}
        <Rect x={54} y={112} width={14} height={64} rx={7} fill="#1a2140" />
        <Rect x={132} y={112} width={14} height={64} rx={7} fill="#1a2140" />
        {/* hands */}
        <Circle cx={61} cy={182} r={7} fill={skin} />
        <Circle cx={139} cy={182} r={7} fill={skin} />
        {/* neck + head */}
        <Rect x={92} y={92} width={16} height={16} fill={skin} />
        <Circle cx={100} cy={70} r={26} fill={skin} />
        {/* default eyes */}
        <Circle cx={91} cy={68} r={2.5} fill="#0a0d1c" />
        <Circle cx={109} cy={68} r={2.5} fill="#0a0d1c" />
      </G>

      {/* ── Hair (style index from appearance) ── */}
      {appearance.hairStyle === 0 && (
        <Polygon points="76,58 84,36 92,54 100,32 108,54 116,36 124,58 100,48" fill={hair} />
      )}
      {appearance.hairStyle === 1 && <Rect x={94} y={34} width={12} height={26} rx={4} fill={hair} />}
      {appearance.hairStyle === 2 && <Path d="M76 62 A26 26 0 0 1 124 62 L124 56 A26 26 0 0 0 76 56 Z" fill={hair} />}
      {appearance.hairStyle === 3 && (
        <G>
          <Path d="M74 60 A26 26 0 0 1 126 60 L128 96 L120 96 L118 62 L82 62 L80 96 L72 96 Z" fill={hair} />
          <Line x1={74} y1={80} x2={74} y2={100} stroke={hair} strokeWidth={2} />
          <Line x1={126} y1={80} x2={126} y2={100} stroke={hair} strokeWidth={2} />
        </G>
      )}

      {/* ── Outfit layer ── */}
      {outfit && <OutfitLayer shape={outfit.art.shape} primary={outfit.art.primary} secondary={outfit.art.secondary} />}

      {/* ── Enhancement layer ── */}
      {enhancement && (
        <EnhancementLayer shape={enhancement.art.shape} primary={enhancement.art.primary} secondary={enhancement.art.secondary} />
      )}

      {/* ── Headgear layer ── */}
      {headgear && <HeadgearLayer shape={headgear.art.shape} primary={headgear.art.primary} secondary={headgear.art.secondary} />}

      {/* ── Accessory layer (except aura, drawn first) ── */}
      {accessory && accessory.art.shape !== 'aura' && (
        <AccessoryLayer shape={accessory.art.shape} primary={accessory.art.primary} secondary={accessory.art.secondary} />
      )}
    </Svg>
  );
});

interface LayerProps {
  shape: CosmeticShape;
  primary: string;
  secondary: string;
}

function OutfitLayer({ shape, primary, secondary }: LayerProps) {
  switch (shape) {
    case 'jacket':
      return (
        <G>
          <Path d="M68 108 L132 108 L127 172 L73 172 Z" fill={primary} />
          <Path d="M68 108 L100 118 L132 108 L128 122 L100 130 L72 122 Z" fill={secondary} opacity={0.9} />
          <Rect x={52} y={110} width={16} height={58} rx={8} fill={primary} />
          <Rect x={132} y={110} width={16} height={58} rx={8} fill={primary} />
          <Line x1={100} y1={130} x2={100} y2={170} stroke={secondary} strokeWidth={2} />
        </G>
      );
    case 'trench':
      return (
        <G>
          <Path d="M66 106 L134 106 L130 205 L70 205 Z" fill={primary} />
          <Rect x={50} y={108} width={17} height={72} rx={8} fill={primary} />
          <Rect x={133} y={108} width={17} height={72} rx={8} fill={primary} />
          <Path d="M66 106 L100 120 L134 106 L131 126 L100 136 L69 126 Z" fill={secondary} opacity={0.85} />
          <Line x1={100} y1={136} x2={100} y2={202} stroke={secondary} strokeWidth={2} />
          <Line x1={72} y1={150} x2={128} y2={150} stroke={secondary} strokeWidth={1} opacity={0.5} />
        </G>
      );
    case 'rig':
      return (
        <G>
          <Path d="M70 108 L130 108 L125 178 L75 178 Z" fill={primary} />
          <Line x1={80} y1={118} x2={120} y2={118} stroke={secondary} strokeWidth={2} />
          <Line x1={82} y1={132} x2={100} y2={132} stroke={secondary} strokeWidth={2} />
          <Line x1={100} y1={132} x2={100} y2={150} stroke={secondary} strokeWidth={2} />
          <Line x1={100} y1={150} x2={118} y2={150} stroke={secondary} strokeWidth={2} />
          <Circle cx={120} cy={118} r={3} fill={secondary} />
          <Circle cx={82} cy={132} r={3} fill={secondary} />
          <Circle cx={118} cy={150} r={3} fill={secondary} />
          <Rect x={54} y={112} width={14} height={60} rx={7} fill={primary} />
          <Rect x={132} y={112} width={14} height={60} rx={7} fill={primary} />
        </G>
      );
    case 'suit':
      return (
        <G>
          <Path d="M70 108 L130 108 L124 190 L76 190 Z" fill={primary} />
          <Rect x={54} y={112} width={14} height={64} rx={7} fill={primary} />
          <Rect x={132} y={112} width={14} height={64} rx={7} fill={primary} />
          <Rect x={78} y={185} width={16} height={60} rx={5} fill={primary} />
          <Rect x={106} y={185} width={16} height={60} rx={5} fill={primary} />
          <Path d="M70 108 L130 108 L124 190 L76 190 Z" fill="none" stroke={secondary} strokeWidth={1.5} opacity={0.9} />
          <Line x1={100} y1={108} x2={100} y2={190} stroke={secondary} strokeWidth={1} opacity={0.7} />
          <Line x1={61} y1={112} x2={61} y2={176} stroke={secondary} strokeWidth={1} opacity={0.7} />
          <Line x1={139} y1={112} x2={139} y2={176} stroke={secondary} strokeWidth={1} opacity={0.7} />
        </G>
      );
    default:
      return null;
  }
}

function EnhancementLayer({ shape, primary, secondary }: LayerProps) {
  switch (shape) {
    case 'chromeArm':
      return (
        <G>
          <Rect x={131} y={110} width={16} height={68} rx={8} fill={primary} />
          <Line x1={133} y1={126} x2={145} y2={126} stroke={secondary} strokeWidth={2} />
          <Line x1={133} y1={142} x2={145} y2={142} stroke={secondary} strokeWidth={2} />
          <Line x1={133} y1={158} x2={145} y2={158} stroke={secondary} strokeWidth={2} />
          <Circle cx={139} cy={182} r={8} fill={primary} stroke={secondary} strokeWidth={1.5} />
        </G>
      );
    case 'optics':
      return (
        <G>
          <Rect x={85} y={64} width={12} height={8} rx={2} fill={secondary} stroke={primary} strokeWidth={1.5} />
          <Circle cx={91} cy={68} r={2} fill={primary} />
          <Line x1={97} y1={68} x2={104} y2={68} stroke={primary} strokeWidth={1.5} />
          <Circle cx={109} cy={68} r={3} fill={primary} opacity={0.9} />
        </G>
      );
    case 'spikes':
      return (
        <G>
          <Polygon points="88,96 84,84 92,94" fill={primary} />
          <Polygon points="96,98 94,84 100,96" fill={primary} />
          <Polygon points="106,97 108,84 112,95" fill={primary} />
          <Circle cx={86} cy={90} r={1.6} fill={secondary} />
          <Circle cx={96} cy={89} r={1.6} fill={secondary} />
          <Circle cx={109} cy={89} r={1.6} fill={secondary} />
        </G>
      );
    case 'core':
      return (
        <G>
          <Circle cx={100} cy={140} r={13} fill="#0a0d1c" stroke={primary} strokeWidth={2.5} />
          <Circle cx={100} cy={140} r={6} fill={primary} opacity={0.9} />
          <Circle cx={100} cy={140} r={19} fill="none" stroke={secondary} strokeWidth={1} opacity={0.6} />
        </G>
      );
    default:
      return null;
  }
}

function HeadgearLayer({ shape, primary, secondary }: LayerProps) {
  switch (shape) {
    case 'visor':
      return (
        <G>
          <Rect x={74} y={60} width={52} height={13} rx={4} fill={secondary} stroke={primary} strokeWidth={2} />
          <Line x1={78} y1={66} x2={122} y2={66} stroke={primary} strokeWidth={1.5} opacity={0.8} />
        </G>
      );
    case 'halo':
      return (
        <G>
          <Ellipse cx={100} cy={36} rx={30} ry={8} fill="none" stroke={primary} strokeWidth={2.5} />
          <Circle cx={70} cy={36} r={3} fill={secondary} />
          <Circle cx={130} cy={36} r={3} fill={secondary} />
        </G>
      );
    case 'crown':
      return (
        <G>
          <Polygon points="76,52 80,30 88,50" fill={primary} />
          <Polygon points="92,48 100,24 108,48" fill={primary} />
          <Polygon points="112,50 120,30 124,52" fill={primary} />
          <Circle cx={80} cy={30} r={2.5} fill={secondary} />
          <Circle cx={100} cy={24} r={2.5} fill={secondary} />
          <Circle cx={120} cy={30} r={2.5} fill={secondary} />
        </G>
      );
    case 'mask':
      return (
        <G>
          <Path d="M78 60 A22 22 0 0 1 122 60 L122 84 A22 14 0 0 1 78 84 Z" fill={primary} opacity={0.95} />
          <Line x1={84} y1={68} x2={96} y2={68} stroke={secondary} strokeWidth={2.5} />
          <Line x1={104} y1={68} x2={116} y2={68} stroke={secondary} strokeWidth={2.5} />
          <Line x1={92} y1={80} x2={108} y2={80} stroke={secondary} strokeWidth={1.5} opacity={0.7} />
        </G>
      );
    default:
      return null;
  }
}

function AccessoryLayer({ shape, primary, secondary }: LayerProps) {
  switch (shape) {
    case 'tattoo':
      return (
        <G>
          <Path d="M56 118 L66 126 L56 134 L66 142 L56 150" fill="none" stroke={primary} strokeWidth={2} />
          <Circle cx={61} cy={160} r={2.5} fill={secondary} />
        </G>
      );
    case 'scarf':
      return (
        <G>
          <Rect x={86} y={98} width={28} height={14} rx={6} fill={primary} />
          <Rect x={108} y={104} width={10} height={38} rx={5} fill={primary} />
          <Line x1={113} y1={110} x2={113} y2={136} stroke={secondary} strokeWidth={1.5} opacity={0.9} />
        </G>
      );
    case 'drone':
      return (
        <G>
          <Rect x={148} y={52} width={26} height={16} rx={4} fill={primary} />
          <Circle cx={161} cy={60} r={4} fill={secondary} stroke={colors.cyan} strokeWidth={1.5} />
          <Line x1={146} y1={50} x2={150} y2={54} stroke={primary} strokeWidth={2} />
          <Line x1={176} y1={50} x2={172} y2={54} stroke={primary} strokeWidth={2} />
          <Line x1={161} y1={68} x2={161} y2={76} stroke={primary} strokeWidth={1} opacity={0.5} />
        </G>
      );
    default:
      return null;
  }
}
