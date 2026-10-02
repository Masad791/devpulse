// The source registry. Adding a source = write an adapter returning RawArticle[] and list it here.
import type { Source } from "../types";
import { devto } from "./devto";
import { hackerNews } from "./hackernews";
import { lobsters } from "./lobsters";
import { rssSource } from "./rss";

export const SOURCES: Source[] = [
  hackerNews,
  devto,
  lobsters,
  rssSource("ByteByteGo", "https://blog.bytebytego.com/feed", ["system-design"]),
  rssSource("AWS Architecture", "https://aws.amazon.com/blogs/architecture/feed/", ["system-design"]),
  rssSource("Cloudflare Blog", "https://blog.cloudflare.com/rss/", ["system-design"]),
  rssSource("Martin Fowler", "https://martinfowler.com/feed.atom", ["engineering"]),
  rssSource("Pragmatic Engineer", "https://newsletter.pragmaticengineer.com/feed", ["engineering"]),
  rssSource("GitHub Engineering", "https://github.blog/engineering/feed/", ["engineering"]),
  rssSource("InfoQ", "https://feed.infoq.com/"),
  rssSource("Hugging Face Blog", "https://huggingface.co/blog/feed.xml", ["ai"]),
  rssSource("OpenAI News", "https://openai.com/news/rss.xml", ["ai"]),
  rssSource("Kubernetes Blog", "https://kubernetes.io/feed.xml", ["devops"]),
];
