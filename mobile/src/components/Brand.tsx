import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme';

/**
 * The Inner Weather mark: a sun clearing a horizon. Weather that is inside you,
 * changing, never a verdict. Geometry is mirrored in mobile/assets/brand/mark.svg,
 * which the icon files are rendered from; change both together.
 * See docs/architecture/brand.md.
 */
export function Mark({ size = 28, color = colors.accent }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none" accessibilityLabel="Inner Weather">
      <Path d="M30 62 A20 20 0 0 1 70 62 Z" fill={color} />
      <Path d="M12 72 H88" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <Path d="M50 34 V26 M69.8 42.2 L75.5 36.5 M30.2 42.2 L24.5 36.5" stroke={color} strokeWidth={6} strokeLinecap="round" />
    </Svg>
  );
}

/** Mark and name side by side, for the top of the first screens. */
export function Brand({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <View className={`flex-row items-center ${className}`} accessibilityRole="header">
      <Mark size={size} />
      <Text className="ml-2 font-semibold text-ink" style={{ fontSize: size * 0.68, lineHeight: size }}>
        Inner Weather
      </Text>
    </View>
  );
}

/** What the app is, in one line. Used wherever the brand stands alone. */
export const TAGLINE = 'Feel stuck? Find where to look first, then take one small step.';

/**
 * The brand at full size for the very first screen: mark, name and the one line
 * that says what the app does, so a person connects before they are asked anything.
 * Centred on the paper itself, with a hairline below, so it is the page's own
 * header rather than a panel placed on it.
 */
export function Hero({ className = '' }: { className?: string }) {
  return (
    <View className={`items-center border-b border-line px-6 pb-5 pt-3 ${className}`} accessibilityRole="header">
      <Mark size={64} />
      <Text className="mt-2 font-bold text-ink" style={{ fontSize: 30, lineHeight: 36, letterSpacing: -0.5 }}>
        Inner Weather
      </Text>
      <Text className="mt-1 max-w-[320px] text-center font-sans text-base leading-relaxed text-muted">{TAGLINE}</Text>
    </View>
  );
}
