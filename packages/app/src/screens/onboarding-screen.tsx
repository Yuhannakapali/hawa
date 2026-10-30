import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafetyNote } from '../components/feedback';
import { LevelOptions } from '../components/level-options';
import { Overline, PrimaryButton, RatingBox, Txt } from '../components/primitives';
import { requestAlertPermission } from '../notifications';
import { useAppState } from '../state/app-state';
import { useTheme } from '../theme/theme-context';
import { fonts, space } from '../theme/tokens';

const TOTAL_STEPS = 2;

function LegendPills() {
  const { c, chip } = useTheme();
  return (
    <View style={styles.legend}>
      {(['green', 'yellow', 'red'] as const).map((rating) => {
        const item = chip(rating);
        return (
          <View
            key={rating}
            style={[styles.pill, { backgroundColor: c.surface, borderColor: c.line }]}
          >
            <RatingBox chip={item} width={28} height={28} fontSize={15} />
            <Txt style={styles.pillLabel}>{item.label}</Txt>
          </View>
        );
      })}
    </View>
  );
}

function AlertPreview() {
  const { c } = useTheme();
  return (
    <View style={[styles.notification, { backgroundColor: c.surface, borderColor: c.line }]}>
      <View style={[styles.appIcon, { backgroundColor: c.primary }]}>
        <Txt color={c.onPrimary} style={styles.appIconText}>
          H
        </Txt>
      </View>
      <View style={styles.flexColumn}>
        <View style={styles.notificationHead}>
          <Txt variant="caption" color={c.ink2}>
            Hawa
          </Txt>
          <Txt variant="caption" color={c.ink2} style={styles.mono}>
            19:00
          </Txt>
        </View>
        <Txt style={styles.notificationTitle}>Your favorite site is flyable tomorrow</Txt>
        <Txt color={c.ink2} style={styles.small}>
          Check the hourly score before you go.
        </Txt>
      </View>
    </View>
  );
}

export function OnboardingScreen() {
  const { c } = useTheme();
  const { settings, updateSettings } = useAppState();
  const [step, setStep] = useState(1);

  async function finish(allowAlerts: boolean) {
    let eveningAlert = false;
    if (allowAlerts) {
      eveningAlert = await requestAlertPermission();
    }
    updateSettings({ onboarded: true, eveningAlert });
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Txt style={styles.brand}>Hawa</Txt>
          <Txt variant="caption" color={c.ink2} style={styles.mono}>
            {step} of {TOTAL_STEPS}
          </Txt>
        </View>
        {step === 1 && (
          <>
            <View style={styles.intro}>
              <Txt style={styles.headline}>Flyable or not, hour by hour.</Txt>
              <Txt color={c.ink2} style={styles.lead}>
                Scores for launch sites in Nepal, with the reason for every hour.
              </Txt>
            </View>
            <LegendPills />
            <SafetyNote title="Before you fly" size={17} />
            <View style={styles.levels}>
              <Overline>Your pilot level</Overline>
              <LevelOptions
                value={settings.level}
                onChange={(level) => updateSettings({ level })}
              />
            </View>
          </>
        )}
        {step === 2 && (
          <>
            <View style={styles.intro}>
              <Txt style={styles.headline}>Evening alerts</Txt>
              <Txt color={c.ink2} style={styles.lead}>
                Get an alert at 19:00 when a favorite site is flyable tomorrow.
              </Txt>
            </View>
            <AlertPreview />
            <Txt color={c.ink2} style={styles.small}>
              Only for your favorite sites. Change the time or turn alerts off in Settings.
            </Txt>
          </>
        )}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: c.line, backgroundColor: c.bg }]}>
        {step === 1 && <PrimaryButton label="Continue" onPress={() => setStep(2)} />}
        {step === 2 && (
          <>
            <PrimaryButton label="Allow notifications" onPress={() => finish(true)} />
            <Pressable
              accessibilityRole="button"
              onPress={() => finish(false)}
              style={styles.notNow}
            >
              <Txt style={styles.notNowLabel}>Not now</Txt>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const MAX_CONTENT_WIDTH = 560;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    gap: space.xl,
    padding: 20,
    paddingBottom: space.xl,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { fontSize: 22, fontWeight: '800' },
  mono: { fontFamily: fonts.mono },
  intro: { gap: space.md },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 35,
    letterSpacing: -0.6,
  },
  lead: { lineHeight: 23 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 36,
    paddingLeft: 4,
    paddingRight: space.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillLabel: { fontSize: 14, fontWeight: '600' },
  levels: { gap: 10 },
  notification: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: { fontWeight: '800' },
  flexColumn: { flex: 1, gap: 3 },
  notificationHead: { flexDirection: 'row', justifyContent: 'space-between' },
  notificationTitle: { fontSize: 15, fontWeight: '700' },
  small: { fontSize: 14, lineHeight: 20 },
  footer: {
    gap: space.sm,
    paddingTop: space.md,
    paddingHorizontal: 20,
    paddingBottom: space.xl,
    borderTopWidth: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  notNow: { height: 52, alignItems: 'center', justifyContent: 'center' },
  notNowLabel: { fontWeight: '600' },
});
