import { expect, it } from "vitest";
import { cleanTag, isPrerelease } from "./releases";

it("strips branch prefixes from release titles", () => {
  expect(cleanTag("[release-branch.go1.27] go1.27.2")).toBe("go1.27.2");
  expect(cleanTag("  v16.4.0 ")).toBe("v16.4.0");
  expect(cleanTag("v0.31.1rc0: [Metrics] Expose cached prompt tokens")).toBe("v0.31.1rc0");
  expect(cleanTag("DuckDB v1.5.6 Bugfix Release")).toBe("DuckDB v1.5.6 Bugfix Release");
});

it("recognizes PEP 440 style pre-releases", () => {
  expect(isPrerelease("v0.31.1rc0")).toBe(true);
  expect(isPrerelease("2.0a1")).toBe(true);
  expect(isPrerelease("v3.13.0")).toBe(false);
  expect(isPrerelease("Release v5.19.0")).toBe(false);
});

it("tells stable releases from pre-releases", () => {
  for (const tag of ["v16.5.0-canary.7", "v1.38.0-alpha.2", "v3.6.0-rc2", "v1.17.0-rc1", "v46.0.0-nightly.20261009", "build-2.5.20-dev-435", "8.1.0-dev.9", "nightly: Release x"]) {
    expect(isPrerelease(tag), tag).toBe(true);
  }
  for (const tag of ["v16.4.0", "Rust 1.99.0", "Nvim 0.12.6", "DuckDB v1.5.6 Bugfix Release", "langchain-openai==1.7.0", "go1.27.2", "Release v5.19.0"]) {
    expect(isPrerelease(tag), tag).toBe(false);
  }
});
