import { getFeed } from "@/lib/feed";
import { OG_SIZE, ogImage } from "@/lib/og";

export const revalidate = 900;
export const alt = "DevPulse — today's top stories for builders";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const { articles } = await getFeed();
  return ogImage("Top stories", articles);
}
