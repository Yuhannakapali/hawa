import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { space } from '../theme/tokens';
import { Txt } from './primitives';

export function HomeTopBar({
  dateLabel,
  updatedLabel,
  onSettings,
  children,
}: {
  dateLabel: string;
  updatedLabel: string;
  onSettings: () => void;
  children: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.home, { borderBottomColor: c.line }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <Txt style={styles.brandName}>Hawa</Txt>
          <Txt variant="overline" color={c.ink2} style={styles.noCaps}>
            {dateLabel}
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={onSettings}
          style={[styles.menu, { borderColor: c.line, backgroundColor: c.surface }]}
        >
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.menuLine, { backgroundColor: c.ink }]} />
          ))}
        </Pressable>
      </View>
      <View style={[styles.row, styles.subRow]}>
        {children}
        <Txt variant="data" color={c.ink2} style={styles.updated}>
          {updatedLabel}
        </Txt>
      </View>
    </View>
  );
}

export function BackTopBar({
  backLabel,
  title = '',
  onBack,
  right,
}: {
  backLabel: string;
  title?: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.back, { borderBottomColor: c.line }]}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={[styles.chevron, { color: c.ink }]}>‹</Text>
        <Txt style={styles.backLabel} numberOfLines={1}>
          {backLabel}
        </Txt>
      </Pressable>
      <Txt variant="rowTitle" style={styles.title} numberOfLines={1}>
        {title}
      </Txt>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  home: {
    gap: 10,
    paddingTop: 6,
    paddingRight: space.md,
    paddingBottom: space.md,
    paddingLeft: 20,
    borderBottomWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  subRow: { gap: space.md, paddingRight: space.sm },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  brandName: { fontSize: 26, fontWeight: '800' },
  noCaps: { textTransform: 'none', letterSpacing: 0, fontWeight: '400' },
  menu: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuLine: { width: 18, height: 2, borderRadius: 1 },
  updated: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '400' },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    minHeight: 56,
    borderBottomWidth: 1,
  },
  backButton: {
    maxWidth: '40%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
    paddingRight: space.md,
  },
  chevron: { fontSize: 28, lineHeight: 30, marginTop: -3 },
  backLabel: { fontWeight: '600', flexShrink: 1 },
  title: { flex: 1, textAlign: 'center' },
  right: { minWidth: 48, alignItems: 'flex-end' },
});
