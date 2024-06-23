const { themes } = require("prism-react-renderer");

module.exports = {
  title: "Awesome React Native UI",
  tagline: "Awesome React Native UI components made by community! 🚀",
  url: "https://mrpmohiburrahman.github.io",
  baseUrl: "/awesome-react-native-ui/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  organizationName: "mrpmohiburrahman",
  projectName: "react-native-bottom-sheet",
  favicon: "img/favicon.ico",
  onBrokenLinks: "warn",
  themeConfig: {
    image: "img/icon.png",
    navbar: {
      title: "Awesome React Native UI",
      hideOnScroll: false,
      items: [
        // {
        //   to: "modal",
        //   activeBasePath: "modal",
        //   label: "Bottom Sheet Modal",
        //   position: "left",
        // },
        // { to: "blog", label: "Blog", position: "left" },
        // { to: "sponsors", label: "Sponsors", position: "right" },
        {
          href: "https://github.com/mrpmohiburrahman/awesome-react-native-ui",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    prism: {
      theme: themes.dracula,
    },
    footer: {
      copyright: `Copyright © ${new Date().getFullYear()} <a rel="noreferrer" href="https://gorhom.dev/" target="_blank">MD. MOHIBUR RAHMAN</a>. Built with Docusaurus.`,
    },
    algolia: {
      appId: "V136OEODKA",
      apiKey: "184c49269442932465c46fe5489b63e6",
      indexName: "react-native-bottom-sheet",
      contextualSearch: true,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          routeBasePath: "/",
          path: "docs",
          editUrl:
            "https://github.com/gorhom/react-native-bottom-sheet/edit/website/",
          // lastVersion: "current",
          include: ["**/*.md", "**/*.mdx"],
        },
        // blog: {
        //   path: "blog",
        //   routeBasePath: "/blog",
        //   showReadingTime: false,
        //   blogSidebarCount: "ALL",
        //   editUrl:
        //     "https://github.com/gorhom/react-native-bottom-sheet/edit/website/website/blog/",
        // },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
        googleAnalytics: {
          trackingID: "UA-193461439-1",
          anonymizeIP: true,
        },
      },
    ],
  ],
};
