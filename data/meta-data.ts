import { CATEGORY_NAMES } from "./categories"
import { defaultUrl } from "./default-url"

// Every Category's display name, so a Category is discoverable the day its row
// lands rather than whenever someone remembers to edit a comma-separated string.
const keywords = [
  "React Native",
  ...CATEGORY_NAMES,
  "Design",
  "Engineering",
  "Web Development",
  "JavaScript",
  "Tailwind CSS",
  "Supabase",
  "Free Tools",
  "Design Engineering",
].join(", ")

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Awesome React Native UI - A list of community made animations",
  description: "A list of React Native animations made by the community",
  keywords,
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
