import { StyleSheet, View } from 'react-native';
import { Txt } from '../components/primitives';
import type { SiteRows } from '../format/site-rows';
import { useTheme } from '../theme/theme-context';

// The native map (@maplibre/maplibre-react-native) is added with the native builds.
export function SiteMapView(_props: { rows: SiteRows; onOpen: (id: string) => void }) {
  const { c } = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: c.surface2 }]}>
      <Txt color={c.ink2}>The map is available on the web for now.</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
