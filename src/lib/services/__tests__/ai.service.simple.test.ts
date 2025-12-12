/**
 * Simplified unit tests for ai.service.ts
 *
 * Note: Full integration tests require proper environment setup.
 * These tests focus on the logic that can be tested without mocking import.meta.env
 */

import { describe, it, expect } from "vitest";
import { ALLOWED_MODELS, DEFAULT_MODEL } from "../ai.service";

describe("ai.service - Constants and Configuration", () => {
  describe("ALLOWED_MODELS", () => {
    it("should be an array of model identifiers", () => {
      expect(Array.isArray(ALLOWED_MODELS)).toBe(true);
      expect(ALLOWED_MODELS.length).toBeGreaterThan(0);
    });

    it("should contain OpenAI models", () => {
      const hasOpenAI = ALLOWED_MODELS.some((model) => model.startsWith("openai/"));
      expect(hasOpenAI).toBe(true);
    });

    it("should have model identifiers in correct format", () => {
      ALLOWED_MODELS.forEach((model) => {
        expect(model).toMatch(/^[\w.-]+\/[\w.-]+$/);
      });
    });

    it("should include gpt-4o-mini", () => {
      expect(ALLOWED_MODELS).toContain("openai/gpt-4o-mini");
    });

    it("should include gpt-4", () => {
      expect(ALLOWED_MODELS).toContain("openai/gpt-4");
    });
  });

  describe("DEFAULT_MODEL", () => {
    it("should be a string", () => {
      expect(typeof DEFAULT_MODEL).toBe("string");
    });

    it("should be in the ALLOWED_MODELS list", () => {
      expect(ALLOWED_MODELS).toContain(DEFAULT_MODEL);
    });

    it("should be gpt-4o-mini", () => {
      expect(DEFAULT_MODEL).toBe("openai/gpt-4o-mini");
    });

    it("should have correct format", () => {
      expect(DEFAULT_MODEL).toMatch(/^[\w.-]+\/[\w.-]+$/);
    });
  });
});
