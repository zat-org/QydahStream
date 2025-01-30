// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: {
    enabled: false,
  },
  ssr: false,
  modules: ["@nuxtjs/tailwindcss", '@pinia/nuxt', "nuxt-vuefire"],
  css: ["@/assets/css/fonts.css"],
  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { charset: "utf-8" },
      ],
    },
  },
  runtimeConfig: {
    public: {
      qydhaapi: process.env.WebSocketLink,
    },
  },

  vuefire: {
    config: {
      apiKey: "AIzaSyCGO9_gAJK-pRT6mJ84mNazNBhsuym9Gm4",
      authDomain: "streamconf-41f3c.firebaseapp.com",
      projectId: "streamconf-41f3c",
      appId: "1:369467920206:web:a98ce5ba5257ae50c3d81f",
    },
  },

});