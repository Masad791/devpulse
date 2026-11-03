import type { Metadata } from "next";
import { DiscussionsView } from "@/components/discussions-view";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Discussions",
  description: "The most heated developer discussions right now: Hacker News, Ask HN, Lobsters and Dev.to.",
};

export default function DiscussionsPage() {
  return <DiscussionsView active="all" />;
}
