import type { DayView } from '@hawa/contracts';
import { Pressable, StyleSheet, View } from 'react-native';
import { dayTabLabel } from '../format/time';
import { useTheme } from '../theme/theme-context';
import { space } from '../theme/tokens';
import { RatingBox, Txt } from './primitives';

export function DayTabs({
  days,
  selected,
  onSelect,
  compact = false,
}: {
  days: DayView[];
  selected: number;
  onSelect: (index: number) => void;
  compact?: boolean;
}) {
  const { c, chip } = useTheme();
  let minHeight = 76;
  let box = 22;
  if (compact) {
    minHeight = 64;
    box = 20;
  }
  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {days.map((day, index) => {
        const isSelected = index === selected;
        const rating = chip(day.rating);
        let bg = c.surface;
        let fg = c.ink;
        let border = c.line;
        if (isSelected) {
          bg = c.primary;
          fg = c.onPrimary;
          border = c.primary;
        }
        return (
          <Pressable
            key={day.date}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(index)}
            style={[styles.tab, { minHeight, backgroundColor: bg, borderColor: border }]}
          >
            <Txt color={fg} style={styles.label}>
              {dayTabLabel(index, day.date)}
            </Txt>
            <View style={styles.rating}>
              <RatingBox chip={rating} width={box} height={box} fontSize={13} borderRadius={5} />
              <Txt variant="caption" color={fg} style={styles.ratingLabel}>
                {rating.label}
              </Txt>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  tab: {
    flex: 1,
    minWidth: 0,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  label: { fontSize: 15, fontWeight: '700' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingLabel: { fontWeight: '600', flexShrink: 1 },
});
