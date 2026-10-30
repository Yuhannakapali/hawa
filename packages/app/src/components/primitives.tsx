import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme, type Chip } from '../theme/theme-context';
import { fonts, radius, space, type } from '../theme/tokens';

type Variant = keyof typeof type;

export function Txt({
  variant = 'body',
  color,
  style,
  children,
  numberOfLines,
}: {
  variant?: Variant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
}) {
  const { c } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[type[variant] as TextStyle, { color: color ?? c.ink }, style]}
    >
      {children}
    </Text>
  );
}

export function Overline({ children, color }: { children: ReactNode; color?: string }) {
  const { c } = useTheme();
  return (
    <Txt variant="overline" color={color ?? c.ink2}>
      {children}
    </Txt>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }, style]}>
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  height = 56,
  trailing,
}: {
  label: string;
  onPress: () => void;
  height?: number;
  trailing?: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.primary, { height, backgroundColor: c.primary }]}
    >
      <Txt variant="rowTitle" color={c.onPrimary}>
        {label}
      </Txt>
      {trailing !== undefined && (
        <Txt color={c.onPrimary} style={styles.trailing}>
          {trailing}
        </Txt>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.secondary, { borderColor: c.ink }]}
    >
      <Txt style={styles.bold}>{label}</Txt>
    </Pressable>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  height = 40,
  minWidth = 76,
  stretch = false,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  height?: number;
  minWidth?: number;
  stretch?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.segmented, { backgroundColor: c.surface2 }, stretch && styles.stretch]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        let bg = 'transparent';
        let fg = c.ink;
        if (selected) {
          bg = c.primary;
          fg = c.onPrimary;
        }
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              { height, minWidth, backgroundColor: bg },
              stretch && styles.flex1,
            ]}
          >
            <Txt color={fg} style={styles.segmentLabel}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Switch({ on }: { on: boolean }) {
  const { c } = useTheme();
  let track = c.ink3;
  let knob = c.surface;
  let left = 3;
  if (on) {
    track = c.primary;
    knob = c.onPrimary;
    left = 23;
  }
  return (
    <View style={[styles.track, { backgroundColor: track }]}>
      <View style={[styles.knob, { left, backgroundColor: knob }]} />
    </View>
  );
}

export function SwitchRow({
  title,
  subtitle,
  on,
  onToggle,
  style,
}: {
  title: string;
  subtitle: string;
  on: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={onToggle}
      style={[styles.switchRow, style]}
    >
      <View style={styles.flexColumn}>
        <Txt style={styles.semibold}>{title}</Txt>
        <Txt variant="caption" color={c.ink2}>
          {subtitle}
        </Txt>
      </View>
      <Switch on={on} />
    </Pressable>
  );
}

export function StarButton({
  on,
  onPress,
  size = 24,
  width = 48,
  height = 48,
}: {
  on: boolean;
  onPress: () => void;
  size?: number;
  width?: number;
  height?: number;
}) {
  const { c } = useTheme();
  let glyph = '☆';
  let color = c.ink3;
  let label = 'Add to favorites';
  if (on) {
    glyph = '★';
    color = c.ink;
    label = 'Remove from favorites';
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.center, { width, height }]}
    >
      <Text style={{ fontSize: size, color }}>{glyph}</Text>
    </Pressable>
  );
}

export function RatingBox({
  chip,
  width,
  height,
  fontSize,
  borderRadius = radius.sm,
}: {
  chip: Chip;
  width: number;
  height: number;
  fontSize: number;
  borderRadius?: number;
}) {
  return (
    <View
      accessibilityLabel={chip.label}
      style={[styles.center, { width, height, borderRadius, backgroundColor: chip.bg }]}
    >
      <Text style={[styles.glyph, { color: chip.fg, fontSize }]}>{chip.glyph}</Text>
    </View>
  );
}

export function RatingInline({
  chip,
  color,
  size = 22,
}: {
  chip: Chip;
  color?: string;
  size?: number;
}) {
  return (
    <View style={styles.inline}>
      <RatingBox chip={chip} width={size} height={size} fontSize={13} borderRadius={5} />
      <Txt variant="caption" color={color} style={styles.semibold}>
        {chip.label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space.lg },
  primary: {
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: space.xl,
  },
  trailing: { fontSize: 22 },
  secondary: {
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  bold: { fontWeight: '700' },
  semibold: { fontWeight: '600' },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  stretch: { alignSelf: 'stretch' },
  segment: {
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  segmentLabel: { fontSize: 15, fontWeight: '700' },
  flex1: { flex: 1 },
  track: { width: 52, height: 32, borderRadius: 16 },
  knob: {
    position: 'absolute',
    top: 3,
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingVertical: 6,
    paddingLeft: space.lg,
    paddingRight: space.md,
  },
  flexColumn: { flex: 1, gap: 2 },
  center: { alignItems: 'center', justifyContent: 'center' },
  glyph: { fontFamily: fonts.text, fontWeight: '800' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
