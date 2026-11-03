import { describe, expect, it } from "vitest";
import { topSkills, type Skill } from "./skills";

const skill = (id: string, source: string, url = `https://skills.sh/${source}/${id}`): Skill => ({ id, name: id, source, installs: 1, url });

describe("topSkills", () => {
  it("stops one pack from filling the board", () => {
    const items = [skill("a", "pack"), skill("b", "pack"), skill("c", "other"), skill("d", "pack")];
    expect(topSkills(items, 30, 2).map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("drops links that are not http(s)", () => {
    expect(topSkills([skill("a", "x", "javascript:alert(1)")])).toEqual([]);
  });

  it("respects the limit", () => {
    expect(topSkills([skill("a", "x"), skill("b", "y")], 1).map((s) => s.id)).toEqual(["a"]);
  });
});
