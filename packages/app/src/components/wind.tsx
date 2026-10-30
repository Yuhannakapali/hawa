import type { DegreeRange } from '@hawa/contracts';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { sectorPath } from '../format/compass';
import { useTheme } from '../theme/theme-context';
import { fonts } from '../theme/tokens';

const ARROW_PATH = 'M9 2 V15 M4 10 L9 15 L14 10';
const COMPASS_RADIUS = 72;
const CARDINALS: [string, number, number][] = [
  ['N', 100, 20],
  ['E', 186, 105],
  ['S', 100, 194],
  ['W', 14, 105],
];

export function WindArrow({
  dirDeg,
  color,
  size = 18,
}: {
  dirDeg: number;
  color: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      style={{ transform: [{ rotate: `${dirDeg}deg` }] }}
    >
      <Path
        d={ARROW_PATH}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WindCompass({
  sectors,
  dirDeg,
  size = 160,
  label,
}: {
  sectors: readonly DegreeRange[];
  dirDeg: number;
  size?: number;
  label: string;
}) {
  const { c } = useTheme();
  const green = c.rating.green;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityLabel={label}>
      <Circle
        cx={100}
        cy={100}
        r={COMPASS_RADIUS}
        fill={c.surface2}
        stroke={c.line}
        strokeWidth={2}
      />
      {sectors.map((sector) => (
        <Path
          key={`${sector[0]}-${sector[1]}`}
          d={sectorPath(sector, COMPASS_RADIUS)}
          fill={green.soft}
          stroke={green.solid}
          strokeWidth={2.5}
        />
      ))}
      {CARDINALS.map(([letter, x, y]) => (
        <SvgText
          key={letter}
          x={x}
          y={y}
          textAnchor="middle"
          fontFamily={fonts.mono}
          fontSize={15}
          fontWeight="600"
          fill={c.ink2}
        >
          {letter}
        </SvgText>
      ))}
      <G rotation={dirDeg} origin="100, 100">
        <Line
          x1={100}
          y1={36}
          x2={100}
          y2={146}
          stroke={c.ink}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <Path d="M100 170 L87 144 L113 144 Z" fill={c.ink} />
      </G>
      <Circle cx={100} cy={100} r={6} fill={c.surface} stroke={c.ink} strokeWidth={2.5} />
    </Svg>
  );
}
