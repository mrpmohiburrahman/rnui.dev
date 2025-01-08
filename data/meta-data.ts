import { defaultUrl } from "./default-url"

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Awesome React Native UI - A list of community made animations",
  description: "A list of React Native animations made by the community",
  keywords:
    "React Native, Accordions, Arc Sliders, Bottom Sheets,Buttons,Carousels,Charts,Circular Progress Bars,Drop Down,Full Apps, Headers, List, Loaders, Misc, Onboarding,Parallaxes, Pickers,Sliders,Tab bars,Design, Engineering, Web Development, JavaScript, Tailwind CSS, Supabase, Free Tools, Design Engineering",
  structuredData: {
    "@context": "http://schema.org",
    "@type": "WebSite",
    name: "Awesome React Native UI - A list of community made animations",
    url: "https://rnui.pixellog.io/",
    description: "A list of React Native animations made by the community",
  },
  socialMediaTags: {
    "og:title": "Awesome React Native UI",
    "og:description": "A list of React Native animations made by the community",
    "twitter:card": "summary_large_image",
  },
}
