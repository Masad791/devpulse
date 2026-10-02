// The source registry. Adding a source = write an adapter returning RawArticle[] and list it here.
// Most are RSS/Atom feeds: one line each — [name, feed url, topics every post belongs to].
import type { Category, Source } from "../types";
import { devto } from "./devto";
import { hackerNews } from "./hackernews";
import { lobsters } from "./lobsters";
import { hfPapers } from "./papers";
import { rssSource } from "./rss";

const FEEDS: [string, string, Category[]?][] = [
  // AI
  ["Hugging Face Blog", "https://huggingface.co/blog/feed.xml", ["ai"]],
  ["OpenAI News", "https://openai.com/news/rss.xml", ["ai"]],
  ["Simon Willison", "https://simonwillison.net/atom/entries/", ["ai"]],
  // System design & company engineering blogs
  ["ByteByteGo", "https://blog.bytebytego.com/feed", ["system-design"]],
  ["AWS Architecture", "https://aws.amazon.com/blogs/architecture/feed/", ["system-design", "cloud"]],
  ["Cloudflare Blog", "https://blog.cloudflare.com/rss/", ["system-design"]],
  ["Netflix Tech Blog", "https://netflixtechblog.com/feed", ["system-design"]],
  ["Meta Engineering", "https://engineering.fb.com/feed/", ["system-design"]],
  ["Stripe Blog", "https://stripe.com/blog/feed.rss"],
  ["Discord Blog", "https://discord.com/blog/rss.xml"],
  ["Dropbox Tech", "https://dropbox.tech/feed", ["system-design"]],
  ["Pinterest Engineering", "https://medium.com/feed/pinterest-engineering", ["system-design"]],
  ["Airbnb Engineering", "https://medium.com/feed/airbnb-engineering", ["system-design"]],
  ["Shopify Engineering", "https://shopify.engineering/blog.atom", ["system-design"]],
  ["Slack Engineering", "https://slack.engineering/feed/", ["system-design"]],
  ["Murat Demirbas", "https://muratbuffalo.blogspot.com/feeds/posts/default", ["system-design"]],
  ["InfoQ", "https://feed.infoq.com/"],
  // DevOps & cloud
  ["Kubernetes Blog", "https://kubernetes.io/feed.xml", ["devops"]],
  ["CNCF", "https://www.cncf.io/feed/", ["devops", "cloud"]],
  ["Docker Blog", "https://www.docker.com/blog/feed/", ["devops"]],
  ["HashiCorp", "https://www.hashicorp.com/blog/feed.xml", ["devops", "cloud"]],
  ["AWS News", "https://aws.amazon.com/blogs/aws/feed/", ["cloud"]],
  ["Google Cloud", "https://cloudblog.withgoogle.com/rss/", ["cloud"]],
  // Web
  ["Chrome for Developers", "https://developer.chrome.com/static/blog/feed.xml", ["web"]],
  ["web.dev", "https://web.dev/static/blog/feed.xml", ["web"]],
  ["Node.js Blog", "https://nodejs.org/en/feed/blog.xml", ["web"]],
  ["React Blog", "https://react.dev/rss.xml", ["web"]],
  ["Josh W. Comeau", "https://www.joshwcomeau.com/rss.xml", ["web"]],
  // Security
  ["Krebs on Security", "https://krebsonsecurity.com/feed/", ["security"]],
  ["The Hacker News", "https://feeds.feedburner.com/TheHackersNews", ["security"]],
  ["Troy Hunt", "https://www.troyhunt.com/rss/", ["security"]],
  ["Schneier on Security", "https://www.schneier.com/feed/atom/", ["security"]],
  // Data
  ["Planet PostgreSQL", "https://planet.postgresql.org/rss20.xml", ["data"]],
  ["DuckDB", "https://duckdb.org/feed.xml", ["data"]],
  // Languages
  ["Rust Blog", "https://blog.rust-lang.org/feed.xml", ["languages"]],
  ["Go Blog", "https://go.dev/blog/feed.atom", ["languages"]],
  ["Python Insider", "https://blog.python.org/feeds/posts/default", ["languages"]],
  ["TypeScript Blog", "https://devblogs.microsoft.com/typescript/feed/", ["languages", "web"]],
  ["Kotlin Blog", "https://blog.jetbrains.com/kotlin/feed/", ["languages"]],
  // Mobile
  ["Android Developers", "https://android-developers.googleblog.com/atom.xml", ["mobile"]],
  ["Flutter", "https://medium.com/feed/flutter", ["mobile"]],
  // Open source
  ["GitHub Open Source", "https://github.blog/open-source/feed/", ["open-source"]],
  ["LWN.net", "https://lwn.net/headlines/rss", ["open-source"]],
  // Career & engineering practice
  ["Pragmatic Engineer", "https://newsletter.pragmaticengineer.com/feed", ["career"]],
  ["Charity Majors", "https://charity.wtf/feed/", ["career"]],
  ["Will Larson", "https://lethain.com/feeds/", ["career"]],
  ["Kent Beck", "https://tidyfirst.substack.com/feed", ["engineering"]],
  ["Martin Fowler", "https://martinfowler.com/feed.atom", ["engineering"]],
  ["GitHub Engineering", "https://github.blog/engineering/feed/", ["engineering"]],
  ["Julia Evans", "https://jvns.ca/atom.xml", ["engineering"]],
];

export const SOURCES: Source[] = [
  hackerNews,
  devto,
  lobsters,
  hfPapers,
  ...FEEDS.map(([name, url, categories]) => rssSource(name, url, categories)),
];
