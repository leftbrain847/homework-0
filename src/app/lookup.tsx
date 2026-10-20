import { useLocalSearchParams } from 'expo-router';

import { LookupScreen } from '@/features/lookup/LookupScreen';

export default function LookupRoute() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  return <LookupScreen initialQuery={q} />;
}
