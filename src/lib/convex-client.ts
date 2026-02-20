import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.warn("VITE_CONVEX_URL is not set. Convex features will be unavailable.");
}

const fallbackUrl = "https://kindhearted-guanaco-996.convex.cloud";
const url = convexUrl || fallbackUrl;

export const convex = new ConvexReactClient(url);
export const convexHttp = new ConvexHttpClient(url);
