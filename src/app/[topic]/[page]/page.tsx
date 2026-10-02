import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { FeedView } from "@/components/feed-view";
import { MAX_PAGES } from "@/lib/pipeline";
import { CATEGORIES, isCategory } from "@/lib/types";

export const revalidate = 300;

// Nothing prebuilt: page N is rendered on its first visit, then cached like any ISR page.
export function generateStaticParams() {
  return [];
}

function parse(topic: string, page: string) {
  const n = Number(page);
  if (!/^\d+$/.test(page) || n < 1 || n > MAX_PAGES) notFound();
  if (topic !== "all" && !isCategory(topic)) notFound();
  if (n === 1) permanentRedirect(topic === "all" ? "/" : `/${topic}`); // one canonical URL per page
  return { topic: isCategory(topic) ? topic : undefined, page: n };
}

export async function generateMetadata({ params }: PageProps<"/[topic]/[page]">): Promise<Metadata> {
  const { topic, page } = await params;
  const label = isCategory(topic) ? CATEGORIES[topic] : "Top stories";
  return { title: `${label} · page ${page}` };
}

export default async function TopicPageN({ params }: PageProps<"/[topic]/[page]">) {
  const params_ = await params;
  const { topic, page } = parse(params_.topic, params_.page);
  return <FeedView topic={topic} page={page} />;
}
