import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CreditLink, SafetyNote } from '../components/feedback';
import { LevelOptions } from '../components/level-options';
import { BackTopBar } from '../components/nav-bars';
import { Overline, Segmented, SwitchRow, Txt } from '../components/primitives';
import type { AltitudeUnit, SpeedUnit } from '../format/units';
import type { ScreenProps } from '../navigation/types';
import { ALERT_TIMES, useAppState, type ThemePref } from '../state/app-state';
import { useTheme } from '../theme/theme-context';
import { fonts, space } from '../theme/tokens';

const APP_VERSION = '0.1';
const CC_BY_URL = 'https://creativecommons.org/licenses/by/4.0/';
const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';

const SPEED_OPTIONS: { value: SpeedUnit; label: string }[] = [
  { value: 'kmh', label: 'km/h' },
  { value: 'kt', label: 'knots' },
];
const ALTITUDE_OPTIONS: { value: AltitudeUnit; label: string }[] = [
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft' },
];
const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <Overline>{title}</Overline>
      </View>
      {children}
    </View>
  );
}

function Group({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={[styles.group, { backgroundColor: c.surface, borderColor: c.line }]}>
      {children}
    </View>
  );
}

function Link({ label, url }: { label: string; url: string }) {
  return (
    <Text accessibilityRole="link" onPress={() => Linking.openURL(url)} style={styles.link}>
      {label}
    </Text>
  );
}

export function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  const { c } = useTheme();
  const { settings, updateSettings } = useAppState();

  function back() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }

  function nextAlertTime() {
    const index = ALERT_TIMES.indexOf(settings.alertTime);
    updateSettings({
      alertTime: ALERT_TIMES[(index + 1) % ALERT_TIMES.length],
    });
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <BackTopBar backLabel="Sites" title="Settings" onBack={back} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Pilot level">
          <LevelOptions value={settings.level} onChange={(level) => updateSettings({ level })} />
        </Section>

        <Section title="Alerts">
          <Group>
            <SwitchRow
              title="Evening alert"
              subtitle="When a favorite site is flyable tomorrow"
              on={settings.eveningAlert}
              onToggle={() => updateSettings({ eveningAlert: !settings.eveningAlert })}
              style={[styles.groupRow, { borderBottomColor: c.line }]}
            />
            <Pressable accessibilityRole="button" onPress={nextAlertTime} style={styles.alertTime}>
              <Txt style={styles.rowLabel}>Alert time</Txt>
              <Txt variant="data" style={styles.alertValue}>
                {settings.alertTime}
              </Txt>
              <Text style={[styles.chevron, { color: c.ink3 }]}>›</Text>
            </Pressable>
          </Group>
        </Section>

        <Section title="Units">
          <Group>
            <View style={[styles.unitRow, styles.groupRow, { borderBottomColor: c.line }]}>
              <Txt style={styles.rowLabel}>Wind speed</Txt>
              <Segmented
                options={SPEED_OPTIONS}
                value={settings.speedUnit}
                onChange={(speedUnit) => updateSettings({ speedUnit })}
                height={42}
                minWidth={64}
              />
            </View>
            <View style={styles.unitRow}>
              <Txt style={styles.rowLabel}>Altitude</Txt>
              <Segmented
                options={ALTITUDE_OPTIONS}
                value={settings.altitudeUnit}
                onChange={(altitudeUnit) => updateSettings({ altitudeUnit })}
                height={42}
                minWidth={64}
              />
            </View>
          </Group>
        </Section>

        <Section title="Theme">
          <Segmented
            options={THEME_OPTIONS}
            value={settings.themePref}
            onChange={(themePref) => updateSettings({ themePref })}
            height={46}
            stretch
          />
        </Section>

        <SafetyNote />

        <Section title="Data & credits">
          <View style={[styles.credits, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Txt style={[styles.creditRow, { borderBottomColor: c.line }]}>
              Weather data by <CreditLink />, licensed <Link label="CC BY 4.0" url={CC_BY_URL} />
            </Txt>
            <Txt style={[styles.creditRow, { borderBottomColor: c.line }]}>
              Map data © <Link label="OpenStreetMap contributors" url={OSM_COPYRIGHT_URL} /> (ODbL).
              Rendered with MapLibre.
            </Txt>
            <Txt color={c.ink2} style={[styles.creditRow, styles.lastRow]}>
              Free. No ads. No account. Version {APP_VERSION}
            </Txt>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    gap: space.xl,
    paddingTop: 20,
    paddingHorizontal: space.lg,
    paddingBottom: 28,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  section: { gap: 10 },
  sectionTitle: { paddingHorizontal: 4 },
  group: { borderRadius: 12, borderWidth: 1 },
  groupRow: { borderBottomWidth: 1 },
  alertTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 60,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  rowLabel: { flex: 1, fontWeight: '600' },
  alertValue: { fontSize: 17 },
  chevron: { fontSize: 22 },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.md,
    minHeight: 64,
    paddingVertical: space.sm,
    paddingRight: space.sm,
    paddingLeft: space.lg,
  },
  credits: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: space.lg,
  },
  creditRow: {
    paddingVertical: space.md,
    borderBottomWidth: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  lastRow: { borderBottomWidth: 0 },
  link: { textDecorationLine: 'underline', fontFamily: fonts.text },
});
