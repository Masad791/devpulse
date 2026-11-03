import type { Metadata } from "next";
import { DiscussionsView, KINDS } from "@/components/discussions-view";

export const revalidate = 300;
export const dynamicParams = false; // only /discussions/ask and /discussions/debate exist

export function generateStaticParams() {
  return [{ kind: "ask" }, { kind: "debate" }];
}

export async function generateMetadata({ params }: PageProps<"/discussions/[kind]">): Promise<Metadata> {
  const { kind } = await params;
  return { title: `${KINDS[kind as "ask" | "debate"]} · Discussions` };
}

export default async function DiscussionsKindPage({ params }: PageProps<"/discussions/[kind]">) {
  const { kind } = await params;
  return <DiscussionsView active={kind as "ask" | "debate"} />;
}
