// DevPulse new tab. Renders the public /api/feed (CORS is open, so no extension permissions are needed).
// Set to "http://localhost:3000" while developing against a local server.
const SITE = "https://devpulse-five-red.vercel.app";

const TOPICS = [
  ["", "Top"],
  ["ai", "AI & ML"],
  ["system-design", "System Design"],
  ["devops", "DevOps"],
  ["web", "Web"],
  ["security", "Security"],
  ["languages", "Languages"],
];

const $ = (id) => document.getElementById(id);
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "narrow" });
const ago = (iso) => {
  const h = Math.round((Date.parse(iso) - Date.now()) / 3_600_000);
  return h > -48 ? rtf.format(h, "hour") : rtf.format(Math.round(h / 24), "day");
};

// Build DOM with textContent only: never innerHTML with data from the network.
function render(articles) {
  const list = $("list");
  list.replaceChildren(
    ...articles.map((a) => {
      const li = document.createElement("li");
      const link = Object.assign(document.createElement("a"), { href: a.url, textContent: a.title });
      const meta = Object.assign(document.createElement("div"), { className: "meta" });
      const parts = [a.source, ago(a.publishedAt)];
      if (a.points) parts.push(`▲ ${a.points}`);
      if (a.comments) parts.push(`${a.comments} comments`);
      meta.textContent = parts.join(" · ");
      li.append(link, meta);
      return li;
    }),
  );
}

async function load(topic) {
  const cacheKey = `devpulse:newtab:${topic}`;
  // Show the last response instantly (a new tab must feel instant), then refresh in the background.
  const cached = localStorage.getItem(cacheKey);
  if (cached) render(JSON.parse(cached));
  $("status").textContent = cached ? "" : "Loading…";
  try {
    const query = new URLSearchParams({ limit: "25", ...(topic ? { topic } : {}) });
    const res = await fetch(`${SITE}/api/feed?${query}`);
    const { articles } = await res.json();
    localStorage.setItem(cacheKey, JSON.stringify(articles));
    render(articles);
    $("status").textContent = "";
  } catch {
    $("status").textContent = cached ? "Offline — showing the last stories." : "Couldn't reach DevPulse.";
  }
}

function selectTopic(topic) {
  localStorage.setItem("devpulse:newtab:topic", topic);
  for (const b of $("topics").children) b.setAttribute("aria-pressed", String(b.dataset.topic === topic));
  load(topic);
}

$("topics").append(
  ...TOPICS.map(([slug, label]) => {
    const b = Object.assign(document.createElement("button"), { textContent: label, type: "button" });
    b.dataset.topic = slug;
    b.addEventListener("click", () => selectTopic(slug));
    return b;
  }),
);
$("home").href = SITE;
$("search").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = new FormData(e.target).get("q");
  if (q) location.href = `${SITE}/search?${new URLSearchParams({ q })}`;
});
selectTopic(localStorage.getItem("devpulse:newtab:topic") ?? "");
