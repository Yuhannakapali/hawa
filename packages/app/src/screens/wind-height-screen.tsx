import type { HourView } from '@hawa/contracts';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DayTabs } from '../components/day-tabs';
import {
  Credit,
  ErrorCard,
  OfflineBanner,
  SERVER_ERROR_TITLE,
  SKELETON_WIDTHS,
  SkeletonBlock,
} from '../components/feedback';
import { BackTopBar } from '../components/nav-bars';
import { Txt } from '../components/primitives';
import { WindArrow } from '../components/wind';
import { classifyLoadError } from '../format/load-error';
import { nepalClock } from '../format/time';
import { altitude, speed, speedUnitLabel } from '../format/units';
import { useForecast, useSite } from '../hooks/use-site-data';
import type { ScreenProps } from '../navigation/types';
import { useAppState } from '../state/app-state';
import { useTheme } from '../theme/theme-context';
import { fonts, space } from '../theme/tokens';

const TIME_COL_WIDTH = 64;
const LEVEL_NAMES = { student: 'Student', pilot: 'Pilot' } as const;

interface Cell {
  speedKmh: number;
  dirDeg: number;
  overLimit: boolean;
}

function cellsFor(hour: HourView): Cell[] {
  return [
    {
      speedKmh: hour.windKmh,
      dirDeg: hour.dirDeg,
      overLimit: hour.windOverLimit,
    },
    ...hour.windAtHeight.map((w) => ({
      speedKmh: w.speedKmh,
      dirDeg: w.dirDeg,
      overLimit: w.overLimit,
    })),
  ];
}

function WindCell({ cell }: { cell: Cell }) {
  const { c } = useTheme();
  const { settings } = useAppState();
  const red = c.rating.red;
  let bg = 'transparent';
  let fg = c.ink;
  let weight: '500' | '700' = '500';
  let border = 'transparent';
  let label = `${speed(cell.speedKmh, settings.speedUnit)} ${speedUnitLabel(settings.speedUnit)}`;
  if (cell.overLimit) {
    label += ', above your limit';
    bg = red.soft;
    fg = red.ink;
    weight = '700';
    border = red.ink;
  }
  return (
    <View
      accessibilityLabel={label}
      style={[styles.cell, { backgroundColor: bg, borderColor: border }]}
    >
      {cell.overLimit && (
        <Txt color={fg} style={styles.overMark}>
          ▲
        </Txt>
      )}
      <Txt variant="data" color={fg} style={{ fontWeight: weight }}>
        {speed(cell.speedKmh, settings.speedUnit)}
      </Txt>
      <WindArrow dirDeg={cell.dirDeg} color={fg} size={14} />
    </View>
  );
}

function TableSkeleton() {
  return (
    <View style={styles.skeleton}>
      {SKELETON_WIDTHS.map((_, i) => (
        <View key={i} style={styles.skeletonRow}>
          <SkeletonBlock width={58} height={44} radius={6} />
          {[0, 1, 2, 3].map((col) => (
            <View key={col} style={styles.flex1}>
              <SkeletonBlock width="100%" height={44} radius={6} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function WindHeightScreen({ navigation, route }: ScreenProps<'WindByHeight'>) {
  const { id } = route.params;
  const { c, chip } = useTheme();
  const { settings, favorites } = useAppState();
  const isFavorite = favorites[id] !== undefined;
  const site = useSite(id);
  const forecast = useForecast(id, settings.level, isFavorite);
  const [dayIndex, setDayIndex] = useState(0);

  const days = forecast.data?.data.days ?? [];
  const day = days[dayIndex];
  const unit = speedUnitLabel(settings.speedUnit);
  const levelName = LEVEL_NAMES[settings.level];
  const columns = [
    { label: 'Surface', sub: 'launch' },
    ...[1000, 2000, 3000].map((m) => ({
      label: altitude(m, settings.altitudeUnit),
      sub: 'asl',
    })),
  ];

  function back() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('SiteDetail', { id });
    }
  }

  function reload() {
    site.reload();
    forecast.reload();
  }

  const error = site.error ?? forecast.error;
  let content;
  if (error !== null) {
    const kind = classifyLoadError(error, isFavorite);
    if (kind === 'not-saved-offline') {
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
  } else if (forecast.data === null || day === undefined) {
    content = <TableSkeleton />;
  } else {
    content = (
      <ScrollView stickyHeaderIndices={[0]} style={[styles.table, { borderTopColor: c.line }]}>
        <View style={[styles.headRow, { backgroundColor: c.surface2, borderBottomColor: c.ink }]}>
          <View style={styles.timeHead}>
            <Txt variant="overline" color={c.ink2} style={styles.noCaps}>
              NPT
            </Txt>
          </View>
          {columns.map((col) => (
            <View key={col.label} style={styles.headCell}>
              <Txt variant="caption" style={styles.headLabel}>
                {col.label}
              </Txt>
              <Txt variant="caption" color={c.ink2} style={styles.headSub}>
                {col.sub}
              </Txt>
            </View>
          ))}
        </View>
        {day.hours.map((hour) => (
          <View
            key={hour.timeUtc}
            style={[styles.row, { borderBottomColor: c.line, backgroundColor: c.surface }]}
          >
            <View style={[styles.timeCell, { borderRightColor: c.line }]}>
              <View style={[styles.ratingBar, { backgroundColor: chip(hour.rating).bg }]} />
              <Txt variant="data" style={styles.time}>
                {hour.localTime}
              </Txt>
            </View>
            {cellsFor(hour).map((cell, i) => (
              <WindCell key={i} cell={cell} />
            ))}
          </View>
        ))}
        {day.hours.length === 0 && (
          <View style={styles.noData}>
            <Txt color={c.ink2}>No forecast for this day yet.</Txt>
          </View>
        )}
        <View style={styles.footer}>
          <Credit before="Heights above sea level. Arrows show where the wind blows to. " />
        </View>
      </ScrollView>
    );
  }

  const offlineSince = forecast.data?.offlineSince ?? null;
  const limitKmh = forecast.data?.data.windLimitKmh;

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <BackTopBar backLabel={site.data?.data.name ?? 'Site'} title="Wind by height" onBack={back} />
      {offlineSince !== null && <OfflineBanner since={nepalClock(offlineSince)} />}
      <View style={styles.inner}>
        {days.length > 0 && (
          <View style={styles.tabs}>
            <DayTabs days={days} selected={dayIndex} onSelect={setDayIndex} compact />
          </View>
        )}
        {limitKmh !== undefined && (
          <View style={styles.legend}>
            <Txt
              variant="caption"
              color={c.rating.red.ink}
              style={[styles.limitTag, { backgroundColor: c.rating.red.soft }]}
            >
              ▲ {speed(limitKmh, settings.speedUnit)}
            </Txt>
            <Txt variant="caption" color={c.ink2} style={styles.regular}>
              Above your limit — {levelName}: {speed(limitKmh, settings.speedUnit)} {unit}
            </Txt>
          </View>
        )}
        <View style={styles.flex1}>{content}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  flex1: { flex: 1 },
  regular: { fontWeight: '400', lineHeight: 17 },
  tabs: {
    paddingTop: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: 4,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  limitTag: {
    fontFamily: fonts.mono,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  table: { flex: 1, borderTopWidth: 1 },
  headRow: { flexDirection: 'row', borderBottomWidth: 2 },
  timeHead: {
    width: TIME_COL_WIDTH,
    paddingVertical: 10,
    paddingLeft: space.lg,
    justifyContent: 'center',
  },
  noCaps: { letterSpacing: 0 },
  headCell: {
    flex: 1,
    minWidth: 64,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 1,
  },
  headLabel: { fontWeight: '700' },
  headSub: { fontSize: 11, fontWeight: '400' },
  row: { flexDirection: 'row', borderBottomWidth: 1 },
  timeCell: {
    width: TIME_COL_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: space.md,
    borderRightWidth: 1,
  },
  ratingBar: { width: 6, height: 24, borderRadius: 2 },
  time: { fontSize: 14 },
  cell: {
    flex: 1,
    minWidth: 64,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 2,
  },
  overMark: { fontSize: 11 },
  noData: { padding: space.xl, alignItems: 'center' },
  footer: {
    paddingTop: space.lg,
    paddingHorizontal: 20,
    paddingBottom: space.xl,
  },
  skeleton: { paddingHorizontal: space.lg, gap: 6 },
  skeletonRow: { flexDirection: 'row', gap: 6 },
});
