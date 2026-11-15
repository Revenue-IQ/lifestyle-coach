import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, type PressableProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Page shell: paper background, safe area, centred column that reads well on web and phone. */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerClassName="flex-grow items-center px-4 pb-8 pt-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-md flex-1">{children}</View>
      </ScrollView>
      {footer ? (
        <View className="items-center border-t border-line bg-paper px-4 py-3">
          <View className="w-full max-w-md">{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
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
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: { main: string; soft: string };
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      className={`mb-2 mr-2 rounded-full border px-4 py-2.5 ${
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
export function SafetyNotice({ text }: { text: string }) {
  return (
    <View className="mb-5 rounded-2xl border border-warn bg-warnSoft p-4">
      <Text className="mb-1 font-semibold text-base text-ink">A word first</Text>
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
