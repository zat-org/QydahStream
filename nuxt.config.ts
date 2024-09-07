// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  ssr:false,
  modules: ['@nuxtjs/tailwindcss'],

  app:{
    head:{
      meta:[
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { charset: "utf-8" },

      ]
    }
  }
})