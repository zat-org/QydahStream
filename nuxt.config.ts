// https://nuxt.com/docs/api/configuration/nuxt-config
import svgLoader from 'vite-svg-loader'
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: {
    enabled: false,
  },
  ssr: false,
  modules: ["@nuxtjs/tailwindcss", "nuxt-vuefire", '@pinia/nuxt', "nuxt-svgo"],
  svgo: {
    autoImportPath: './assets/SVG/',
       defaultImport: 'component',
       svgo:false,
       svgoConfig: {
       plugins: [
        {
          name: "prefixIds",
          params: {
            delim: "__",
            prefixIds: false,
            prefixClassNames: false
          }
        },
        {
          name: "removeHiddenElems",
          params: {
            isHidden: false,
            displayNone: false,
            opacity0: false,
            circleR0: false,
            ellipseRX0: false,
            ellipseRY0: false,
            rectWidth0: false,
            rectHeight0: false,
            patternWidth0: false,
            patternHeight0: false,
            imageWidth0: false,
            imageHeight0: false,
            pathEmptyD: false,
            polylineEmptyPoints: false,
            polygonEmptyPoints: false
          }}
      ]}
  },
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
  css:["@/assets/css/fonts.css"],
  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { charset: "utf-8" },
      ],
    },
  },
  // vite: 
  // {
  //   plugins: [
  //     svgLoader()
  // ]
 
  //   optimizeDeps: {
  //   exclude: ['gsap']
  // },
  //   build: {
  //     minify: false
  //   }
  // }
});