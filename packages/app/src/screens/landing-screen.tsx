import { ScrollView, StyleSheet, View } from 'react-native';
import { Credit, SafetyNote } from '../components/feedback';
import { PrimaryButton, RatingBox, Txt } from '../components/primitives';
import type { ScreenProps } from '../navigation/types';
import { useTheme } from '../theme/theme-context';
import { fonts, space } from '../theme/tokens';

const MAX_WIDTH = 1120;

const DESCRIPTIONS = {
  green: 'Wind and weather are within the limits for your level.',
  yellow: 'Close to a limit. Look carefully and ask local pilots.',
  red: 'Outside the limits. The reason is shown, e.g. "Gusts too strong".',
} as const;

function StoreBadge({ label }: { label: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.store, { borderColor: c.ink }]}>
      <Txt style={styles.storeLabel}>{label}</Txt>
      <Txt variant="caption" color={c.ink2} style={styles.regular}>
        Coming soon
      </Txt>
    </View>
  );
}

export function LandingScreen({ navigation }: ScreenProps<'Landing'>) {
  const { c, chip } = useTheme();
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <Txt style={styles.brand}>Hawa</Txt>
        <Txt variant="caption" color={c.ink2} style={styles.mono}>
          Free · No ads · No account
        </Txt>
      </View>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Txt style={styles.headline}>
            Which launch sites in Nepal are flyable today — and when.
          </Txt>
          <Txt color={c.ink2} style={styles.lead}>
            Hourly scores for Sarangkot and other launch sites, from 06:00 to 18:00 Nepal time.
            Every hour shows the reason.
          </Txt>
          <View style={styles.actions}>
            <PrimaryButton
              label="Open the web app"
              onPress={() => navigation.navigate('Home')}
              height={60}
            />
            <View style={styles.stores}>
              <StoreBadge label="Get it on Google Play" />
              <StoreBadge label="Download on the App Store" />
            </View>
          </View>
        </View>
        <View style={styles.legend}>
          {(['green', 'yellow', 'red'] as const).map((rating) => {
            const item = chip(rating);
            return (
              <View key={rating} style={[styles.legendItem, { backgroundColor: item.soft }]}>
                <RatingBox chip={item} width={44} height={44} fontSize={22} borderRadius={10} />
                <View style={styles.legendText}>
                  <Txt style={styles.legendLabel}>{item.label}</Txt>
                  <Txt style={styles.legendDesc}>{DESCRIPTIONS[rating]}</Txt>
                </View>
              </View>
            );
          })}
          <SafetyNote size={17} />
        </View>
      </View>
      <View style={[styles.footer, { borderTopColor: c.line }]}>
        <Credit after=" (CC BY 4.0). Map data © OpenStreetMap contributors." />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { alignItems: 'center' },
  header: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    paddingVertical: 20,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { fontSize: 24, fontWeight: '800' },
  mono: { fontFamily: fonts.mono, fontWeight: '400' },
  regular: { fontWeight: '400' },
  hero: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    paddingTop: space.xl,
    paddingHorizontal: space.xl,
    paddingBottom: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 40,
    alignItems: 'flex-start',
  },
  heroText: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 400,
    minWidth: 0,
    gap: space.xl,
  },
  headline: {
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: -1.2,
  },
  lead: { fontSize: 18, lineHeight: 27, maxWidth: 520 },
  actions: { gap: 10, maxWidth: 420 },
  stores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  store: {
    flexGrow: 1,
    flexBasis: 180,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  storeLabel: { fontWeight: '700' },
  legend: { flexGrow: 1, flexShrink: 1, flexBasis: 360, minWidth: 0, gap: 10 },
  legendItem: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    padding: space.lg,
    borderRadius: 14,
  },
  legendText: { flex: 1, gap: 3 },
  legendLabel: { fontSize: 18, fontWeight: '700' },
  legendDesc: { fontSize: 15, lineHeight: 21 },
  footer: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    paddingTop: 20,
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
    borderTopWidth: 1,
  },
});
