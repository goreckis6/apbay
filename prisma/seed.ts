import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GAME_CATEGORIES = [
  "Action", "Adventure", "Arcade", "Board", "Card", "Casino", "Casual",
  "Educational", "Music", "Puzzle", "Racing", "Role Playing", "Simulation",
  "Sports", "Strategy", "Trivia", "Word",
];

const APP_CATEGORIES = [
  "Art & Design", "Auto & Vehicles", "Books & Reference", "Business",
  "Communication", "Education", "Entertainment", "Finance",
  "Health & Fitness", "Lifestyle", "Music & Audio", "News & Magazines",
  "Photography", "Productivity", "Social", "Tools", "Video Players",
];

async function main() {
  // Create game categories
  for (const name of GAME_CATEGORIES) {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, type: "game" },
    });
  }

  // Create app categories
  for (const name of APP_CATEGORIES) {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, type: "app" },
    });
  }

  const action = await prisma.category.findUnique({ where: { slug: "action" } });
  const arcade = await prisma.category.findUnique({ where: { slug: "arcade" } });
  const social = await prisma.category.findUnique({ where: { slug: "social" } });
  const communication = await prisma.category.findUnique({ where: { slug: "communication" } });
  const productivity = await prisma.category.findUnique({ where: { slug: "productivity" } });

  // Create sample games
  await prisma.entry.upsert({
    where: { slug: "call-of-duty-mobile-season-6" },
    update: { bannerImage: "/images/banners/cod-banner.svg", iconImage: "/images/icons/cod-icon.svg" },
    create: {
      slug: "call-of-duty-mobile-season-6",
      title: "Call of Duty Mobile",
      type: "game",
      tagline: "Season 6 is out now! Survive and Dominate in Multiplayer FPS",
      publisher: "Activision Publishing, Inc.",
      size: "3GB",
      version: "1.0.45",
      modInfo: "Aim Bot, No recoil",
      bannerImage: "/images/banners/cod-banner.svg",
      iconImage: "/images/icons/cod-icon.svg",
      categoryId: action!.id,
      publishedAt: new Date("2024-09-09"),
      content: "Play this fun first-person shooter and explore popular Multiplayer modes.",
    },
  });

  await prisma.entry.upsert({
    where: { slug: "plants-vs-zombies" },
    update: { bannerImage: "/images/banners/pvz-banner.svg", iconImage: "/images/icons/pvz-icon.svg" },
    create: {
      slug: "plants-vs-zombies",
      title: "Plants vs. Zombies™",
      type: "game",
      tagline: "Unlimited All - Defend your lawn",
      publisher: "Electronic Arts",
      size: "127MB",
      version: "3.6.0",
      modInfo: "Unlimited All",
      bannerImage: "/images/banners/pvz-banner.svg",
      iconImage: "/images/icons/pvz-icon.svg",
      categoryId: arcade!.id,
      publishedAt: new Date(),
      content: "PopCap's classic tower defense game.",
    },
  });

  // Create sample apps for Essential Apps section
  await prisma.entry.upsert({
    where: { slug: "tiktok-mod" },
    update: { description: "Modified TikTok with premium features. No watermark, all regions unlocked.", modFeatures: "No Watermark\nAll-Region Unlocked\n18+", downloadNotes: "Please read our MOD Info and installation instructions carefully for the app to work properly." },
    create: {
      slug: "tiktok-mod",
      title: "TikTok",
      type: "app",
      description: "Modified TikTok with premium features. No watermark, all regions unlocked.",
      tagline: "No Watermark/All-Region Unlocked",
      modFeatures: "No Watermark\nAll-Region Unlocked\n18+",
      downloadNotes: "Please read our MOD Info and installation instructions carefully for the app to work properly.",
      publisher: "ByteDance",
      size: "270MB",
      version: "43.9.1",
      modInfo: "No Watermark/All-Region Unlocked, 18+",
      iconImage: "/images/icons/cod-icon.svg",
      categoryId: social!.id,
      publishedAt: new Date(),
      content: "Modified TikTok with premium features.",
    },
  });

  await prisma.entry.upsert({
    where: { slug: "truecaller-mod" },
    update: {},
    create: {
      slug: "truecaller-mod",
      title: "Truecaller: Caller ID & Block",
      type: "app",
      tagline: "Premium Unlocked",
      publisher: "Truecaller",
      size: "126MB",
      version: "26.5.8",
      modInfo: "Premium Unlocked",
      iconImage: "/images/icons/pvz-icon.svg",
      categoryId: communication!.id,
      publishedAt: new Date(),
      content: "Caller ID with premium features unlocked.",
    },
  });

  await prisma.entry.upsert({
    where: { slug: "spotify-mod" },
    update: {},
    create: {
      slug: "spotify-mod",
      title: "Spotify Music",
      type: "app",
      description: "Spotify with premium features unlocked. Amoled theme support.",
      tagline: "Premium Features Unlocked",
      modFeatures: "Premium Unlocked\nAmoled Theme\nBackground Play",
      publisher: "Spotify",
      size: "166MB",
      version: "9.1.20.1452",
      modInfo: "Premium Features Unlocked/Amoled",
      iconImage: "/images/icons/cod-icon.svg",
      categoryId: communication!.id,
      publishedAt: new Date(),
      content: "Spotify with premium unlocked.",
    },
  });

  // Instabridge - full MODYOLO subpage example
  await prisma.entry.upsert({
    where: { slug: "instabridge" },
    update: {
      heroTitle: "FREE WIFI",
      heroSubtitle: "DATA SAVER BROWSER • SECURE VPN",
      description: "Instabridge is an application that can help users connect to free WiFi anywhere quickly. Users will receive exceptional support from a database of up to 20 million passwords and points provided by other users.",
      downloadUrl: "https://modyolo.com/download/instabridge-244199/1",
      modFeatures: "Force Update Disabled\nDisabled Login Interface\nMaps Fixed\nVPN Unlocked\nPremium Unlocked",
      downloadNotes: "Downloading via 3rd party software like IDM, ADM (Direct link) is currently blocked for abuse reasons.\nPlease read our MOD Info and installation instructions carefully for the game & app to work properly.",
    },
    create: {
      slug: "instabridge",
      title: "Instabridge v22.2026.02.09.1953 MOD APK (Premium Unlocked)",
      type: "app",
      description: "Instabridge is an application that can help users connect to free WiFi anywhere quickly. Users will receive exceptional support from a database of up to 20 million passwords and points provided by other users.",
      publisher: "Degoo Backup AB - Cloud",
      size: "115M",
      version: "22.2026.02.09.1953",
      modInfo: "Premium Unlocked",
      heroTitle: "FREE WIFI",
      heroSubtitle: "DATA SAVER BROWSER • SECURE VPN",
      downloadUrl: "https://modyolo.com/download/instabridge-244199/1",
      modFeatures: "Force Update Disabled\nDisabled Login Interface\nMaps Fixed\nVPN Unlocked\nPremium Unlocked",
      downloadNotes: "Downloading via 3rd party software like IDM, ADM (Direct link) is currently blocked for abuse reasons.\nPlease read our MOD Info and installation instructions carefully for the game & app to work properly.",
      iconImage: "/images/icons/cod-icon.svg",
      categoryId: productivity!.id,
      publishedAt: new Date(),
      content: "Instabridge is an application that helps people access any Wi-Fi or hotspot in the surrounding area quickly and conveniently with just a few simple steps. Thanks to it, the search for free Wi-Fi will be completed instantly.\n\nThe app's overview interface is designed to be simple for speed and to keep you instantly connected when accessing the app without needing to access other features.",
    },
  });

  // Create sample articles
  await prisma.article.upsert({
    where: { slug: "what-are-mods" },
    update: {},
    create: {
      slug: "what-are-mods",
      title: "What are Mod? Things to know about modified games & apps",
      excerpt: "Learn everything about mods and modified applications.",
      type: "article",
      publishedAt: new Date(),
    },
  });

  await prisma.article.upsert({
    where: { slug: "just-cause-mobile" },
    update: {},
    create: {
      slug: "just-cause-mobile",
      title: "Just Cause: Mobile is now available in certain regions",
      excerpt: "The popular action game is now on mobile.",
      type: "news",
      publishedAt: new Date(),
    },
  });

  await prisma.article.upsert({
    where: { slug: "top-10-football-games" },
    update: {},
    create: {
      slug: "top-10-football-games",
      title: "TOP 10 football games to play in FIFA World Cup 2022",
      excerpt: "Best football games for mobile.",
      type: "news",
      publishedAt: new Date(),
    },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
