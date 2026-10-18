import { expect, test } from "bun:test";
import { validateConfig } from "./config.ts";
import { config } from "../../marketplace.config.ts";

test("config has correct identity", () => {
  expect(config.marketplace.name).toEqual("devkit-marketplace");
  expect(config.plugin.name).toEqual("devkit");
  // Version is bumped by release-please each release; assert it is well-formed
  // semver rather than a frozen literal so this identity check survives bumps.
  expect(config.plugin.version).toMatch(/^\d+\.\d+\.\d+$/);
  expect(config.owner.email).toEqual("rahulmutt@gmail.com");
  expect(config.bootstrapSkill).toEqual("using-devkit");
  expect(config.harnesses.length).toEqual(7);
});

test("validateConfig rejects empty version", () => {
  const bad = structuredClone(config);
  bad.plugin.version = "";
  expect(() => validateConfig(bad)).toThrow("version");
});
