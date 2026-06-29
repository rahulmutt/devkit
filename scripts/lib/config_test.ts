import { assertEquals, assertMatch, assertThrows } from "@std/assert";
import { validateConfig } from "./config.ts";
import { config } from "../../marketplace.config.ts";

Deno.test("config has correct identity", () => {
  assertEquals(config.marketplace.name, "devkit-marketplace");
  assertEquals(config.plugin.name, "devkit");
  // Version is bumped by release-please each release; assert it is well-formed
  // semver rather than a frozen literal so this identity check survives bumps.
  assertMatch(config.plugin.version, /^\d+\.\d+\.\d+$/);
  assertEquals(config.owner.email, "rahulmutt@gmail.com");
  assertEquals(config.bootstrapSkill, "using-devkit");
  assertEquals(config.harnesses.length, 7);
});

Deno.test("validateConfig rejects empty version", () => {
  const bad = structuredClone(config);
  bad.plugin.version = "";
  assertThrows(() => validateConfig(bad), Error, "version");
});
