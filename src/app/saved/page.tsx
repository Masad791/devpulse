import type { Metadata } from "next";
import { SavedList } from "@/components/saved-list";

export const metadata: Metadata = { title: "Reading list" };

export default function SavedPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-semibold tracking-tight">Reading list</h1>
      <p className="mt-1 text-sm text-muted">Saved in this browser only. Press b on any story (or its Save button) to add it.</p>
      <SavedList />
    </main>
  );
}
