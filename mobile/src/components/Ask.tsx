import type { ChoiceField, FieldDef, NumberField, ScaleField, TextField, YesNoField } from '@wellbeing/shared';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Small } from './ui';

/**
 * The one way the app asks for something: question, the reason it is asked,
 * the input, and (for optional fields) a skip action rendered by the screen's
 * footer at the same size as the main button. See the asking-for-input skill.
 */
export interface AskProps<V> {
  field: FieldDef;
  value: V;
  onChange: (v: V) => void;
  autoFocus?: boolean;
}

export function Ask<V>({ field, value, onChange, autoFocus }: AskProps<V>) {
  return (
    <View className="mb-6">
      <Text className="mb-1 font-semibold text-xl text-ink">{field.label}</Text>
      <Small className="mb-4">{field.why}</Small>
      <Input field={field} value={value} onChange={onChange} autoFocus={autoFocus} />
    </View>
  );
}

function Input<V>({ field, value, onChange, autoFocus }: AskProps<V>) {
  switch (field.type) {
    case 'text':
      return <TextAsk field={field} value={value as unknown as string} onChange={onChange as unknown as (v: string) => void} autoFocus={autoFocus} />;
    case 'number':
      return <NumberAsk field={field} value={value as unknown as number | null} onChange={onChange as unknown as (v: number | null) => void} autoFocus={autoFocus} />;
    case 'choice':
      return <ChoiceAsk field={field} value={value as unknown as string | null} onChange={onChange as unknown as (v: string | null) => void} />;
    case 'yesno':
      return <YesNoAsk field={field} value={value as unknown as boolean | null} onChange={onChange as unknown as (v: boolean | null) => void} />;
    case 'scale':
      return <ScaleAsk field={field} value={value as unknown as number | null} onChange={onChange as unknown as (v: number | null) => void} />;
  }
}

const inputClass =
  'min-h-[52px] rounded-2xl border border-line bg-card px-4 py-3 font-sans text-base text-ink';

function TextAsk({ field, value, onChange, autoFocus }: { field: TextField; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <TextInput
      className={inputClass}
      value={value ?? ''}
      onChangeText={onChange}
      placeholder={field.placeholder}
      placeholderTextColor="#9CA3AF"
      maxLength={field.maxLength}
      autoFocus={autoFocus}
      multiline={(field.maxLength ?? 0) > 100}
    />
  );
}

function NumberAsk({ field, value, onChange, autoFocus }: { field: NumberField; value: number | null; onChange: (v: number | null) => void; autoFocus?: boolean }) {
  return (
    <View className="flex-row items-center">
      <TextInput
        className={`${inputClass} w-32`}
        value={value === null || value === undefined ? '' : String(value)}
        onChangeText={(t) => {
          const n = Number(t.replace(',', '.'));
          onChange(t.trim() === '' || Number.isNaN(n) ? null : n);
        }}
        keyboardType="decimal-pad"
        inputMode="decimal"
        placeholder={field.placeholder ?? `${field.min}–${field.max}`}
        placeholderTextColor="#9CA3AF"
        autoFocus={autoFocus}
      />
      {field.unit ? <Text className="ml-3 font-sans text-base text-muted">{field.unit}</Text> : null}
    </View>
  );
}

function OptionButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`mb-2 min-h-[52px] justify-center rounded-2xl border px-4 py-3 ${
        selected ? 'border-ink bg-ink' : 'border-line bg-card active:bg-paper'
      }`}
    >
      <Text className={`font-medium text-base ${selected ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}

function ChoiceAsk({ field, value, onChange }: { field: ChoiceField; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <View>
      {field.options.map((o) => (
        <OptionButton key={o.value} label={o.label} selected={value === o.value} onPress={() => onChange(value === o.value ? null : o.value)} />
      ))}
    </View>
  );
}

function YesNoAsk({ value, onChange }: { field: YesNoField; value: boolean | null; onChange: (v: boolean | null) => void }) {
  return (
    <View className="flex-row gap-2">
      <View className="flex-1">
        <OptionButton label="Yes" selected={value === true} onPress={() => onChange(value === true ? null : true)} />
      </View>
      <View className="flex-1">
        <OptionButton label="No" selected={value === false} onPress={() => onChange(value === false ? null : false)} />
      </View>
    </View>
  );
}

function ScaleAsk({ field, value, onChange }: { field: ScaleField; value: number | null; onChange: (v: number | null) => void }) {
  const steps = Array.from({ length: field.max - field.min + 1 }, (_, i) => field.min + i);
  return (
    <View>
      <View className="flex-row gap-2">
        {steps.map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n}`}
            accessibilityState={{ selected: value === n }}
            onPress={() => onChange(value === n ? null : n)}
            className={`h-14 flex-1 items-center justify-center rounded-2xl border ${
              value === n ? 'border-ink bg-ink' : 'border-line bg-card active:bg-paper'
            }`}
          >
            <Text className={`font-semibold text-lg ${value === n ? 'text-white' : 'text-ink'}`}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-2 flex-row justify-between">
        <Small>{field.minLabel}</Small>
        <Small>{field.maxLabel}</Small>
      </View>
    </View>
  );
}
