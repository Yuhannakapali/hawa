import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ErrorCard, OfflineBanner, StaleBanner } from '../components/feedback';
import { HomeTopBar } from '../components/nav-bars';
import { Segmented } from '../components/primitives';
import { buildSiteRows } from '../format/site-rows';
import { dateLabel, nepalClock, nepalToday } from '../format/time';
import { useSites, useStatus } from '../hooks/use-site-data';
import type { ScreenProps } from '../navigation/types';
import { useAppState } from '../state/app-state';
import { useTheme } from '../theme/theme-context';
import { SiteListSkeleton, SiteListView } from './site-list-view';
import { SiteMapView } from './site-map-view';

type HomeView = 'list' | 'map';

const VIEW_OPTIONS: { value: HomeView; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'map', label: 'Map' },
];

export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { c } = useTheme();
  const { settings, favorites } = useAppState();
  const [view, setView] = useState<HomeView>('list');
  const sites = useSites(settings.level);
  const status = useStatus();

  const offlineSince = sites.data?.offlineSince ?? null;
  const offline = offlineSince !== null;
  const rows = useMemo(
    () => buildSiteRows(sites.data?.data.items ?? [], favorites, offline),
    [sites.data, favorites, offline],
  );

  let updatedLabel = '';
  if (status.data?.lastUpdatedAt) {
    updatedLabel = `Updated ${nepalClock(status.data.lastUpdatedAt)}`;
  }

  function reload() {
    sites.reload();
    status.reload();
  }

  function openSite(id: string) {
    navigation.navigate('SiteDetail', { id });
  }

  let body;
  if (sites.loading && sites.data === null) {
    body = <SiteListSkeleton />;
  } else if (sites.error !== null) {
    body = <ErrorCard onRetry={reload} />;
  } else if (view === 'map') {
    body = <SiteMapView rows={rows} onOpen={openSite} />;
  } else {
    body = <SiteListView rows={rows} offline={offline} onOpen={openSite} />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <HomeTopBar
        dateLabel={dateLabel(nepalToday(new Date()))}
        updatedLabel={updatedLabel}
        onSettings={() => navigation.navigate('Settings')}
      >
        <Segmented options={VIEW_OPTIONS} value={view} onChange={setView} />
      </HomeTopBar>
      {offline && <OfflineBanner since={nepalClock(offlineSince)} />}
      {!offline && status.data?.stale && status.data.lastUpdatedAt && (
        <StaleBanner lastUpdate={nepalClock(status.data.lastUpdatedAt)} onRefresh={reload} />
      )}
      <View style={styles.body}>{body}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
});
