export type PreviewCandidate = {
  caption: string
  contributor: string
  category: string
  source: string
  expo: string
  video?: string
  poster?: string
  note?: string
  skipped?: boolean
}

export const previewCandidates: PreviewCandidate[] = [
  {
    caption: "WebGPU 3D model product viewer",
    contributor: "Hewad Mubariz",
    category: "Misc",
    source:
      "https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/FurnitureShowcaseScreen.tsx",
    expo: "https://expo.dev/demos/hewad-mubariz",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/0b8f8011-6231-4dfb-8b18-8b48dfe5bfcf/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/0b8f8011-6231-4dfb-8b18-8b48dfe5bfcf/thumbnail.jpg",
  },
  {
    caption: "WebGPU bank card shimmer",
    contributor: "Hewad Mubariz",
    category: "Misc",
    source:
      "https://github.com/hewad-mubariz/react-native-motion-lab/tree/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/CardFlipScreen",
    expo: "https://expo.dev/demos/hewad-mubariz",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/e42dd6f8-56d7-4e15-b7ea-22d8e7a7f825/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/e42dd6f8-56d7-4e15-b7ea-22d8e7a7f825/thumbnail.jpg",
  },
  {
    caption: "WebGPU bird flock murmuration",
    contributor: "Hewad Mubariz",
    category: "Misc",
    source:
      "https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/BirdsScreen.tsx",
    expo: "https://expo.dev/demos/hewad-mubariz",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/0e1b0533-74a4-415f-895b-784b420cb13e/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/0e1b0533-74a4-415f-895b-784b420cb13e/thumbnail.jpg",
  },
  {
    caption: "Art gallery corridor",
    contributor: "Hewad Mubariz",
    category: "Misc",
    source:
      "https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/GalleryScreen.tsx",
    expo: "https://expo.dev/demos/hewad-mubariz",
    video:
      "https://video.twimg.com/amplify_video/2054877857155837953/vid/avc1/1156x2160/l1VkVbMInEwk4--X.mp4?tag=27",
  },
  {
    caption: "Salon / cinema seat selection",
    contributor: "Hewad Mubariz",
    category: "Misc",
    source:
      "https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/SalonSelectionScreen.tsx",
    expo: "https://expo.dev/demos/hewad-mubariz",
    video:
      "https://video.twimg.com/amplify_video/2079537243681628160/vid/avc1/1164x2160/wU-h1gVmlArYcSVB.mp4?tag=29",
  },
  {
    caption: "Football stadium seat selection",
    contributor: "Hewad Mubariz",
    category: "Misc",
    source:
      "https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/StadiumSelectionScreen.tsx",
    expo: "https://expo.dev/demos/hewad-mubariz",
    video:
      "https://video.twimg.com/amplify_video/2082027227449901056/vid/avc1/1620x2160/kBG8tWQoc6kh26HM.mp4?tag=29",
  },
  {
    caption: "Pixel explosion / Tiger reform",
    contributor: "Hewad Mubariz",
    category: "Misc",
    source:
      "https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/PixelExplosionScreen.tsx",
    expo: "https://expo.dev/demos/hewad-mubariz",
    video:
      "https://video.twimg.com/amplify_video/2061437286139531265/vid/avc1/1180x2160/oQS1Tk2zSfNv9mGb.mp4?tag=27",
  },
  {
    caption: "Bar chart / Voxel city morph",
    contributor: "Hewad Mubariz",
    category: "Charts",
    source:
      "https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/charts/BarChartScreen.tsx",
    expo: "https://expo.dev/demos/hewad-mubariz",
    video:
      "https://video.twimg.com/amplify_video/2077385917233283072/vid/avc1/1164x2160/GwP3WFoEyWm21pyL.mp4?tag=28",
  },
  {
    caption: "Linear Sensors",
    contributor: "Enzo Manuel Mangano",
    category: "Parallaxes",
    source:
      "https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/linear-sensors",
    expo: "https://expo.dev/demos/enzo-manuel-mangano",
    video:
      "https://pub-4f02f6295cfb4d38ad95eef187b3610d.r2.dev/demos/videos/linear-sensors.mp4",
    poster:
      "https://pub-4f02f6295cfb4d38ad95eef187b3610d.r2.dev/demos/thumbnails/linear-sensors.webp",
  },
  {
    caption: "Sculptures in Words",
    contributor: "Enzo Manuel Mangano",
    category: "Misc",
    source:
      "https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/sculptures-in-words",
    expo: "https://expo.dev/demos/enzo-manuel-mangano",
    video:
      "https://pub-4f02f6295cfb4d38ad95eef187b3610d.r2.dev/demos/videos/sculptures-in-words.mp4",
    poster:
      "https://pub-4f02f6295cfb4d38ad95eef187b3610d.r2.dev/demos/thumbnails/sculptures-in-words.webp",
  },
  {
    caption: "3D card scrolling",
    contributor: "Solarin Johnson",
    category: "Misc",
    source:
      "https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/3d-card-scrolling",
    expo: "https://expo.dev/demos/solarin-johnson",
    video:
      "https://video.twimg.com/amplify_video/1999477335158861827/vid/avc1/1080x1080/1pEoE6AvC52WCBv5.mp4?tag=21",
  },
  {
    caption: "Custom back-history menu",
    contributor: "Solarin Johnson",
    category: "Misc",
    source:
      "https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/custom-back",
    expo: "https://expo.dev/demos/solarin-johnson",
    video:
      "https://video.twimg.com/amplify_video/2023070683274608641/vid/avc1/1080x1080/O_oTVQpPCstGu0TB.mp4?tag=21",
  },
  {
    caption: "Emoji pop",
    contributor: "Solarin Johnson",
    category: "Misc",
    source:
      "https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/emoji-pop",
    expo: "https://expo.dev/demos/solarin-johnson",
    video:
      "https://video.twimg.com/amplify_video/2045846594629861377/vid/avc1/1080x1080/n82i8Y17qzrqB_yS.mp4?tag=21",
  },
  {
    caption: "Gesture speed and lock control",
    contributor: "Solarin Johnson",
    category: "Misc",
    source:
      "https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/gesture-speed",
    expo: "https://expo.dev/demos/solarin-johnson",
    video:
      "https://video.twimg.com/amplify_video/2042945959257133056/vid/avc1/1080x1080/ZYiAQ77qNvRQbOJX.mp4?tag=21",
  },
  {
    caption: "Grok sidebar",
    contributor: "Solarin Johnson",
    category: "Misc",
    source:
      "https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/grok-sidebar",
    expo: "https://expo.dev/demos/solarin-johnson",
    video:
      "https://video.twimg.com/amplify_video/1951639148491673600/vid/avc1/720x720/mxAmk01zwkNUr4Fb.mp4?tag=14",
  },
  {
    caption: "Custom status bar and drawing canvas",
    contributor: "Solarin Johnson",
    category: "Misc",
    source:
      "https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/status-bar",
    expo: "https://expo.dev/demos/solarin-johnson",
    video:
      "https://video.twimg.com/amplify_video/2082445195249864705/vid/avc1/2160x2160/ktq6TR0iEetLwsHC.mp4?tag=29",
  },
  {
    caption: "Twitter-style collapsing profile",
    contributor: "Solarin Johnson",
    category: "Headers",
    source:
      "https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/twitter-profile",
    expo: "https://expo.dev/demos/solarin-johnson",
    video:
      "https://video.twimg.com/amplify_video/1943774315712774144/vid/avc1/720x720/Gnjearn6z-ObUcN2.mp4?tag=14",
  },
  {
    caption: "Untitled project and pull-down audio recorder",
    contributor: "Solarin Johnson",
    category: "Misc",
    source:
      "https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/untitled",
    expo: "https://expo.dev/demos/solarin-johnson",
    video:
      "https://video.twimg.com/amplify_video/2028839127723192320/vid/avc1/1080x1080/MbrZa3feoRjs7VRI.mp4?tag=21",
    note: "The pinned build crashes on this route. The maintainer skipped it.",
    skipped: true,
  },
  {
    caption: "iOS liquid-glass curved bottom tabs",
    contributor: "Rit3zh",
    category: "Tab bars",
    source:
      "https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/curved-tabs.tsx",
    expo: "https://expo.dev/demos/rit3zh",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/14691b73-1f3a-4956-ac52-7f01a65a53ba/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/14691b73-1f3a-4956-ac52-7f01a65a53ba/thumbnail.jpg",
  },
  {
    caption: "iOS motion bottom tabs popovers",
    contributor: "Rit3zh",
    category: "Tab bars",
    source:
      "https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/animated-tab-bar.tsx",
    expo: "https://expo.dev/demos/rit3zh",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/fbff8a84-fa44-4d53-8bbe-02be24be3b67/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/fbff8a84-fa44-4d53-8bbe-02be24be3b67/thumbnail.jpg",
  },
  {
    caption: "Stacked bottom sheets",
    contributor: "Rit3zh",
    category: "Bottom Sheets",
    source:
      "https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/components/BottomSheet.tsx",
    expo: "https://expo.dev/demos/rit3zh",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/d6b6df57-27f7-4365-a218-8c9772ddb399/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/d6b6df57-27f7-4365-a218-8c9772ddb399/thumbnail.jpg",
  },
  {
    caption: "Telegram-style avatar dynamic island scroll-collapse",
    contributor: "Rit3zh",
    category: "Headers",
    source:
      "https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/app/profile.tsx",
    expo: "https://expo.dev/demos/rit3zh",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/3fc151a9-f25b-4fa1-a521-5a808e0547ef/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/3fc151a9-f25b-4fa1-a521-5a808e0547ef/thumbnail.jpg",
  },
  {
    caption: "Native paste inputs",
    contributor: "Arunabh Verma",
    category: "Misc",
    source:
      "https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/example/App.tsx",
    expo: "https://expo.dev/demos/arunabh-verma",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/4be96a3b-2899-4e56-a20c-df7defc5e401/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/4be96a3b-2899-4e56-a20c-df7defc5e401/thumbnail.jpg",
  },
  {
    caption: "Linear Tab Bar",
    contributor: "Nathan Schroeder",
    category: "Tab bars",
    source:
      "https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/src/components/TabBar/index.tsx",
    expo: "https://expo.dev/demos/nathan-schroeder",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/8e8721f1-a068-48e3-b546-e9be764c81da/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/8e8721f1-a068-48e3-b546-e9be764c81da/thumbnail.jpg",
  },
  {
    caption: "Folio pop-up storybook",
    contributor: "Paul Nguyen",
    category: "Misc",
    source:
      "https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/ui/Stage.tsx",
    expo: "https://expo.dev/demos/paul-nguyen",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/98338995-af29-44b9-ada4-fecaa9542cb2/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/98338995-af29-44b9-ada4-fecaa9542cb2/thumbnail.jpg",
  },
  {
    caption: "Newspaper swipe fold",
    contributor: "Pablo Giraud-Carrier",
    category: "Misc",
    source:
      "https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/CrinkleOverlay.tsx",
    expo: "https://expo.dev/demos/pablo-giraud-carrier",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/288720dc-e506-4277-b45e-9527244108cd/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/288720dc-e506-4277-b45e-9527244108cd/thumbnail.jpg",
    note: "One Expo card covers the three newspaper effects.",
  },
  {
    caption: "Newspaper edge stretch and crumple",
    contributor: "Pablo Giraud-Carrier",
    category: "Misc",
    source:
      "https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/OverscrollOverlay.tsx",
    expo: "https://expo.dev/demos/pablo-giraud-carrier",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/288720dc-e506-4277-b45e-9527244108cd/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/288720dc-e506-4277-b45e-9527244108cd/thumbnail.jpg",
    note: "One Expo card covers the three newspaper effects.",
  },
  {
    caption: "Corner tear, paper ball, and basket throw",
    contributor: "Pablo Giraud-Carrier",
    category: "Misc",
    source:
      "https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/CrumpleOverlay.tsx",
    expo: "https://expo.dev/demos/pablo-giraud-carrier",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/288720dc-e506-4277-b45e-9527244108cd/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/288720dc-e506-4277-b45e-9527244108cd/thumbnail.jpg",
    note: "One Expo card covers the three newspaper effects.",
  },
  {
    caption: "Settings form",
    contributor: "Tomek Czajecki",
    category: "Misc",
    source:
      "https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/settings.tsx",
    expo: "https://expo.dev/demos/tomek-czajecki",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/thumbnail.jpg",
    note: "One Expo card covers the seven iOS patterns.",
  },
  {
    caption: "Personal Hotspot form",
    contributor: "Tomek Czajecki",
    category: "Misc",
    source:
      "https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/personal-hotspot.tsx",
    expo: "https://expo.dev/demos/tomek-czajecki",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/thumbnail.jpg",
    note: "One Expo card covers the seven iOS patterns.",
  },
  {
    caption: "Health Summary and native tabs",
    contributor: "Tomek Czajecki",
    category: "Misc",
    source:
      "https://github.com/tchayen/ios-in-expo/tree/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/health",
    expo: "https://expo.dev/demos/tomek-czajecki",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/thumbnail.jpg",
    note: "One Expo card covers the seven iOS patterns.",
  },
  {
    caption: "TestFlight onboarding modal",
    contributor: "Tomek Czajecki",
    category: "Onboarding",
    source:
      "https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/tf-onboarding.tsx",
    expo: "https://expo.dev/demos/tomek-czajecki",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/thumbnail.jpg",
    note: "One Expo card covers the seven iOS patterns.",
  },
  {
    caption: "New Event form sheet",
    contributor: "Tomek Czajecki",
    category: "Bottom Sheets",
    source:
      "https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/new-event.tsx",
    expo: "https://expo.dev/demos/tomek-czajecki",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/thumbnail.jpg",
    note: "One Expo card covers the seven iOS patterns.",
  },
  {
    caption: "Sign-in modal",
    contributor: "Tomek Czajecki",
    category: "Onboarding",
    source:
      "https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/sign-in.tsx",
    expo: "https://expo.dev/demos/tomek-czajecki",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/thumbnail.jpg",
    note: "One Expo card covers the seven iOS patterns.",
  },
  {
    caption: "View Options form sheet",
    contributor: "Tomek Czajecki",
    category: "Bottom Sheets",
    source:
      "https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/view-options.tsx",
    expo: "https://expo.dev/demos/tomek-czajecki",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/b47ccf2e-27e7-4d3e-ae1a-f12bd0849c33/thumbnail.jpg",
    note: "One Expo card covers the seven iOS patterns.",
  },
  {
    caption: "Bottom Tab Accessory",
    contributor: "Phil Pluckthun",
    category: "Tab bars",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bottom-accessory/src/app/(tabs)/_layout.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/8658b383-f5d6-4e28-b139-9a84820e5655/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/8658b383-f5d6-4e28-b139-9a84820e5655/thumbnail.jpg",
  },
  {
    caption: "Material colors and Jetpack Compose UI",
    contributor: "Phil Pluckthun",
    category: "Misc",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/compose-colors/src/app/index.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/0135bea7-8bbf-45d5-a1c1-f9ff7dc8fb43/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/0135bea7-8bbf-45d5-a1c1-f9ff7dc8fb43/thumbnail.jpg",
  },
  {
    caption: "Android form sheet footer",
    contributor: "Phil Pluckthun",
    category: "Bottom Sheets",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/formsheet-footer/src/app/_layout.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/d8c72fe9-c374-47df-83b5-bd223e4be14f/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/d8c72fe9-c374-47df-83b5-bd223e4be14f/thumbnail.jpg",
  },
  {
    caption: "iOS Live Activity",
    contributor: "Phil Pluckthun",
    category: "Misc",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/live-activity/src/live-activity.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/03eed4c3-6930-42cd-b8ae-12bcf0b324e1/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/03eed4c3-6930-42cd-b8ae-12bcf0b324e1/thumbnail.jpg",
  },
  {
    caption: "Sharing Intent",
    contributor: "Phil Pluckthun",
    category: "Misc",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/sharing-intent/src/app/+native-intent.ts",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/1d82762f-ddf7-404a-bdcb-1c1db519d06c/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/1d82762f-ddf7-404a-bdcb-1c1db519d06c/thumbnail.jpg",
  },
  {
    caption: "Expo Router 55 Stack API",
    contributor: "Phil Pluckthun",
    category: "Headers",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/stack-api/src/app/index.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/e30b865a-b1ea-4da1-ab58-402f83e30cd7/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/e30b865a-b1ea-4da1-ab58-402f83e30cd7/thumbnail.jpg",
  },
  {
    caption: "SwiftUI settings page",
    contributor: "Phil Pluckthun",
    category: "Pickers",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/swift-ui/src/app/index.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/cc85314a-2bfe-42ab-9b21-eb239f80a1cd/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/cc85314a-2bfe-42ab-9b21-eb239f80a1cd/thumbnail.jpg",
  },
  {
    caption: "Android Material tabs and colors",
    contributor: "Phil Pluckthun",
    category: "Tab bars",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/tabs-colors/src/app/_layout.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/4a37fdb8-8db6-4e46-9f09-616605eb3dbf/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/4a37fdb8-8db6-4e46-9f09-616605eb3dbf/thumbnail.jpg",
  },
  {
    caption: "Expo Router 55 Toolbar APIs",
    contributor: "Phil Pluckthun",
    category: "Headers",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/toolbars/src/app/index.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/f4f2e88c-3608-4369-beaa-d7a10c25f018/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/f4f2e88c-3608-4369-beaa-d7a10c25f018/thumbnail.jpg",
  },
  {
    caption: "iOS Lockscreen Widget",
    contributor: "Phil Pluckthun",
    category: "Misc",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/widget/src/delivery-widget.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/686009e4-9557-4c82-bfd7-f2b7ce12e299/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/686009e4-9557-4c82-bfd7-f2b7ce12e299/thumbnail.jpg",
  },
  {
    caption: "Expo Router 55 iOS Zoom Transitions",
    contributor: "Phil Pluckthun",
    category: "Misc",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/zoom-transitions/src/components/photo-cell.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
    video:
      "https://vz-5e32a7cb-1ab.b-cdn.net/71405229-2127-4fdd-ab22-0251b63e4138/play_720p.mp4",
    poster:
      "https://vz-5e32a7cb-1ab.b-cdn.net/71405229-2127-4fdd-ab22-0251b63e4138/thumbnail.jpg",
  },
  {
    caption: "Age-range request",
    contributor: "Phil Pluckthun",
    category: "Misc",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/age-range/src/app/index.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
  },
  {
    caption: "Bonjour handwriting and shimmer",
    contributor: "Phil Pluckthun",
    category: "Misc",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bonjour/src/app/index.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
  },
  {
    caption: "Split-view mail navigation",
    contributor: "Phil Pluckthun",
    category: "Misc",
    source:
      "https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/split-view/src/app/_layout.tsx",
    expo: "https://expo.dev/demos/phil-pluckthun",
  },
]
