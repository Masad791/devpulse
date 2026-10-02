import { FeedPage } from "@/components/feed-page";

// ISR: the page is static HTML served from the CDN, rebuilt in the background at most every 15 min.
export const revalidate = 900;

export default function Home() {
  return <FeedPage />;
}
