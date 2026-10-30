import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WIND_SPEED_STOPS } from '../format/wind-field';
import { speed, speedUnitLabel } from '../format/units';
import { useAppState } from '../state/app-state';
import { useTheme } from '../theme/theme-context';
import { fonts, space } from '../theme/tokens';
import { Segmented, Switch, Txt } from './primitives';

export type WindHeight = 10 | 2000 | 3000;

const HEIGHT_OPTIONS: { value: `${WindHeight}`; label: string }[] = [
  { value: '10', label: 'Surface' },
  { value: '2000', label: '2000 m' },
  { value: '3000', label: '3000 m' },
];

function StepButton({
  label,
  glyph,
  disabled,
  onPress,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  let color = c.ink;
  if (disabled) {
    color = c.ink3;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.step, { borderColor: c.line }]}
    >
      <Text style={[styles.stepGlyph, { color }]}>{glyph}</Text>
    </Pressable>
  );
}

function Legend() {
  const { c } = useTheme();
  const { settings } = useAppState();
  return (
    <View style={styles.legend}>
      <View style={styles.legendBar}>
        {WIND_SPEED_STOPS.map(stop => (
          <View
            key={stop.kmh}
            style={[
              styles.legendSegment,
              { backgroundColor: `rgb(${stop.rgb.join(',')})` },
            ]}
          />
        ))}
      </View>
      <View style={styles.legendLabels}>
        {WIND_SPEED_STOPS.map(stop => (
          <Txt
            key={stop.kmh}
            variant="caption"
            color={c.ink2}
            style={styles.legendLabel}
          >
            {speed(stop.kmh, settings.speedUnit)}
          </Txt>
        ))}
      </View>
      <Txt variant="caption" color={c.ink2} style={styles.legendUnit}>
        Wind {speedUnitLabel(settings.speedUnit)}
      </Txt>
    </View>
  );
}

export function WindControls({
  enabled,
  onToggle,
  height,
  onHeight,
  timeLabel,
  canPrev,
  canNext,
  onPrev,
  onNext,
  failed,
  onRetry,
}: {
  enabled: boolean;
  onToggle: () => void;
  height: WindHeight;
  onHeight: (height: WindHeight) => void;
  timeLabel: string | null;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  failed: boolean;
  onRetry: () => void;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}
    >
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        onPress={onToggle}
        style={styles.toggle}
      >
        <Txt style={styles.toggleLabel}>Wind layer</Txt>
        <Switch on={enabled} />
      </Pressable>
      {enabled && (
        <>
          <Segmented
            options={HEIGHT_OPTIONS}
            value={`${height}`}
            onChange={value => onHeight(Number(value) as WindHeight)}
            height={36}
            minWidth={0}
            stretch
          />
          {failed && (
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={styles.error}
            >
              <Txt
                variant="caption"
                color={c.rating.red.ink}
                style={styles.semibold}
              >
                Wind data unavailable. Tap to retry.
              </Txt>
            </Pressable>
          )}
          {!failed && (
            <View style={styles.time}>
              <StepButton
                label="Earlier hour"
                glyph="‹"
                disabled={!canPrev}
                onPress={onPrev}
              />
              <Txt variant="data" style={styles.timeLabel}>
                {timeLabel ?? '…'}
              </Txt>
              <StepButton
                label="Later hour"
                glyph="›"
                disabled={!canNext}
                onPress={onNext}
              />
            </View>
          )}
          <Legend />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.md,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    width: 280,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  toggleLabel: { fontWeight: '700' },
  semibold: { fontWeight: '600' },
  error: { paddingVertical: space.xs },
  time: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  timeLabel: { flex: 1, textAlign: 'center', fontSize: 14 },
  step: {
    width: 44,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: { fontSize: 22, lineHeight: 24 },
  legend: { gap: 2 },
  legendBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  legendSegment: { flex: 1 },
  legendLabels: { flexDirection: 'row' },
  legendLabel: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '400',
  },
  legendUnit: { fontSize: 11, fontWeight: '400' },
});
