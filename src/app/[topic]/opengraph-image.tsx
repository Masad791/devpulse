import { getFeed } from "@/lib/feed";
import { OG_SIZE, ogImage } from "@/lib/og";
import { CATEGORIES, isCategory } from "@/lib/types";

export const revalidate = 900;
export const alt = "DevPulse — top stories in this topic";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return [];
}

export default async function Image({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const { articles } = await getFeed();
  return isCategory(topic)
    ? ogImage(CATEGORIES[topic], articles.filter((a) => a.categories.includes(topic)))
    : ogImage("Top stories", articles);
}
