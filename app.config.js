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
    plugins: ["expo-secure-store"],
  },
};