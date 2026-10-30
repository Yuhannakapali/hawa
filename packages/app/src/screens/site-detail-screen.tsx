import type { DayView, ForecastResponse, HourView, SiteDetail } from '@hawa/contracts';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DayTabs } from '../components/day-tabs';
import {
  Credit,
  ErrorCard,
  OfflineBanner,
  SERVER_ERROR_TITLE,
  SKELETON_WIDTHS,
  SkeletonBlock,
  StormCard,
} from '../components/feedback';
import { BackTopBar } from '../components/nav-bars';
import {
  Card,
  Overline,
  PrimaryButton,
  RatingBox,
  RatingInline,
  StarButton,
  SwitchRow,
  Txt,
} from '../components/primitives';
import { WindArrow, WindCompass } from '../components/wind';
import { cardinal, isInSectors, sectorLabel } from '../format/compass';
import {
  defaultSelectedHour,
  firstStormHour,
  hourReasonText,
  summarizeDay,
} from '../format/day-summary';
import { classifyLoadError } from '../format/load-error';
import { nepalClock } from '../format/time';
import { altitude, speed, speedUnitLabel } from '../format/units';
import { useForecast, useSite } from '../hooks/use-site-data';
import type { ScreenProps } from '../navigation/types';
import { useAppState } from '../state/app-state';
import { useTheme } from '../theme/theme-context';
import { fonts, space } from '../theme/tokens';

const CAPE_SEGMENTS = ['low', 'medium', 'high'] as const;

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function HourRow({
  hour,
  selected,
  onPress,
}: {
  hour: HourView;
  selected: boolean;
  onPress: () => void;
}) {
  const { c, chip } = useTheme();
  const { settings } = useAppState();
  const rating = chip(hour.rating);
  let bg = 'transparent';
  let border = 'transparent';
  if (selected) {
    bg = c.surface;
    border = c.ink;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.hour, { backgroundColor: bg, borderColor: border }]}
    >
      <Txt variant="data" style={styles.hourTime}>
        {hour.localTime}
      </Txt>
      <RatingBox chip={rating} width={36} height={36} fontSize={18} borderRadius={8} />
      <View style={styles.hourText}>
        <Txt style={styles.hourReason}>{hourReasonText(hour)}</Txt>
        <Txt variant="caption" color={c.ink2} style={styles.regular}>
          {rating.label}
        </Txt>
      </View>
      <View style={styles.hourWind}>
        <WindArrow dirDeg={hour.dirDeg} color={c.ink} />
        <View style={styles.hourNumbers}>
          <Txt variant="data">{speed(hour.windKmh, settings.speedUnit)}</Txt>
          <Txt variant="caption" color={c.ink2} style={styles.mono}>
            G {speed(hour.gustKmh, settings.speedUnit)}
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}

function SummaryCard({ day }: { day: DayView }) {
  const { c, chip } = useTheme();
  const summary = summarizeDay(day.hours);
  if (summary === null) {
    return null;
  }
  const rating = chip(summary.rating);
  return (
    <View style={[styles.summary, { backgroundColor: rating.soft }]}>
      <RatingBox chip={rating} width={44} height={44} fontSize={22} borderRadius={10} />
      <View style={styles.flexColumn}>
        <Txt style={styles.summaryTitle}>{summary.title}</Txt>
        {summary.body !== '' && (
          <Txt color={c.ink} style={styles.cardBody}>
            {summary.body}
          </Txt>
        )}
      </View>
    </View>
  );
}

function LaunchWindCard({ site, hour }: { site: SiteDetail; hour: HourView }) {
  const { c, chip } = useTheme();
  const { settings } = useAppState();
  const unit = speedUnitLabel(settings.speedUnit);
  const inSector = isInSectors(hour.dirDeg, site.windSectors);
  let sectorChip = chip('red');
  let sectorText = 'Outside the good sector';
  if (inSector) {
    sectorChip = chip('green');
    sectorText = 'In the good sector';
  }
  const dir = Math.round(hour.dirDeg);
  return (
    <Card style={styles.panel}>
      <View style={styles.panelHead}>
        <Overline>Launch wind</Overline>
        <Txt variant="data" style={styles.panelTime}>
          {hour.localTime}
        </Txt>
      </View>
      <View style={styles.compassRow}>
        <WindCompass
          sectors={site.windSectors}
          dirDeg={hour.dirDeg}
          label={`Wind from ${dir} degrees, good sector ${sectorLabel(site.windSectors)}`}
        />
        <View style={styles.compassText}>
          <View>
            <Txt variant="data" style={styles.bigData}>
              {speed(hour.windKmh, settings.speedUnit)} {unit}
            </Txt>
            <Txt color={c.ink2} style={styles.small}>
              Gust {speed(hour.gustKmh, settings.speedUnit)} {unit}
            </Txt>
          </View>
          <Txt style={styles.small}>
            From {dir}° {cardinal(hour.dirDeg)}
          </Txt>
          <View style={styles.inline}>
            <RatingBox chip={sectorChip} width={22} height={22} fontSize={13} borderRadius={5} />
            <Txt variant="caption" style={styles.semibold}>
              {sectorText}
            </Txt>
          </View>
        </View>
      </View>
      <Txt variant="caption" color={c.ink2} style={styles.regular}>
        Shaded: good wind sector {sectorLabel(site.windSectors)}
      </Txt>
    </Card>
  );
}

function ThermalsCard({ hour }: { hour: HourView }) {
  const { c } = useTheme();
  const { settings } = useAppState();
  const capeIndex = CAPE_SEGMENTS.indexOf(hour.capeLevel);
  const wind2000 = hour.windAtHeight.find((w) => w.altitudeM === 2000);
  return (
    <Card style={styles.panel}>
      <View style={styles.panelHead}>
        <Overline>Thermals</Overline>
        <Txt variant="data" style={styles.panelTime}>
          {hour.localTime}
        </Txt>
      </View>
      <View style={styles.thermals}>
        <View style={styles.thermalCol}>
          <Txt variant="caption" color={c.ink2} style={styles.regular}>
            Thermal strength (CAPE)
          </Txt>
          <Txt variant="title">{capitalize(hour.capeLevel)}</Txt>
          <View style={styles.capeBar}>
            {CAPE_SEGMENTS.map((segment, i) => {
              let bg = c.surface2;
              if (i <= capeIndex) {
                bg = c.ink;
              }
              return <View key={segment} style={[styles.capeSegment, { backgroundColor: bg }]} />;
            })}
          </View>
        </View>
        <View style={styles.thermalCol}>
          <Txt variant="caption" color={c.ink2} style={styles.regular}>
            Cloud base (est.)
          </Txt>
          <Txt variant="data" style={styles.mediumData}>
            {altitude(hour.cloudBaseM, settings.altitudeUnit)}
          </Txt>
          {wind2000 !== undefined && (
            <Txt variant="caption" color={c.ink2} style={styles.regular}>
              Wind at 2000 m: {speed(wind2000.speedKmh, settings.speedUnit)}{' '}
              {speedUnitLabel(settings.speedUnit)}
            </Txt>
          )}
        </View>
      </View>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <View>
      <View style={styles.skeletonSummary}>
        <SkeletonBlock width="100%" height={76} radius={12} />
      </View>
      <View style={styles.skeletonList}>
        {SKELETON_WIDTHS.slice(0, 7).map((width, i) => (
          <View key={i} style={styles.skeletonRow}>
            <SkeletonBlock width={46} height={14} />
            <SkeletonBlock width={36} height={36} radius={8} />
            <View style={styles.flexColumn}>
              <SkeletonBlock width={width} height={14} />
              <SkeletonBlock width="30%" height={10} />
            </View>
            <SkeletonBlock width={54} height={28} radius={6} />
          </View>
        ))}
      </View>
    </View>
  );
}

function ForecastBody({
  site,
  forecast,
  day,
}: {
  site: SiteDetail;
  forecast: ForecastResponse;
  day: DayView;
}) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  let selected = day.hours.find((h) => h.localTime === selectedTime);
  if (selected === undefined) {
    selected = defaultSelectedHour(day.hours);
  }
  const storm = firstStormHour(day.hours);
  const { c } = useTheme();
  const { settings } = useAppState();

  if (day.hours.length === 0) {
    return (
      <View style={styles.noData}>
        <Txt color={c.ink2}>No forecast for this day yet.</Txt>
      </View>
    );
  }

  return (
    <>
      <SummaryCard day={day} />
      {storm !== undefined && <StormCard from={storm.localTime} />}
      <View style={styles.columns}>
        <View style={styles.hoursCol}>
          <View style={styles.hoursHead}>
            <Overline>Hourly · Nepal time</Overline>
            <Overline>Wind {speedUnitLabel(settings.speedUnit)}</Overline>
          </View>
          {day.hours.map((hour) => (
            <HourRow
              key={hour.timeUtc}
              hour={hour}
              selected={hour.localTime === selected?.localTime}
              onPress={() => setSelectedTime(hour.localTime)}
            />
          ))}
        </View>
        {selected !== undefined && (
          <View style={styles.panelsCol}>
            <LaunchWindCard site={site} hour={selected} />
            <ThermalsCard hour={selected} />
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Credit after=" (CC BY 4.0). The score is a guide only." />
        {forecast.fetchedAt !== null && (
          <Txt variant="caption" color={c.ink2} style={styles.regular}>
            Forecast updated {nepalClock(forecast.fetchedAt)}
          </Txt>
        )}
      </View>
    </>
  );
}

export function SiteDetailScreen({ navigation, route }: ScreenProps<'SiteDetail'>) {
  const { id } = route.params;
  const { c } = useTheme();
  const { settings, favorites, toggleFavorite, setSiteAlert } = useAppState();
  const favorite = favorites[id];
  const isFavorite = favorite !== undefined;
  const site = useSite(id);
  const forecast = useForecast(id, settings.level, isFavorite);
  const [dayIndex, setDayIndex] = useState(0);

  function back() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }

  function reload() {
    site.reload();
    forecast.reload();
  }

  const error = site.error ?? forecast.error;
  const offlineSince = forecast.data?.offlineSince ?? null;
  const days = forecast.data?.data.days ?? [];
  const day = days[dayIndex];
  const detail = site.data?.data;

  let content;
  if (error !== null) {
    const kind = classifyLoadError(error, isFavorite);
    if (kind === 'not-found') {
      content = (
        <ErrorCard
          title="Site not found"
          body="This site does not exist or is no longer listed."
          actionLabel="Back to sites"
          onRetry={() => navigation.navigate('Home')}
        />
      );
    } else if (kind === 'not-saved-offline') {
      content = (
        <ErrorCard
          title="Not saved for offline use"
          body="Only favorites are saved. Connect to the internet to see this site."
          onRetry={reload}
        />
      );
    } else {
      content = <ErrorCard title={SERVER_ERROR_TITLE} onRetry={reload} />;
    }
  } else if (detail === undefined || forecast.data === null || day === undefined) {
    content = <DetailSkeleton />;
  } else {
    content = <ForecastBody key={day.date} site={detail} forecast={forecast.data.data} day={day} />;
  }

  let alertSubtitle = 'Off';
  if (favorite?.alertsOn) {
    alertSubtitle = `On · ${settings.alertTime} the evening before`;
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <BackTopBar
        backLabel="Sites"
        onBack={back}
        right={<StarButton on={isFavorite} onPress={() => toggleFavorite(id)} size={26} />}
      />
      {offlineSince !== null && <OfflineBanner since={nepalClock(offlineSince)} />}
      <ScrollView contentContainerStyle={styles.scroll}>
        {detail !== undefined && (
          <View style={styles.header}>
            <Txt variant="display" style={styles.displayLine}>
              {detail.name}
            </Txt>
            <Txt variant="caption" color={c.ink2} style={styles.altLine}>
              Launch {altitude(detail.launchAltM, settings.altitudeUnit)} · Landing{' '}
              {altitude(detail.landingAltM, settings.altitudeUnit)}
            </Txt>
            {detail.notes !== '' && (
              <Txt color={c.ink2} style={styles.notes}>
                {detail.notes}
              </Txt>
            )}
          </View>
        )}
        {detail !== undefined && (
          <View style={[styles.alertRow, { backgroundColor: c.surface, borderColor: c.line }]}>
            <SwitchRow
              title="Alert for this site"
              subtitle={alertSubtitle}
              on={favorite?.alertsOn ?? false}
              onToggle={() => setSiteAlert(id, !(favorite?.alertsOn ?? false))}
            />
          </View>
        )}
        {days.length > 0 && (
          <View style={styles.tabs}>
            <DayTabs days={days} selected={dayIndex} onSelect={setDayIndex} />
          </View>
        )}
        {content}
      </ScrollView>
      {error === null && day !== undefined && (
        <View style={[styles.bottom, { borderTopColor: c.line, backgroundColor: c.bg }]}>
          <PrimaryButton
            label="Wind by height"
            trailing="›"
            onPress={() => navigation.navigate('WindByHeight', { id })}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: {
    paddingBottom: space.sm,
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
  },
  header: {
    paddingTop: space.lg,
    paddingHorizontal: 20,
    paddingBottom: space.md,
    gap: 6,
  },
  displayLine: { lineHeight: 34 },
  altLine: { fontFamily: fonts.mono, fontSize: 14, fontWeight: '400' },
  notes: { fontSize: 15 },
  alertRow: { marginHorizontal: space.lg, borderRadius: 12, borderWidth: 1 },
  tabs: { paddingTop: space.lg, paddingHorizontal: space.lg, paddingBottom: 4 },
  summary: {
    marginTop: space.md,
    marginHorizontal: space.lg,
    padding: space.lg,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  summaryTitle: { fontSize: 18, fontWeight: '700', lineHeight: 23 },
  cardBody: { fontSize: 14, lineHeight: 20 },
  flexColumn: { flex: 1, gap: 4 },
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
    alignItems: 'flex-start',
  },
  hoursCol: { flexGrow: 1, flexShrink: 1, flexBasis: 340, minWidth: 0, gap: 2 },
  hoursHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: space.sm,
  },
  panelsCol: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 300,
    minWidth: 0,
    gap: space.md,
  },
  hour: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: space.md,
    borderRadius: 10,
    borderWidth: 2,
  },
  hourTime: { width: 48, fontSize: 15 },
  hourText: { flex: 1, minWidth: 0, gap: 2 },
  hourReason: { fontSize: 15, fontWeight: '600', lineHeight: 19 },
  hourWind: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hourNumbers: { alignItems: 'flex-end', minWidth: 44 },
  regular: { fontWeight: '400' },
  semibold: { fontWeight: '600' },
  mono: { fontFamily: fonts.mono, fontSize: 12, fontWeight: '400' },
  panel: { gap: space.md },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  panelTime: { fontSize: 15 },
  compassRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
    alignItems: 'center',
  },
  compassText: { flex: 1, minWidth: 120, gap: space.sm },
  bigData: { fontSize: 22 },
  mediumData: { fontSize: 20 },
  small: { fontSize: 14 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  thermals: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  thermalCol: { flex: 1, minWidth: 120, gap: 6 },
  capeBar: { flexDirection: 'row', gap: 4 },
  capeSegment: { flex: 1, height: 8, borderRadius: 2 },
  footer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: space.xl,
    gap: 4,
  },
  bottom: {
    paddingTop: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  noData: { padding: space.xl, alignItems: 'center' },
  skeletonSummary: { marginVertical: space.md, marginHorizontal: space.lg },
  skeletonList: { paddingHorizontal: space.lg, gap: 6 },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    paddingHorizontal: space.md,
  },
});
