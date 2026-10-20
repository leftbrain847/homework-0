import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useDirectory } from '@/data/DirectoryProvider';
import { formatVerifiedDate, isStale } from '@/domain/ownership';
import type { PortfolioEntry } from '@/domain/portfolio';
import { AppText } from '@/ui/AppText';
import { ExternalLink } from '@/ui/ExternalLink';
import { PinGlyph } from '@/ui/PinGlyph';
import { Screen } from '@/ui/Screen';
import { radius, space, useTheme } from '@/ui/theme';

export function FirmScreen({ firmId }: { firmId: string }) {
  const directory = useDirectory();
  if (!directory) return <ActivityIndicator style={styles.loading} accessibilityLabel="Loading" />;

  const portfolio = directory.getPortfolio(firmId);
  if (!portfolio) {
    return (
      <Screen>
        <AppText>This firm is not in the dataset.</AppText>
      </Screen>
    );
  }
  const { firm, current, exited } = portfolio;

  return (
    <Screen>
      <Stack.Screen options={{ title: firm.name }} />
      <View style={styles.header}>
        <AppText variant="label" muted>
          {firm.type === 'pe_firm' ? 'Private equity firm' : 'Holding company'}
        </AppText>
        <AppText variant="heading" accessibilityRole="header">
          {firm.name}
        </AppText>
        {firm.website && (
          <ExternalLink href={firm.website}>
            {firm.website.replace(/^https?:\/\//, '')}
          </ExternalLink>
        )}
        <AppText muted>
          {current.length === 0
            ? 'No current holdings in this dataset.'
            : `Current owner or investor in ${current.length} brand${current.length === 1 ? '' : 's'} in this dataset.`}
        </AppText>
        <AppText variant="caption" muted>
          Sample data. This firm and its brands are fictional.
        </AppText>
      </View>

      <Holdings title="Current holdings" entries={current} />
      {exited.length > 0 && <Holdings title="Past holdings" entries={exited} />}
    </Screen>
  );
}

function Holdings({ title, entries }: { title: string; entries: PortfolioEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <View style={styles.section}>
      <AppText variant="title" accessibilityRole="header">
        {`${title} (${entries.length})`}
      </AppText>
      {entries.map((e) => (
        <HoldingCard key={e.brand.id} entry={e} />
      ))}
    </View>
  );
}

function HoldingCard({ entry }: { entry: PortfolioEntry }) {
  const { colors } = useTheme();
  const { brand, path, locationCount } = entry;
  const exited = brand.status === 'exited';
  const stake = brand.stake_type === 'minority' ? 'Minority stake' : 'Majority stake';
  const years = exited
    ? `${brand.acquired_year}–${brand.exited_year}`
    : `since ${brand.acquired_year}`;
  const confidence = brand.confidence === 'reported' ? 'Reported' : 'Confirmed';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardTitle}>
        <PinGlyph category={exited ? 'previously_pe' : 'pe_backed'} size={22} />
        <AppText variant="bodyStrong" style={styles.flex}>
          {brand.name}
        </AppText>
      </View>
      <AppText muted accessibilityLabel={`Ownership path: ${path.join(', then ')}`}>
        {path.join('  ›  ')}
      </AppText>
      <AppText>
        {`${stake} ${years} · ${confidence} · ${locationCount} location${locationCount === 1 ? '' : 's'}`}
      </AppText>
      {brand.source_url && brand.last_verified && (
        <View style={styles.source}>
          <ExternalLink href={brand.source_url}>Source</ExternalLink>
          <AppText variant="caption" muted>
            {`Last verified ${formatVerifiedDate(brand.last_verified)}`}
            {isStale(brand.last_verified, new Date()) ? ' · may be out of date' : ''}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
  header: { gap: space.sm },
  section: { gap: space.md },
  flex: { flex: 1, minWidth: 0 },
  card: { borderWidth: 1, borderRadius: radius.md, padding: space.lg, gap: space.sm },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  source: { flexDirection: 'row', alignItems: 'baseline', gap: space.md, flexWrap: 'wrap' },
});
