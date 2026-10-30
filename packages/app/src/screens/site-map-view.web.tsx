/// <reference lib="dom" />
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PrimaryButton, RatingBox, StarButton, Txt } from '../components/primitives';
import { WindControls, type WindHeight } from '../components/wind-controls';
import { WindOverlay } from '../components/wind-overlay.web';
import type { SiteRow, SiteRows } from '../format/site-rows';
import { dateLabel, nepalClock, nepalToday } from '../format/time';
import { useWindGrid } from '../hooks/use-site-data';
import { altitude } from '../format/units';
import { useAppState } from '../state/app-state';
import { useTheme, type Theme } from '../theme/theme-context';
import { fonts, space } from '../theme/tokens';

// OpenFreeMap is a hosted OSM tile provider that allows app use; never load tiles from openstreetmap.org directly.
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const NEPAL_CENTER: [number, number] = [84.6, 27.95];
const DEFAULT_ZOOM = 7;
const FIT_PADDING = 60;
const PIN_SIZE = 36;
const WIND_ATTRIBUTION = ' · Wind: Open-Meteo.com (CC BY 4.0)';
const SURFACE: WindHeight = 10;

function windTimeLabel(iso: string): string {
  return `${dateLabel(nepalToday(new Date(iso)))} ${nepalClock(iso)}`;
}
const MAP_ATTRIBUTION = 'OpenFreeMap © OpenMapTiles · © OpenStreetMap contributors';

function pinElement(row: SiteRow, selected: boolean, theme: Theme): HTMLElement {
  const chip = theme.chip(row.today);
  const el = document.createElement('div');
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `${row.site.name}: ${chip.label}`);
  Object.assign(el.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  });
  const dot = document.createElement('div');
  dot.textContent = chip.glyph;
  let ring = theme.c.surface;
  if (selected) {
    ring = theme.c.ink;
  }
  Object.assign(dot.style, {
    width: `${PIN_SIZE}px`,
    height: `${PIN_SIZE}px`,
    borderRadius: `${PIN_SIZE / 2}px`,
    background: chip.bg,
    color: chip.fg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '16px',
    fontFamily: fonts.text,
    border: `3px solid ${ring}`,
    boxSizing: 'border-box',
  });
  el.appendChild(dot);
  if (selected || row.favorite) {
    const name = document.createElement('div');
    name.textContent = row.site.name;
    Object.assign(name.style, {
      fontSize: '12px',
      fontWeight: '700',
      padding: '2px 6px',
      borderRadius: '5px',
      background: theme.c.surface,
      color: theme.c.ink,
      whiteSpace: 'nowrap',
      fontFamily: fonts.text,
    });
    el.appendChild(name);
  }
  return el;
}

function SelectedCard({ row, onOpen }: { row: SiteRow; onOpen: (id: string) => void }) {
  const theme = useTheme();
  const { c, chip } = theme;
  const { settings, toggleFavorite } = useAppState();
  const days: [string, ReturnType<typeof chip>][] = [
    ['Today', chip(row.today)],
    ['Tomorrow', chip(row.tomorrow)],
  ];
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
      <View style={styles.cardHead}>
        <View style={styles.flexColumn}>
          <Txt style={styles.cardTitle}>{row.site.name}</Txt>
          <Txt variant="caption" color={c.ink2} style={styles.mono}>
            {row.site.region} · {altitude(row.site.launchAltM, settings.altitudeUnit)}
          </Txt>
        </View>
        <StarButton
          on={row.favorite}
          onPress={() => toggleFavorite(row.site.id)}
          width={44}
          height={44}
        />
      </View>
      <View style={styles.days}>
        {days.map(([label, item]) => (
          <View key={label} style={[styles.day, { backgroundColor: item.soft }]}>
            <RatingBox chip={item} width={28} height={28} fontSize={15} />
            <View>
              <Txt variant="caption" color={c.ink2} style={styles.regular}>
                {label}
              </Txt>
              <Txt style={styles.dayLabel}>{item.label}</Txt>
            </View>
          </View>
        ))}
      </View>
      <PrimaryButton label="Hourly score" onPress={() => onOpen(row.site.id)} height={52} />
    </View>
  );
}

export function SiteMapView({ rows, onOpen }: { rows: SiteRows; onOpen: (id: string) => void }) {
  const theme = useTheme();
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const allRows = useMemo(() => [...rows.favorites, ...rows.others], [rows]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const overlay = useRef<WindOverlay | null>(null);
  const [windOn, setWindOn] = useState(false);
  const [windHeight, setWindHeight] = useState<WindHeight>(SURFACE);
  const [windTime, setWindTime] = useState<string | undefined>(undefined);
  const wind = useWindGrid(windOn, windHeight, windTime);
  const windData = wind.data;
  let selected = allRows.find((row) => row.site.id === selectedId);
  if (selected === undefined) {
    selected = allRows[0];
  }

  useEffect(() => {
    if (container.current === null) {
      return;
    }
    const instance = new maplibregl.Map({
      container: container.current,
      style: MAP_STYLE_URL,
      center: NEPAL_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });
    map.current = instance;
    overlay.current = new WindOverlay(instance);
    return () => {
      overlay.current?.destroy();
      overlay.current = null;
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (instance === null || allRows.length === 0) {
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    const markers = allRows.map((row) => {
      const el = pinElement(row, row.site.id === selected?.site.id, theme);
      el.addEventListener('click', () => setSelectedId(row.site.id));
      bounds.extend([row.site.lon, row.site.lat]);
      return new maplibregl.Marker({ element: el })
        .setLngLat([row.site.lon, row.site.lat])
        .addTo(instance);
    });
    if (allRows.length > 1) {
      instance.fitBounds(bounds, {
        padding: FIT_PADDING,
        maxZoom: 10,
        duration: 0,
      });
    }
    return () => markers.forEach((marker) => marker.remove());
  }, [allRows, selected, theme]);

  useEffect(() => {
    const layer = overlay.current;
    if (layer === null) {
      return;
    }
    if (!windOn) {
      layer.hide();
    } else if (windData !== null) {
      layer.setField(windData);
    }
  }, [windOn, windData]);

  let timeLabel: string | null = null;
  let timeIndex = -1;
  let times: string[] = [];
  if (windData !== null) {
    times = windData.times;
    timeIndex = times.indexOf(windData.time);
    timeLabel = windTimeLabel(windData.time);
  }
  let attribution = MAP_ATTRIBUTION;
  if (windOn) {
    attribution += WIND_ATTRIBUTION;
  }

  return (
    <View style={styles.wrap}>
      <div ref={container} style={{ position: 'absolute', inset: 0 }} />
      <View style={styles.controls} pointerEvents="box-none">
        <WindControls
          enabled={windOn}
          onToggle={() => setWindOn(!windOn)}
          height={windHeight}
          onHeight={setWindHeight}
          timeLabel={timeLabel}
          canPrev={timeIndex > 0}
          canNext={timeIndex >= 0 && timeIndex < times.length - 1}
          onPrev={() => setWindTime(times[timeIndex - 1])}
          onNext={() => setWindTime(times[timeIndex + 1])}
          failed={wind.error !== null}
          onRetry={wind.reload}
        />
      </View>
      {selected !== undefined && (
        <View style={styles.overlay} pointerEvents="box-none">
          <Txt
            variant="caption"
            color={theme.c.ink2}
            style={[styles.attribution, { backgroundColor: theme.c.surface }]}
          >
            {attribution}
          </Txt>
          <SelectedCard row={selected} onOpen={onOpen} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  controls: { position: 'absolute', top: space.md, left: space.md },
  overlay: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.md,
    gap: space.sm,
  },
  attribution: {
    alignSelf: 'flex-end',
    fontSize: 11,
    fontWeight: '400',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  card: { padding: space.lg, borderRadius: 16, borderWidth: 1, gap: space.md },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  flexColumn: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 19, fontWeight: '700' },
  mono: { fontFamily: fonts.mono, fontWeight: '400' },
  regular: { fontWeight: '400', fontSize: 12 },
  days: { flexDirection: 'row', gap: space.sm },
  day: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    borderRadius: 10,
  },
  dayLabel: { fontSize: 14, fontWeight: '700' },
});
