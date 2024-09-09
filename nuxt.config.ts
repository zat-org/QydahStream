// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  ssr: false,
  modules: ["@nuxtjs/tailwindcss", "nuxt-vuefire"],

  vuefire: {
    config: {
      apiKey: "AIzaSyDxy9R-o8te_2MAqKvZZpS5l-PUS3Y7_FM",
      authDomain: "stream-1d60d.firebaseapp.com",
      projectId: "stream-1d60d",
      storageBucket: "stream-1d60d.appspot.com",
      messagingSenderId: "979205306604",
      appId: "1:979205306604:web:7031aff4f4fcf713904dc9",
    },
  },
  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { charset: "utf-8" },
      ],
    },
  },
});