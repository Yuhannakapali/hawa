import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Credit, SKELETON_WIDTHS, SkeletonBlock } from '../components/feedback';
import { RatingBox, StarButton, Txt } from '../components/primitives';
import type { SiteRow, SiteRows } from '../format/site-rows';
import { altitude } from '../format/units';
import { useAppState } from '../state/app-state';
import { useTheme } from '../theme/theme-context';
import { fonts, SAFETY_NOTE, space } from '../theme/tokens';

function Legend() {
  const { c, chip } = useTheme();
  return (
    <View style={styles.legend}>
      {(['green', 'yellow', 'red'] as const).map((rating) => {
        const item = chip(rating);
        return (
          <View key={rating} style={styles.legendItem}>
            <RatingBox chip={item} width={20} height={20} fontSize={12} borderRadius={5} />
            <Txt variant="caption" color={c.ink2} style={styles.regular}>
              {item.label}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

function ColumnHeader({ label }: { label: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.columnHeader}>
      <Txt variant="overline" color={c.ink2} style={styles.flex1}>
        {label}
      </Txt>
      <Txt variant="overline" color={c.ink2} style={styles.column}>
        Today
      </Txt>
      <Txt variant="overline" color={c.ink2} style={styles.column}>
        Tmrw
      </Txt>
    </View>
  );
}

function Row({ row, onOpen }: { row: SiteRow; onOpen: (id: string) => void }) {
  const { c, chip } = useTheme();
  const { settings, toggleFavorite } = useAppState();
  const alt = altitude(row.site.launchAltM, settings.altitudeUnit);
  let subtitle = `${row.site.region} · ${alt}`;
  if (!row.available) {
    subtitle = `${alt} · not saved offline`;
  }
  return (
    <View style={[styles.row, { borderBottomColor: c.line, backgroundColor: c.surface }]}>
      <StarButton
        on={row.favorite}
        onPress={() => toggleFavorite(row.site.id)}
        width={52}
        height={64}
      />
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${row.site.name}, today ${
          chip(row.today).label
        }, tomorrow ${chip(row.tomorrow).label}`}
        onPress={() => onOpen(row.site.id)}
        style={styles.rowMain}
      >
        <View style={styles.rowText}>
          <Txt variant="rowTitle" numberOfLines={1}>
            {row.site.name}
          </Txt>
          <Txt variant="caption" color={c.ink2} style={styles.mono}>
            {subtitle}
          </Txt>
        </View>
        <RatingBox chip={chip(row.today)} width={44} height={40} fontSize={19} borderRadius={8} />
        <RatingBox
          chip={chip(row.tomorrow)}
          width={44}
          height={40}
          fontSize={19}
          borderRadius={8}
        />
        <Text style={[styles.chevron, { color: c.ink3 }]}>›</Text>
      </Pressable>
    </View>
  );
}

export function SiteListSkeleton() {
  const { c } = useTheme();
  return (
    <View>
      <View style={styles.skeletonHead}>
        <SkeletonBlock width="55%" height={16} />
        <SkeletonBlock width="35%" height={12} />
      </View>
      {SKELETON_WIDTHS.map((width, i) => (
        <View key={i} style={[styles.skeletonRow, { borderBottomColor: c.line }]}>
          <SkeletonBlock width={22} height={22} radius={11} />
          <View style={styles.skeletonText}>
            <SkeletonBlock width={width} height={16} />
            <SkeletonBlock width="40%" height={12} />
          </View>
          <SkeletonBlock width={44} height={40} radius={8} />
          <SkeletonBlock width={44} height={40} radius={8} />
        </View>
      ))}
    </View>
  );
}

export function SiteListView({
  rows,
  offline,
  onOpen,
}: {
  rows: SiteRows;
  offline: boolean;
  onOpen: (id: string) => void;
}) {
  const { c } = useTheme();
  let summary = `${rows.flyableToday} of ${rows.total} sites flyable today`;
  let othersLabel = 'All sites · best first';
  if (offline) {
    summary = 'Saved favorites only';
    othersLabel = 'Other sites';
  }
  return (
    <ScrollView>
      <View style={styles.summary}>
        <Txt style={styles.summaryText}>{summary}</Txt>
        <Legend />
      </View>
      <ColumnHeader label="Favorites" />
      {rows.favorites.length === 0 && (
        <View style={[styles.empty, { borderColor: c.ink3 }]}>
          <Text style={[styles.emptyStar, { color: c.ink }]}>☆</Text>
          <View style={styles.emptyText}>
            <Txt style={styles.bold}>No favorites yet</Txt>
            <Txt color={c.ink2} style={styles.small}>
              Tap the star next to a site to pin it here. Favorites are saved for offline use and
              get evening alerts.
            </Txt>
          </View>
        </View>
      )}
      {rows.favorites.map((row) => (
        <Row key={row.site.id} row={row} onOpen={onOpen} />
      ))}
      <View style={styles.sectionGap} />
      <ColumnHeader label={othersLabel} />
      {rows.others.map((row) => (
        <Row key={row.site.id} row={row} onOpen={onOpen} />
      ))}
      <View style={styles.footer}>
        <Credit before={`${SAFETY_NOTE} `} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  regular: { fontWeight: '400' },
  bold: { fontWeight: '700' },
  mono: { fontFamily: fonts.mono, fontWeight: '400' },
  small: { fontSize: 14, lineHeight: 20 },
  summary: {
    paddingTop: space.lg,
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 10,
  },
  summaryText: { fontSize: 19, fontWeight: '700', lineHeight: 24 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingTop: space.lg,
    paddingRight: 36,
    paddingBottom: 6,
    paddingLeft: 20,
  },
  column: { width: 44, textAlign: 'center' },
  sectionGap: { height: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingRight: space.md,
    borderBottomWidth: 1,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 64,
  },
  rowText: { flex: 1, minWidth: 0, gap: 3 },
  chevron: { width: 16, fontSize: 22, textAlign: 'right' },
  empty: {
    marginTop: 4,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    padding: space.lg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
  },
  emptyStar: { fontSize: 24, lineHeight: 26 },
  emptyText: { flex: 1, gap: 4 },
  footer: { paddingTop: space.lg, paddingHorizontal: 20, paddingBottom: 28 },
  skeletonHead: {
    paddingTop: space.lg,
    paddingHorizontal: 20,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 72,
    paddingRight: space.lg,
    paddingLeft: 20,
    borderBottomWidth: 1,
  },
  skeletonText: { flex: 1, gap: space.sm },
});
