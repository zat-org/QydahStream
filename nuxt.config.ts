// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: {
    enabled: false,
  },
  ssr: false,
  modules: ["@nuxtjs/tailwindcss", '@pinia/nuxt', ],
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

});