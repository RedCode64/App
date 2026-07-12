import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

interface ScanlinesProps {
  height?: number;
  opacity?: number;
}

/** CRT scanline texture overlaid on headers. Pointer-events pass through. */
export const Scanlines = memo(function Scanlines({ height = 120, opacity = 0.12 }: ScanlinesProps) {
  const gap = 4;
  const count = Math.ceil(height / gap);
  const lines = Array.from({ length: count }, (_, i) => i * gap);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width="100%" height={height}>
        {lines.map((y) => (
          <Line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="#000000" strokeWidth={2} />
        ))}
      </Svg>
    </View>
  );
});
