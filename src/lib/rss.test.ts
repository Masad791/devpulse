import { expect, it } from "vitest";
import { isoWeek, rssXml } from "./rss";

it("escapes untrusted text so a title can't inject XML", () => {
  const out = rssXml({
    title: "DevPulse",
    link: "https://x.dev",
    self: "https://x.dev/rss.xml",
    description: "d",
    items: [{ title: 'Evil </title><script>alert("x")</script> & co', link: "https://a.com/?a=1&b=2", guid: "g", date: "2026-10-10T00:00:00Z" }],
  });
  expect(out).toContain("<title>Evil &lt;/title&gt;&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; co</title>");
  expect(out).toContain("<link>https://a.com/?a=1&amp;b=2</link>");
  expect(out).not.toContain("<script>");
});

it("computes ISO weeks, including the year boundary", () => {
  expect(isoWeek(new Date("2026-10-10T12:00:00Z"))).toBe("2026-W41");
  expect(isoWeek(new Date("2027-01-01T00:00:00Z"))).toBe("2026-W53"); // a Friday: still 2026's last week
  expect(isoWeek(new Date("2026-01-01T00:00:00Z"))).toBe("2026-W01"); // a Thursday
});
