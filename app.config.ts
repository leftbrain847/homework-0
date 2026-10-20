import type { ConfigContext, ExpoConfig } from 'expo/config';

// Extends app.json with values that must not be committed.
// GOOGLE_MAPS_ANDROID_API_KEY is only needed for Android production (EAS) builds;
// Expo Go and iOS (Apple Maps) work without it. See README "Google Maps API key".
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
  ],
});
