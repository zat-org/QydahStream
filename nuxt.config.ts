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
      apiKey: process.env.apiKey,
      authDomain:process.env.authDomain,
      projectId: process.env.projectId,
      appId: process.env.appId,
    },
  },

});