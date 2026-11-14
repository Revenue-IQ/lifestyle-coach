import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Award } from '../api/client';

/**
 * Shows what a contribution earned, right away, on top of whatever screen is open.
 * Brief, skippable, scaled to the act: a level-up gets a bigger line.
 */
interface AwardsApi {
  showAward: (award: Award) => void;
}

const Ctx = createContext<AwardsApi | null>(null);

export function useAwards(): AwardsApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAwards must be used inside AwardProvider');
  return ctx;
}

export function AwardProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Award | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setCurrent(null);
  }, []);

  const showAward = useCallback(
    (award: Award) => {
      if (timer.current) clearTimeout(timer.current);
      setCurrent(award);
      timer.current = setTimeout(() => setCurrent(null), award.leveledUp ? 5000 : 3200);
    },
    [],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const value = useMemo(() => ({ showAward }), [showAward]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {current && <AwardToast award={current} onDismiss={dismiss} />}
    </Ctx.Provider>
  );
}

function AwardToast({ award, onDismiss }: { award: Award; onDismiss: () => void }) {
  const earned = award.points > 0;
  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 top-0 items-center px-4 pt-4">
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        className={`w-full max-w-md rounded-2xl px-4 py-3 shadow-lg ${award.leveledUp ? 'bg-accent' : 'bg-ink'}`}
      >
        {award.leveledUp ? (
          <Text className="font-bold text-lg text-white">Level {award.level}! Nice going.</Text>
        ) : null}
        <Text className="font-semibold text-base text-white">
          {earned ? `+${award.points} points ${award.reason}` : `Saved. Thanks ${award.reason}.`}
        </Text>
        {!earned && award.capped ? (
          <Text className="font-sans text-sm text-white/80">That one is past today's points cap, but it still counts for you.</Text>
        ) : null}
        {award.next ? (
          <Text className="font-sans text-sm text-white/80">
            {award.next.needed} more to level {award.next.nextLevel}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}
