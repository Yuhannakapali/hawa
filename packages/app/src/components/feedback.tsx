import { Linking, Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { radius, SAFETY_NOTE, space } from '../theme/tokens';
import { Overline, PrimaryButton, RatingBox, Txt } from './primitives';

const OPEN_METEO_URL = 'https://open-meteo.com';
export const SERVER_ERROR_TITLE = 'Server error, please try again later';

export function OfflineBanner({ since }: { since: string }) {
  const { c } = useTheme();
  return (
    <View
      accessibilityRole="summary"
      style={[styles.banner, { backgroundColor: c.surface2, borderBottomColor: c.line }]}
    >
      <View style={[styles.offlineIcon, { borderColor: c.ink }]}>
        <View style={[styles.offlineSlash, { backgroundColor: c.ink }]} />
      </View>
      <Txt style={styles.bannerText}>Offline — showing saved forecast from {since}</Txt>
    </View>
  );
}

export function StaleBanner({
  lastUpdate,
  onRefresh,
}: {
  lastUpdate: string;
  onRefresh: () => void;
}) {
  const { c, chip } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, styles.staleBanner, { backgroundColor: c.warnBg }]}
    >
      <RatingBox chip={chip('yellow')} width={28} height={28} fontSize={15} />
      <View style={styles.flexColumn}>
        <Txt color={c.warnFg} style={styles.bannerTitle}>
          Forecast may be out of date
        </Txt>
        <Txt variant="caption" color={c.warnFg}>
          Last update {lastUpdate} — more than 6 hours ago.
        </Txt>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onRefresh}
        style={[styles.refresh, { borderColor: c.warnFg }]}
      >
        <Txt color={c.warnFg} style={styles.refreshLabel}>
          Refresh
        </Txt>
      </Pressable>
    </View>
  );
}

export function ErrorCard({
  title = SERVER_ERROR_TITLE,
  body = 'We could not load the forecast. Check again in a minute.',
  actionLabel = 'Retry',
  onRetry,
}: {
  title?: string;
  body?: string;
  actionLabel?: string;
  onRetry: () => void;
}) {
  const { c, chip } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.errorCard, { backgroundColor: c.surface, borderColor: c.line }]}
    >
      <RatingBox
        chip={{ ...chip('red'), glyph: '!' }}
        width={40}
        height={40}
        fontSize={20}
        borderRadius={10}
      />
      <Txt variant="title" style={styles.errorTitle}>
        {title}
      </Txt>
      <Txt color={c.ink2} style={styles.errorBody}>
        {body}
      </Txt>
      <View style={styles.retry}>
        <PrimaryButton label={actionLabel} onPress={onRetry} height={52} />
      </View>
    </View>
  );
}

export function StormCard({ from }: { from: string }) {
  const { chip } = useTheme();
  const red = chip('red');
  return (
    <View accessibilityRole="alert" style={[styles.summaryCard, { backgroundColor: red.bg }]}>
      <View style={[styles.stormIcon, { borderColor: red.fg }]}>
        <Text style={[styles.stormGlyph, { color: red.fg }]}>ϟ</Text>
      </View>
      <View style={styles.flexColumn}>
        <Txt color={red.fg} style={styles.stormTitle}>
          Storm risk from {from}
        </Txt>
        <Txt color={red.fg} style={styles.cardBody}>
          Thermals are strong (CAPE high) and storms may build in the afternoon. Plan to be on the
          ground well before {from}.
        </Txt>
      </View>
    </View>
  );
}

export function SafetyNote({
  title = 'Safety note',
  size = 16,
}: {
  title?: string;
  size?: number;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.safety, { borderColor: c.ink, backgroundColor: c.surface }]}>
      <Overline color={c.ink}>{title}</Overline>
      <Txt style={[styles.safetyText, { fontSize: size }]}>{SAFETY_NOTE}</Txt>
    </View>
  );
}

export function CreditLink() {
  return (
    <Text
      accessibilityRole="link"
      onPress={() => Linking.openURL(OPEN_METEO_URL)}
      style={styles.link}
    >
      Open-Meteo.com
    </Text>
  );
}

export function Credit({
  before = '',
  after = ' (CC BY 4.0).',
}: {
  before?: string;
  after?: string;
}) {
  const { c } = useTheme();
  return (
    <Txt variant="caption" color={c.ink2} style={styles.credit}>
      {before}Weather data by <CreditLink />
      {after}
    </Txt>
  );
}

export function SkeletonBlock({
  width,
  height,
  radius: r = 4,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
}) {
  const { c } = useTheme();
  return <View style={{ width, height, borderRadius: r, backgroundColor: c.skeleton }} />;
}

export const SKELETON_WIDTHS: DimensionValue[] = [
  '70%',
  '55%',
  '62%',
  '48%',
  '66%',
  '52%',
  '60%',
  '45%',
];

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  staleBanner: { paddingRight: space.md, borderBottomWidth: 0 },
  bannerText: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  bannerTitle: { fontSize: 15, fontWeight: '700' },
  offlineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineSlash: { width: 14, height: 2, transform: [{ rotate: '-45deg' }] },
  refresh: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  refreshLabel: { fontSize: 14, fontWeight: '700' },
  flexColumn: { flex: 1, gap: 2 },
  errorCard: {
    margin: space.lg,
    paddingVertical: space.xl,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.md,
    alignItems: 'flex-start',
  },
  errorTitle: { lineHeight: 25 },
  errorBody: { fontSize: 15, lineHeight: 22 },
  retry: { marginTop: space.xs },
  summaryCard: {
    marginTop: space.md,
    marginHorizontal: space.lg,
    padding: space.lg,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stormIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stormGlyph: { fontSize: 22, fontWeight: '800' },
  stormTitle: { fontSize: 18, fontWeight: '800', lineHeight: 23 },
  cardBody: { fontSize: 14, lineHeight: 20 },
  safety: { borderWidth: 2, borderRadius: 12, padding: space.lg, gap: 6 },
  safetyText: { fontWeight: '600', lineHeight: 23 },
  link: { textDecorationLine: 'underline' },
  credit: { lineHeight: 20 },
});
