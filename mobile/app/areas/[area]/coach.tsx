import { AREA_LABELS, GATE_FIELDS, isAreaId, type AreaId } from '@wellbeing/shared';
import { Link, Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, type CoachMessage, type CoachOpen } from '@/api/client';
import { useAcceptStep, useMe, useOpenCoach, useSendCoachMessage, useUpdateProfile, type ProfilePatch } from '@/api/hooks';
import { useAppAuth } from '@/auth';
import { Ask } from '@/components/Ask';
import { Body, Button, Card, ErrorText, Loading, Screen, Small, Subtitle, Title } from '@/components/ui';
import { AREA_COLORS } from '@/theme';

/**
 * The coach for one area. It speaks first, from the rating and its gaps; the
 * person can reply; when it proposes a step, one tap makes it their step.
 * Safety gates are answered here, once, before the first session.
 */
export default function CoachPage() {
  const { area } = useLocalSearchParams<{ area: string }>();
  const { isLoaded, isSignedIn } = useAppAuth();
  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Redirect href="/" />;
  if (!area || !isAreaId(area)) return <Redirect href="/home" />;
  return <Coach area={area} />;
}

function Coach({ area }: { area: AreaId }) {
  const open = useOpenCoach(area);
  const [state, setState] = useState<CoachOpen | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const started = useRef(false);

  const start = (startOver = false) => {
    setUnavailable(null);
    open.mutate(startOver, {
      onSuccess: (data) => setState(data),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 503) setUnavailable(err.message);
      },
    });
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (unavailable) {
    return (
      <Screen
        footer={
          <View>
            <Button title="Try again" onPress={() => start()} loading={open.isPending} />
            <Button title="Back" variant="secondary" className="mt-2" onPress={() => router.back()} />
          </View>
        }
      >
        <Title>{AREA_LABELS[area]} coach</Title>
        <Card>
          <Text className="mb-1 font-semibold text-base text-ink">
            {/GEMINI_API_KEY/.test(unavailable) ? 'Not switched on yet' : "The coach can't answer right now"}
          </Text>
          <Body className="text-muted">{unavailable}</Body>
        </Card>
      </Screen>
    );
  }
  if (open.isPending && !state) return <Loading />;
  if (open.error && !state) {
    return (
      <Screen footer={<Button title="Try again" onPress={() => start()} />}>
        <Title>{AREA_LABELS[area]} coach</Title>
        <ErrorText error={open.error} />
      </Screen>
    );
  }
  if (!state) return <Loading />;

  if (state.status === 'gates') return <Gates area={area} gates={state.gates} onDone={() => start()} />;
  if (state.status === 'under18') {
    return (
      <Screen footer={<Button title="Back" variant="secondary" onPress={() => router.back()} />}>
        <Title>{AREA_LABELS[area]} coach</Title>
        <Card>
          <Body>{state.message}</Body>
        </Card>
      </Screen>
    );
  }
  return (
    <Conversation
      area={area}
      conversationId={state.conversation.id}
      initialMessages={state.messages}
      onStartOver={() => start(true)}
      starting={open.isPending}
    />
  );
}

function Gates({ area, gates, onDone }: { area: AreaId; gates: ('over18' | 'pregnantOrBreastfeeding')[]; onDone: () => void }) {
  const update = useUpdateProfile();
  const [over18, setOver18] = useState<boolean | null>(null);
  const [pregnant, setPregnant] = useState<boolean | null>(null);
  const [conditions, setConditions] = useState('');
  const needOver18 = gates.includes('over18');
  const needPregnant = gates.includes('pregnantOrBreastfeeding');
  const ready = (!needOver18 || over18 !== null) && (!needPregnant || pregnant !== null);

  const save = async () => {
    const patch: ProfilePatch = {};
    if (needOver18) patch.over18 = over18;
    if (needPregnant) patch.pregnantOrBreastfeeding = pregnant;
    if (conditions.trim()) patch.conditions = conditions.trim();
    await update.mutateAsync(patch);
    onDone();
  };

  return (
    <Screen
      footer={
        <View>
          <Button title="Continue" onPress={save} disabled={!ready} loading={update.isPending} />
          <Button title="Not now" variant="secondary" className="mt-2" onPress={() => router.back()} />
          <ErrorText error={update.error} />
        </View>
      }
    >
      <Title>Before we start</Title>
      <Subtitle>Two quick things the coach needs to know, asked once. They change what it will and will not suggest.</Subtitle>
      {needOver18 ? <Ask field={GATE_FIELDS.over18} value={over18} onChange={setOver18} /> : null}
      {needPregnant ? <Ask field={GATE_FIELDS.pregnantOrBreastfeeding} value={pregnant} onChange={setPregnant} /> : null}
      <Ask field={GATE_FIELDS.conditions} value={conditions} onChange={setConditions} />
    </Screen>
  );
}

function Conversation({
  area,
  conversationId,
  initialMessages,
  onStartOver,
  starting,
}: {
  area: AreaId;
  conversationId: string;
  initialMessages: CoachMessage[];
  onStartOver: () => void;
  starting: boolean;
}) {
  const me = useMe();
  const send = useSendCoachMessage(conversationId);
  const accept = useAcceptStep(conversationId);
  const [messagesList, setMessages] = useState<CoachMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);
  const colour = AREA_COLORS[area];

  useEffect(() => setMessages(initialMessages), [initialMessages]);
  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }, [messagesList.length, send.isPending]);

  const activeStep = me.data?.steps.find((s) => s.area === area) ?? null;

  const submit = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    const data = await send.mutateAsync(text);
    setMessages(data.messages);
  };

  const makeStep = async (messageId: string) => {
    await accept.mutateAsync(messageId);
    setAcceptedId(messageId);
  };

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'left', 'right']}>
      <View className="items-center border-b border-line px-4 py-3">
        <View className="w-full max-w-md flex-row items-center justify-between">
          <Pressable accessibilityRole="button" onPress={() => router.back()} className="py-1 pr-3">
            <Small className="text-accent">Back</Small>
          </Pressable>
          <View className="flex-row items-center">
            <View className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colour.main }} />
            <Text className="font-semibold text-base text-ink">{AREA_LABELS[area]} coach</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onStartOver} disabled={starting} className="py-1 pl-3">
            <Small className="text-accent">Start over</Small>
          </Pressable>
        </View>
      </View>

      <ScrollView ref={scroll} contentContainerClassName="items-center px-4 py-4" keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-md">
          {messagesList.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              area={area}
              canAccept={!activeStep && acceptedId === null}
              accepted={acceptedId === m.id || (!!activeStep && !!m.proposedStep && activeStep.title === m.proposedStep.title)}
              onAccept={() => makeStep(m.id)}
              accepting={accept.isPending}
            />
          ))}
          {send.isPending ? (
            <View className="mb-3 self-start rounded-2xl rounded-bl-md bg-card px-4 py-3">
              <Small>thinking...</Small>
            </View>
          ) : null}
          <ErrorText error={send.error ?? accept.error} />
          {activeStep ? (
            <Link href={{ pathname: '/areas/[area]', params: { area } }} asChild>
              <Pressable accessibilityRole="button" className="mt-2 rounded-2xl border border-line bg-card p-3">
                <Small>
                  Your current step here: <Text className="font-semibold text-ink">{activeStep.title}</Text> ({activeStep.doneCount} of {activeStep.targetCount}). Log it from the area page.
                </Small>
              </Pressable>
            </Link>
          ) : null}
        </View>
      </ScrollView>

      <View className="items-center border-t border-line bg-paper px-4 py-3">
        <View className="w-full max-w-md flex-row items-end">
          <TextInput
            className="min-h-[48px] flex-1 rounded-2xl border border-line bg-card px-4 py-3 font-sans text-base text-ink"
            value={draft}
            onChangeText={setDraft}
            placeholder="Say what you like..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            onSubmitEditing={submit}
            blurOnSubmit
          />
          <Button title="Send" className="ml-2 min-h-[48px]" onPress={submit} disabled={!draft.trim()} loading={send.isPending} />
        </View>
        <View className="w-full max-w-md">
          <Small className="mt-2">Habits only, from our own notes. Not medical advice. Nothing you type earns points, so say what you mean.</Small>
        </View>
      </View>
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  area,
  canAccept,
  accepted,
  onAccept,
  accepting,
}: {
  message: CoachMessage;
  area: AreaId;
  canAccept: boolean;
  accepted: boolean;
  onAccept: () => void;
  accepting: boolean;
}) {
  const colour = AREA_COLORS[area];
  if (message.role === 'user') {
    return (
      <View className="mb-3 max-w-[85%] self-end rounded-2xl rounded-br-md bg-ink px-4 py-3">
        <Text className="font-sans text-base text-white">{message.content}</Text>
      </View>
    );
  }
  const notice = message.role === 'notice';
  return (
    <View className="mb-3 max-w-[92%] self-start">
      <View className={`rounded-2xl rounded-bl-md px-4 py-3 ${notice ? 'border border-warn bg-warnSoft' : 'bg-card'}`}>
        <Text className="font-sans text-base leading-relaxed text-ink">{message.content}</Text>
        {message.sources.length > 0 ? (
          <View className="mt-2 flex-row flex-wrap">
            {message.sources.map((s) => (
              <Pressable key={s.id} accessibilityRole="link" onPress={() => Linking.openURL(s.sourceUrl)} className="mb-1 mr-2">
                <Small className="underline">{s.sourceName}</Small>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      {message.proposedStep ? (
        <View className="mt-2 rounded-2xl border p-4" style={{ borderColor: colour.main, backgroundColor: colour.soft }}>
          <Small className="mb-1" >A step to try</Small>
          <Text className="font-semibold text-base text-ink">{message.proposedStep.title}</Text>
          <Small className="mt-1">{message.proposedStep.why}</Small>
          <Small className="mt-1">Do it {message.proposedStep.targetCount} times and it counts as done. Each time earns points.</Small>
          {accepted ? (
            <Small className="mt-3 font-semibold text-ink">This is your step now. Log it from the area page.</Small>
          ) : canAccept ? (
            <Button title="Make it my step" className="mt-3" onPress={onAccept} loading={accepting} />
          ) : (
            <Small className="mt-3">Finish or drop your current step in this area before taking a new one.</Small>
          )}
        </View>
      ) : null}
    </View>
  );
}
