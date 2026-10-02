import { FeedView } from "@/components/feed-view";

// ISR: static HTML served from the CDN, rebuilt in the background at most every 5 min.
export const revalidate = 300;

export default function Home() {
  return <FeedView page={1} />;
}
