const { themes } = require("prism-react-renderer");

module.exports = {
  title: "Awesome React Native UI",
  tagline: "Awesome React Native UI components made by community! 🚀",
  url: "https://mrpmohiburrahman.github.io",
  baseUrl: "/awesome-react-native-ui/",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  organizationName: "mrpmohiburrahman",
  projectName: "react-native-bottom-sheet",
  favicon: "img/favicon.ico",
  themeConfig: {
    image: "img/icon.png",
    navbar: {
      title: "Awesome React Native UI",
      hideOnScroll: false,
      items: [
        {
          href: "https://github.com/mrpmohiburrahman/awesome-react-native-ui",
          position: "right",
          html: '<a class="navbar__link" href="https://github.com/mrpmohiburrahman/awesome-react-native-ui" target="_blank" rel="noopener noreferrer"><i class="fas fa-star"></i> Star Us on GitHub</a>',
        },
      ],
    },
    prism: {
      theme: themes.dracula,
    },
    footer: {
      copyright: `Copyright © ${new Date().getFullYear()} <a rel="noreferrer" href="https://www.linkedin.com/in/mrpmohiburrahman/" target="_blank">MD. MOHIBUR RAHMAN</a>. Built with Docusaurus.`,
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
          include: ["**/*.md", "**/*.mdx"],
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
        // googleAnalytics: {
        //   trackingID: "UA-193461439-1",
        //   anonymizeIP: true,
        // },
      },
    ],
  ],
  plugins: [
    [
      "posthog-docusaurus",
      {
        apiKey: "phc_7Pq4TSUWwqrOku8lgK8jfRD4TZcNsWA8eRPHE8iUPvq",
        appUrl: "https://us.i.posthog.com",
        enableInDevelopment: false,
        onPostHogReady: () => {
          console.log("PostHog is ready");
        },
      },
    ],
  ],
  stylesheets: [
    {
      href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css",
      type: "text/css",
    },
  ],
};
