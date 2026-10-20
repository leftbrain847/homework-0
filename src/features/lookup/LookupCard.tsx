import { StyleSheet, View } from 'react-native';

import {
  franchiseNote,
  toLiveOwnership,
  type Lookup,
  type LookupResult,
} from '@/domain/liveLookup';
import {
  CATEGORY_LABELS,
  formatVerifiedDate,
  isStale,
  ownershipChainSegments,
  ownershipFacts,
  ownershipHeadline,
} from '@/domain/ownership';
import { AppText } from '@/ui/AppText';
import { ExternalLink } from '@/ui/ExternalLink';
import { PinGlyph } from '@/ui/PinGlyph';
import { radius, space, useTheme } from '@/ui/theme';

const STATUS_TEXT: Record<Lookup['status'], string> = {
  queued: 'Queued',
  researching: 'Researching…',
  done: 'Done',
  failed: 'Could not complete',
};

export function LookupCard({ lookup }: { lookup: Lookup }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <AppText variant="bodyStrong" style={styles.flex} accessibilityRole="header">
          {lookup.query}
        </AppText>
        <View style={[styles.pill, { backgroundColor: colors.surfaceAlt }]}>
          <AppText variant="caption" accessibilityLabel={`Status: ${STATUS_TEXT[lookup.status]}`}>
            {STATUS_TEXT[lookup.status]}
          </AppText>
        </View>
      </View>

      {lookup.status === 'queued' && (
        <AppText variant="caption" muted>
          {lookup.notified === false
            ? 'Not sent to Claude automatically. Send “run the queue” in the Claude chat to process it.'
            : 'Sent to Claude. Results usually take a minute or two.'}
        </AppText>
      )}
      {lookup.status === 'researching' && (
        <AppText variant="caption" muted>
          Claude is checking public sources.
        </AppText>
      )}
      {lookup.status === 'failed' && (
        <AppText variant="caption" muted>
          {lookup.error ?? 'The lookup could not be completed.'}
        </AppText>
      )}
      {lookup.status === 'done' &&
        (lookup.result ? (
          <ResultBody result={lookup.result} />
        ) : (
          <AppText variant="caption" muted>
            The result could not be read.
          </AppText>
        ))}
    </View>
  );
}

function ResultBody({ result }: { result: LookupResult }) {
  const { colors } = useTheme();
  const live = toLiveOwnership(result);
  const { brand, getFirm, category } = live;
  const headline = ownershipHeadline(category, brand, getFirm);
  const chain = ownershipChainSegments(category, brand, getFirm);
  const facts = ownershipFacts(category, brand);
  const note = franchiseNote(result, category);
  const verified = category === 'unverified' ? null : result.lastVerified;

  return (
    <View style={styles.body}>
      <AppText variant="caption" muted>
        Matched: {result.resolvedName}
      </AppText>
      <View
        style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}
        accessible
        accessibilityLabel={
          headline === CATEGORY_LABELS[category]
            ? headline
            : `${CATEGORY_LABELS[category]}. ${headline}`
        }
      >
        <PinGlyph category={category} size={24} />
        <View style={styles.flex}>
          {headline !== CATEGORY_LABELS[category] && (
            <AppText variant="label" muted>
              {CATEGORY_LABELS[category]}
            </AppText>
          )}
          <AppText variant="bodyStrong">{headline}</AppText>
        </View>
      </View>

      {chain.length > 0 && (
        <AppText
          muted
          accessibilityLabel={`Ownership chain: ${chain.map((s) => s.names.join(' and ')).join(', then ')}`}
        >
          {chain.map((s) => s.names.join(' + ')).join('  ›  ')}
        </AppText>
      )}

      {facts.length > 0 && (
        <View style={styles.facts}>
          {facts.map((f) => (
            <View
              key={f.label}
              style={styles.fact}
              accessible
              accessibilityLabel={`${f.label}: ${f.value}`}
            >
              <AppText variant="caption" muted>
                {f.label}
              </AppText>
              <AppText variant="bodyStrong">{f.value}</AppText>
            </View>
          ))}
        </View>
      )}

      {note && <AppText variant="caption">{note}</AppText>}
      {result.notes && category !== 'unverified' && (
        <AppText variant="caption" muted>
          Note: {result.notes}
        </AppText>
      )}
      {category === 'unverified' && (
        <AppText variant="caption" muted>
          No public source supporting an ownership claim was found, so no ownership label is shown.
        </AppText>
      )}

      {category !== 'unverified' && result.sources.length > 0 && (
        <View style={styles.sources}>
          <AppText variant="label" muted accessibilityRole="header">
            Sources
          </AppText>
          {result.sources.map((s) => (
            <View key={s.url} style={styles.source}>
              <ExternalLink href={s.url}>{`${s.publisher}: ${s.title}`}</ExternalLink>
              {s.published && (
                <AppText variant="caption" muted>
                  Published {formatVerifiedDate(s.published)}
                </AppText>
              )}
              <AppText variant="caption" style={{ fontStyle: 'italic' }}>
                “{s.quote}”
              </AppText>
            </View>
          ))}
        </View>
      )}
      {verified && (
        <AppText variant="caption" muted>
          Last verified {formatVerifiedDate(verified)}
          {isStale(verified, new Date()) ? ' · may be out of date' : ''}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.md, padding: space.lg, gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1, minWidth: 0 },
  pill: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2 },
  body: { gap: space.md },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
  },
  facts: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.sm },
  fact: { width: '50%', paddingRight: space.sm, gap: 2 },
  sources: { gap: space.sm },
  source: { gap: 2 },
});
