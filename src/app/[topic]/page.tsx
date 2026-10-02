import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { FeedView } from "@/components/feed-view";
import { CATEGORIES, isCategory } from "@/lib/types";

export const revalidate = 300;

// Nothing prebuilt at deploy: each topic renders on its first visit (from the already-warm feed
// cache), then is served as a cached ISR page. Prebuilding all 12 in parallel build workers made each
// worker refetch every source at once — a self-inflicted cache stampede.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  return isCategory(topic) ? { title: CATEGORIES[topic] } : {};
}

export default async function TopicPage({ params }: PageProps<"/[topic]">) {
  const { topic } = await params;
  if (topic === "all") permanentRedirect("/");
  if (!isCategory(topic)) notFound();
  return <FeedView topic={topic} page={1} />;
}
