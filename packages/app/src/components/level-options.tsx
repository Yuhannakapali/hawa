import type { PilotLevel } from '@hawa/contracts';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { space } from '../theme/tokens';
import { Txt } from './primitives';

const OPTIONS: { value: PilotLevel; label: string; description: string }[] = [
  {
    value: 'student',
    label: 'Student',
    description: 'APPI 1–3. Uses stricter wind limits.',
  },
  {
    value: 'pilot',
    label: 'Pilot',
    description: 'Club, free and tandem pilots. Standard limits.',
  },
];

export function LevelOptions({
  value,
  onChange,
}: {
  value: PilotLevel;
  onChange: (level: PilotLevel) => void;
}) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        let border = c.line;
        let dot = 'transparent';
        if (selected) {
          border = c.ink;
          dot = c.ink;
        }
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, { backgroundColor: c.surface, borderColor: border }]}
          >
            <View style={[styles.radio, { borderColor: c.ink }]}>
              <View style={[styles.dot, { backgroundColor: dot }]} />
            </View>
            <View style={styles.text}>
              <Txt variant="rowTitle">{option.label}</Txt>
              <Txt color={c.ink2} style={styles.description}>
                {option.description}
              </Txt>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: 12,
    borderWidth: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  text: { flex: 1, gap: 2 },
  description: { fontSize: 14, lineHeight: 19 },
});
