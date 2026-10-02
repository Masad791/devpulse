import { describe, expect, it } from "vitest";
import { issueQuery, type IssueFilters } from "./github";

const base: IssueFilters = { label: "good-first-issue", unassigned: true, sort: "updated", page: 1 };

describe("issueQuery", () => {
  it("builds the GitHub search query from filters", () => {
    expect(issueQuery({ ...base, language: "TypeScript", repo: "vercel/next.js" })).toBe(
      'is:issue is:open archived:false label:"good first issue" language:"TypeScript" repo:vercel/next.js no:assignee',
    );
  });

  it("keeps user input inside its quotes (no injected qualifiers)", () => {
    const q = issueQuery({ ...base, keyword: 'docs" is:closed repo:evil/x "' });
    expect(q).toContain('"docs is:closed repo:evil/x"');
    const outsideQuotes = q.replace(/"[^"]*"/g, "");
    expect(outsideQuotes).not.toContain("is:closed");
    expect(outsideQuotes).not.toContain("evil");
  });

  it("ignores a malformed repo", () => {
    expect(issueQuery({ ...base, repo: "not a repo label:spam" })).not.toContain("repo:");
  });
});
