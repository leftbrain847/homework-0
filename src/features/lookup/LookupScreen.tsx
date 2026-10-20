import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import type { Lookup } from '@/domain/liveLookup';
import type { SubmitOutcome } from '@/data/live/types';
import { useLookupService } from '@/data/live/useLookupService';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { radius, space, useTheme } from '@/ui/theme';

import { LookupCard } from './LookupCard';

export function LookupScreen({ initialQuery }: { initialQuery?: string }) {
  const { colors } = useTheme();
  const service = useLookupService();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [lookups, setLookups] = useState<Lookup[] | null>(null);
  const [watchError, setWatchError] = useState<string | null>(null);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (!service) return;
    return service.watch(setLookups, setWatchError);
  }, [service]);

  const submit = async (text: string) => {
    if (!service || busy) return;
    setBusy(true);
    setOutcome(await service.submit(text));
    setBusy(false);
  };

  // Arriving from "Look up live" in search runs that query once.
  useEffect(() => {
    if (service && initialQuery && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submit(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, initialQuery]);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Live ownership lookup' }} />
      <View style={[styles.callout, { backgroundColor: colors.warningBg }]}>
        <AppText variant="bodyStrong" style={{ color: colors.warning }}>
          Test feature · real businesses
        </AppText>
        <AppText variant="caption" style={{ color: colors.warning }}>
          Answers are researched by Claude from public sources and are not reviewed by a person.
          Check the linked sources before relying on them.
        </AppText>
      </View>

      {!service ? (
        <AppText muted>
          Live lookup works only in the published preview on claude.ai. It is not available in this
          view.
        </AppText>
      ) : (
        <View style={styles.form}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void submit(query)}
            placeholder="Restaurant or brand name, e.g. Subway"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Restaurant or brand to look up"
            returnKeyType="search"
            maxLength={100}
            maxFontSizeMultiplier={2}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          />
          <Button
            variant="primary"
            label={busy ? 'Sending lookup' : 'Look up ownership'}
            text={busy ? 'Sending…' : 'Look up'}
            onPress={() => void submit(query)}
            disabled={busy || !query.trim()}
          />
          {outcome && <OutcomeMessage outcome={outcome} />}
        </View>
      )}

      {service && (
        <View style={styles.list}>
          <AppText variant="title" accessibilityRole="header">
            Recent lookups
          </AppText>
          {watchError && (
            <AppText muted>
              Live updates stopped ({watchError}). Reload the page to reconnect.
            </AppText>
          )}
          {lookups === null ? (
            <ActivityIndicator color={colors.accent} accessibilityLabel="Loading lookups" />
          ) : lookups.length === 0 ? (
            <AppText muted>No lookups yet. Search a name above to start one.</AppText>
          ) : (
            lookups.map((l) => <LookupCard key={l.id} lookup={l} />)
          )}
        </View>
      )}
    </Screen>
  );
}

function OutcomeMessage({ outcome }: { outcome: SubmitOutcome }) {
  const text =
    outcome.kind === 'sent'
      ? 'Sent to Claude. The result appears below when it is ready.'
      : outcome.kind === 'queued'
        ? `Saved, but it could not be sent to Claude automatically (${outcome.reason}). Send “run the queue” in the Claude chat.`
        : outcome.reason;
  return (
    <AppText variant="caption" muted accessibilityLiveRegion="polite">
      {text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  callout: { borderRadius: radius.md, padding: space.md, gap: space.xs },
  form: { gap: space.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 46,
    paddingHorizontal: space.md,
    fontSize: 16,
  },
  list: { gap: space.md },
});
