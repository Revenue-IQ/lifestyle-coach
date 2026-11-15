import { FOOTER_DISCLAIMER } from '@wellbeing/shared';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, type PressableProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Page shell: paper background, safe area, centred column that reads well on web and phone.
 * `home` puts a Home link in the top right, which every signed-in page has instead of a
 * "Back home" button at the bottom.
 */
export function Screen({ children, footer, home }: { children: ReactNode; footer?: ReactNode; home?: boolean }) {
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerClassName={`flex-grow items-center px-4 pb-8 ${home ? 'pt-2' : 'pt-6'}`}
        keyboardShouldPersistTaps="handled"
      >
        {home ? (
          <View className="mb-1 w-full max-w-md flex-row justify-end">
            <HomeLink />
          </View>
        ) : null}
        <View className="w-full max-w-md flex-1">{children}</View>
        <View className="w-full max-w-md pt-6">
          <Text className="text-center font-sans text-xs leading-relaxed text-muted">{FOOTER_DISCLAIMER}</Text>
        </View>
      </ScrollView>
      {footer ? (
        <View className="items-center border-t border-line bg-paper px-4 py-3">
          <View className="w-full max-w-md">{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/** The way back to home from any page: top right, always the same words. */
export function HomeLink() {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.replace('/home')} className="py-2 pl-3">
      <Text className="font-semibold text-sm text-accent">Home</Text>
    </Pressable>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text className="mb-2 font-bold text-3xl leading-tight text-ink">{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text className="mb-6 font-sans text-base leading-relaxed text-muted">{children}</Text>;
}

export function Body({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Text className={`font-sans text-base leading-relaxed text-ink ${className}`}>{children}</Text>;
}

export function Small({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Text className={`font-sans text-sm leading-relaxed text-muted ${className}`}>{children}</Text>;
}

type Variant = 'primary' | 'secondary' | 'ghost';

/**
 * Primary and secondary are the same size on purpose: "Skip" and "Not now" are
 * never smaller than the main action (asking-for-input skill).
 */
export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  className = '',
  ...rest
}: PressableProps & { title: string; variant?: Variant; loading?: boolean; className?: string }) {
  const base = 'min-h-[52px] items-center justify-center rounded-2xl px-5 py-3';
  const look =
    variant === 'primary'
      ? 'bg-accent active:opacity-90'
      : variant === 'secondary'
        ? 'border border-line bg-card active:bg-paper'
        : 'bg-transparent active:opacity-70';
  const text = variant === 'primary' ? 'text-white' : variant === 'secondary' ? 'text-ink' : 'text-accent';
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`${base} ${look} ${isDisabled ? 'opacity-60' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#1F2933'} />
      ) : (
        <Text className={`font-semibold text-base ${text}`}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  color,
  wide,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: { main: string; soft: string };
  /** Full width on its own row, for an answer that stands apart from the grid. */
  wide?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      className={`mb-2 rounded-full border px-4 py-2.5 ${wide ? 'w-full items-center' : 'mr-2'} ${
        selected ? 'border-ink bg-ink' : 'border-line bg-card active:bg-paper'
      }`}
      style={color && !selected ? { backgroundColor: color.soft, borderColor: color.soft } : undefined}
    >
      <Text
        className={`font-medium text-base ${selected ? 'text-white' : 'text-ink'}`}
        style={color && !selected ? { color: color.main } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-2xl border border-line bg-card p-4 ${className}`}>{children}</View>;
}

export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return <Text className="mt-3 font-sans text-sm text-warn">{message} Nothing was lost. Try again when you like.</Text>;
}

/** A plain safety message. No humour, shown before anything else on the screen. */
export function SafetyNotice({ text, title = 'A word first' }: { text: string; title?: string }) {
  return (
    <View className="mb-5 rounded-2xl border border-warn bg-warnSoft p-4">
      <Text className="mb-1 font-semibold text-base text-warn">{title}</Text>
      <Text className="font-sans text-base leading-relaxed text-ink">{text}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator color="#2F855A" />
    </View>
  );
}
