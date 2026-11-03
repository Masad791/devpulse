import type { Metadata } from "next";
import { ReposView } from "@/components/repos-view";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Trending repos",
  description: "Trending GitHub repos by category: Claude skills, AI agents, MCP servers, self-hosted alternatives, DevOps and more.",
};

export default function ReposPage() {
  return <ReposView category="all" period="week" />;
}
