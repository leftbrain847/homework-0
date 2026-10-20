import type { ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { CORRECTIONS_URL, NEW_ISSUE_URL } from '@/config';
import { useDirectoryContext } from '@/data/DirectoryProvider';
import { STALE_AFTER_MONTHS } from '@/domain/ownership';
import { MapKey } from '@/features/map/MapKey';
import { AppText } from '@/ui/AppText';
import { ExternalLink } from '@/ui/ExternalLink';
import { Screen } from '@/ui/Screen';
import { radius, space, useTheme } from '@/ui/theme';

const SHOW_DEV_TOOLS = __DEV__ || process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS === '1';

export function AboutScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <View
        style={[styles.callout, { backgroundColor: colors.notice, borderColor: colors.border }]}
      >
        <AppText variant="bodyStrong">This version uses sample data.</AppText>
        <AppText>
          Every restaurant, brand, firm and source in this app is fictional placeholder data.
          Nothing here describes a real business.
        </AppText>
      </View>

      <Section title="What this app shows">
        <P>
          Ownership Map shows which restaurants belong to brands owned by private equity (PE) firms,
          so you can make informed choices about where to eat. PE ownership is information, not a
          judgement about any restaurant.
        </P>
      </Section>

      <Section title="How ownership is recorded">
        <P>
          Ownership is recorded once per brand, not per restaurant. Each brand lists its ownership
          chain, from the ultimate owner down to the brand (for example, PE firm › holding company ›
          brand). Every location of that brand shows the same record, so one correction updates
          every pin.
        </P>
        <P>
          A franchised location is run by a local franchisee. For those, the app says the franchisor
          is PE-owned, not the restaurant itself.
        </P>
      </Section>

      <Section title="Map key">
        <MapKey />
      </Section>

      <Section title="Status, stake and confidence">
        <Term name="Current / Exited">Whether the firm still holds its stake.</Term>
        <Term name="Majority / Minority">
          Whether the firm holds a controlling stake or a smaller investment.
        </Term>
        <Term name="Confirmed">Stated by the company, the firm, or a regulatory filing.</Term>
        <Term name="Reported">
          Published by a credible outlet but not confirmed by the parties.
        </Term>
      </Section>

      <Section title="Sources and verification">
        <P>
          Every ownership claim shows its source and the date it was last checked. If there is no
          source, the app shows “Ownership unverified” and no PE label. Records last checked more
          than {STALE_AFTER_MONTHS / 12} years ago are marked as possibly out of date.
        </P>
      </Section>

      <Section title="Corrections">
        <P>
          Found an error or have a better source? Open an issue or pull request with a link to a
          public source. Corrections without a source cannot be accepted.
        </P>
        <ExternalLink href={CORRECTIONS_URL}>How to submit a correction</ExternalLink>
        <ExternalLink href={NEW_ISSUE_URL}>Open an issue</ExternalLink>
      </Section>

      <Section title="Privacy">
        <P>No accounts, no analytics, no tracking, no ads.</P>
        <P>
          Your location is used only when you tap “Near me”, only to center the map, and only on
          this device. It is never stored or sent anywhere. Independent alternatives are measured
          from the selected restaurant, not from you.
        </P>
      </Section>

      <Section title="Licenses">
        <P>App code: MIT License. Data: Creative Commons Attribution 4.0 (CC BY 4.0).</P>
        <P>
          Map data on the web preview: © OpenStreetMap contributors. Outlines: Natural Earth, US
          Census (public domain).
        </P>
      </Section>

      {SHOW_DEV_TOOLS && <DevTools />}
    </Screen>
  );
}

function DevTools() {
  const { dataset, setDataset } = useDirectoryContext();
  return (
    <Section title="Developer">
      <View style={styles.devRow}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Stress-test data</AppText>
          <AppText variant="caption" muted>
            Replaces the map with 5,000 synthetic pins to check performance.
          </AppText>
        </View>
        <Switch
          value={dataset === 'stress'}
          onValueChange={(on) => setDataset(on ? 'stress' : 'sample')}
          accessibilityLabel="Stress-test data, 5,000 synthetic pins"
        />
      </View>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function P({ children }: { children: ReactNode }) {
  return <AppText style={styles.p}>{children}</AppText>;
}

function Term({ name, children }: { name: string; children: ReactNode }) {
  return (
    <AppText style={styles.p}>
      <AppText variant="bodyStrong">{name}: </AppText>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  callout: { borderWidth: 1, borderRadius: radius.md, padding: space.lg, gap: space.xs },
  section: { gap: space.md },
  p: { maxWidth: 640 },
  flex: { flex: 1 },
  devRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
