import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors } from '@/theme/colors';

export type DonutSegment = { key: string; value: number; color: string };

export type DonutChartProps = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  /** Conteúdo centralizado no furo da rosca (ex.: total do período). */
  centerLabel?: ReactNode;
  /** Segmento em destaque — os demais ficam esmaecidos. */
  highlightKey?: string | null;
  onPress?: () => void;
  accessibilityLabel: string;
};

/** Espaço (px) entre segmentos vizinhos, na cor do fundo. */
const GAP = 2;

/**
 * Gráfico de rosca (feature 003, issue #24) desenhado com
 * `react-native-svg`, que já é dependência do projeto: um `Circle` por
 * segmento, com `strokeDasharray`/`strokeDashoffset`, começando no topo
 * (grupo rotacionado -90°). Um segmento só vira o anel completo; sem
 * valores, só o trilho aparece (o chamador mostra o estado vazio).
 */
export function DonutChart({
  segments,
  size = 160,
  thickness = 22,
  centerLabel,
  highlightKey,
  onPress,
  accessibilityLabel,
}: DonutChartProps) {
  const center = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const gap = segments.length > 1 ? GAP : 0;

  let offset = 0;
  const arcs =
    total > 0
      ? segments.map((segment) => {
          const length = (segment.value / total) * circumference;
          const drawn = Math.max(length - gap, 0.5);
          const arc = (
            <Circle
              key={segment.key}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={`${drawn} ${circumference - drawn}`}
              strokeDashoffset={-offset}
              opacity={highlightKey && highlightKey !== segment.key ? 0.22 : 1}
            />
          );
          offset += length;
          return arc;
        })
      : null;

  const chart = (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.border}
            strokeWidth={thickness}
          />
          {arcs}
        </G>
      </Svg>
      {centerLabel ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: thickness,
            bottom: thickness,
            left: thickness,
            right: thickness,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {centerLabel}
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel}>
        {chart}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {chart}
    </Pressable>
  );
}
