import { useLocalSearchParams } from 'expo-router';

import { FirmScreen } from '@/features/firm/FirmScreen';

export default function FirmRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FirmScreen firmId={id} />;
}
