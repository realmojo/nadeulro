import type { MetadataRoute } from "next";

import { mainNav, siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", ...mainNav.map((n) => n.href)];
  return routes.map((route) => ({
    url: `${siteConfig.url}${route === "/" ? "" : route}`,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
