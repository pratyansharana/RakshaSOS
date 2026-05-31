import { ExpoConfig, ConfigContext } from 'expo/config';

declare const process: {
  env: Record<string, string | undefined>;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  // Ensure the slug is a string or fallback to a default
  const cleanSlug = config.slug
    ? config.slug.replace(/-/g, '').toLowerCase()
    : 'rakshasos';

  const companyPrefix = 'com.yourname'; // CHANGE THIS TO YOUR ACTUAL DEV NAME/COMPANY

  // Notice the parentheses ( ) directly after return
  return {
    ...config,
    name: config.name || 'RakshaSOS',
    slug: config.slug || 'RakshaSOS',
    extra: {
      ...config.extra,
      groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || config.extra?.groqApiKey,
      groqModel: process.env.EXPO_PUBLIC_GROQ_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
      googleMapsApiKey:
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY ||
        config.extra?.googleMapsApiKey,
    },
    ios: {
      ...config.ios,
      bundleIdentifier: `${companyPrefix}.${cleanSlug}`,
    },
    android: {
      ...config.android,
      package: `${companyPrefix}.${cleanSlug}`,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          apiKey:
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
            process.env.GOOGLE_MAPS_API_KEY ||
            config.android?.config?.googleMaps?.apiKey,
        },
      },
      permissions: [
        ...(config.android?.permissions || []),
        'android.permission.CAMERA',
      ],
    },
    plugins: [
      ...(config.plugins || []),
      'expo-asset',
      [
        'expo-camera',
        {
          cameraPermission:
            'RakshaSOS uses the camera so you can capture accident photos inside the SOS flow.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'RakshaSOS uses your live location to include precise coordinates in SOS alerts.',
        },
      ],
      [
        'expo-audio',
        {
          microphonePermission:
            'RakshaSOS uses the microphone when recording incident audio evidence.',
        },
      ],
    ],
  };
};
