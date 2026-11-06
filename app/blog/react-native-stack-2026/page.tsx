import type { Metadata } from "next"

import { VariantA } from "@/components/prototype/blog-post-variants"

export const metadata: Metadata = {
  title: "The React Native stack I start with in 2026",
  description:
    "Nine-area stack for 2026. Expo SDK 58, Legend State, Expo Router, and the limit on each pick.",
  alternates: {
    canonical: "/blog/react-native-stack-2026",
  },
}

export default function ReactNativeStackPostPage() {
  return <VariantA />
}
