import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseRepoPath, ReposView } from "@/components/repos-view";
import { REPO_CATEGORIES } from "@/lib/sources/github";

export const revalidate = 3600;

// Nothing prebuilt: each filter combination renders on its first visit, then is cached for an hour.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/repos/[...filters]">): Promise<Metadata> {
  const filters = parseRepoPath((await params).filters);
  return filters ? { title: `${REPO_CATEGORIES[filters.category].label} — trending repos` } : {};
}

export default async function FilteredReposPage({ params }: PageProps<"/repos/[...filters]">) {
  const filters = parseRepoPath((await params).filters);
  if (!filters) notFound();
  return <ReposView {...filters} />;
}
