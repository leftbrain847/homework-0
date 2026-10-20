import { Fragment, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { canShowAlternatives, findAlternatives } from '@/domain/alternatives';
import { cuisineLabel } from '@/domain/cuisine';
import type { Directory } from '@/domain/directory';
import {
  CATEGORY_LABELS,
  ownershipChainSegments,
  ownershipFacts,
  ownershipHeadline,
  sourceInfo,
} from '@/domain/ownership';
import type { LocationView } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { ExternalLink } from '@/ui/ExternalLink';
import { PinGlyph } from '@/ui/PinGlyph';
import { radius, space, useTheme } from '@/ui/theme';

import { AlternativesList } from './AlternativesList';

interface Props {
  view: LocationView;
  directory: Directory;
  onSelectLocation: (view: LocationView) => void;
  onOpenFirm: (firmId: string) => void;
  onOpenAbout: () => void;
}

export function LocationDetails({
  view,
  directory,
  onSelectLocation,
  onOpenFirm,
  onOpenAbout,
}: Props) {
  const { colors } = useTheme();
  const { location, brand, category } = view;
  const getFirm = directory.getFirm;

  const headline = ownershipHeadline(category, brand, getFirm, location.is_franchised);
  const chain = ownershipChainSegments(category, brand, getFirm);
  const facts = ownershipFacts(category, brand);
  const source = sourceInfo(category, brand, new Date());
  const alternatives = useMemo(
    () => (canShowAlternatives(view) ? findAlternatives(view, directory.views) : null),
    [view, directory],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {location.name}
        </AppText>
        <AppText muted>{location.address}</AppText>
        <AppText variant="caption" muted>
          {cuisineLabel(view.cuisine)}
          {brand ? ` · ${brand.name}` : ''}
        </AppText>
      </View>

      <View
        style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}
        accessible
        accessibilityLabel={
          headline === CATEGORY_LABELS[category]
            ? headline
            : `${CATEGORY_LABELS[category]}. ${headline}`
        }
      >
        <PinGlyph category={category} size={26} />
        <View style={styles.flex}>
          {headline !== CATEGORY_LABELS[category] && (
            <AppText variant="label" muted>
              {CATEGORY_LABELS[category]}
            </AppText>
          )}
          <AppText variant="bodyStrong">{headline}</AppText>
        </View>
      </View>

      {category === 'unverified' && (
        <AppText muted>
          This app has no sourced ownership record for this restaurant yet, so it shows no ownership
          label.{' '}
          <AppText
            onPress={onOpenAbout}
            accessibilityRole="link"
            style={{ color: colors.accent, textDecorationLine: 'underline' }}
          >
            How to submit a correction
          </AppText>
        </AppText>
      )}

      {chain.length > 0 && (
        <View style={styles.section}>
          <AppText variant="label" muted accessibilityRole="header">
            Ownership chain
          </AppText>
          <View style={styles.chain}>
            {chain.map((segment, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <AppText muted accessibilityElementsHidden importantForAccessibility="no">
                    {'  ›  '}
                  </AppText>
                )}
                {segment.ids.length === 0 ? (
                  <AppText variant="bodyStrong">{segment.names[0]}</AppText>
                ) : (
                  segment.ids.map((id, j) => (
                    <Fragment key={id}>
                      {j > 0 && <AppText muted>{' + '}</AppText>}
                      <FirmName
                        id={id}
                        name={segment.names[j] ?? id}
                        directory={directory}
                        onOpenFirm={onOpenFirm}
                      />
                    </Fragment>
                  ))
                )}
              </Fragment>
            ))}
          </View>
        </View>
      )}

      {facts.length > 0 && (
        <View style={[styles.facts, { borderColor: colors.border }]}>
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

      {source && (
        <View style={styles.section}>
          <AppText variant="label" muted accessibilityRole="header">
            Source
          </AppText>
          <ExternalLink href={source.url}>{source.url.replace(/^https?:\/\//, '')}</ExternalLink>
          <AppText variant="caption" muted>
            Last verified {source.lastVerified}
          </AppText>
          {source.stale && (
            <View style={[styles.notice, { backgroundColor: colors.warningBg }]}>
              <AppText variant="caption" style={{ color: colors.warning }}>
                Last verified more than 2 years ago. This may be out of date.
              </AppText>
            </View>
          )}
        </View>
      )}

      {alternatives && (
        <AlternativesList origin={view} result={alternatives} onSelect={onSelectLocation} />
      )}

      <AppText variant="caption" muted>
        Sample data. All businesses, firms and sources shown are fictional.
      </AppText>
    </View>
  );
}

function FirmName({
  id,
  name,
  directory,
  onOpenFirm,
}: {
  id: string;
  name: string;
  directory: Directory;
  onOpenFirm: (id: string) => void;
}) {
  const { colors } = useTheme();
  const firm = directory.getFirm(id);
  if (firm?.type !== 'pe_firm') return <AppText variant="bodyStrong">{name}</AppText>;
  return (
    <Pressable
      onPress={() => onOpenFirm(id)}
      accessibilityRole="link"
      accessibilityLabel={name}
      accessibilityHint="Shows every brand this firm owns"
      hitSlop={8}
    >
      <AppText
        variant="bodyStrong"
        style={{ color: colors.accent, textDecorationLine: 'underline' }}
      >
        {name}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.lg },
  header: { gap: 2 },
  flex: { flex: 1, minWidth: 0 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
  },
  section: { gap: space.xs },
  chain: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.sm,
    rowGap: space.sm,
  },
  fact: { width: '50%', paddingRight: space.sm, gap: 2 },
  notice: { padding: space.sm, borderRadius: radius.sm, marginTop: space.xs },
});
