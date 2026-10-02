import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedPage } from "@/components/feed-page";
import { CATEGORIES, isCategory } from "@/lib/types";

export const revalidate = 900;
export const dynamicParams = false; // only the 4 known categories exist; anything else is a 404

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/[category]">): Promise<Metadata> {
  const { category } = await params;
  return isCategory(category) ? { title: CATEGORIES[category] } : {};
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  return <FeedPage category={category} />;
}
