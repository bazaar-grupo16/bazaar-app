const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
if (!androidClientId) {
  throw new Error("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID is required to register the Google OAuth redirect scheme");
}
// Google redirects OAuth back via the reverse-DNS form of the client ID.
const googleRedirectScheme = `com.googleusercontent.apps.${androidClientId.replace(".apps.googleusercontent.com", "")}`;

export default {
  expo: {
    name: "Bazaar",
    slug: "bazaar-grupo16",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.bazaar.app",
      associatedDomains: ["applinks:bazaar.pib.ar"],
    },
    android: {
      package: "com.bazaar.app",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "https", host: "bazaar.pib.ar", pathPrefix: "/products" },
            { scheme: "https", host: "bazaar.pib.ar", pathPrefix: "/order-polling" },
            { scheme: "https", host: "bazaar.pib.ar", pathPrefix: "/order-result" },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
        {
          action: "VIEW",
          data: [{ scheme: googleRedirectScheme }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      bundler: "metro",
      output: "single",
    },
    scheme: "bazaar",
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      eas: {
        projectId: "e732a3a7-c154-452b-9582-f87ac91ba8c9",
      },
    },
    owner: "bazaar-grupo16",
    plugins: [
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#ff6900",
          defaultChannel: "default",
        },
      ],
      "./plugins/withBazaarKeystore",
    ],
  },
};
