/**
 * Unit tests for openrouter.types.ts
 * Tests error classes and their constructors
 */

import { describe, it, expect } from "vitest";
import {
  OpenRouterError,
  OpenRouterBadRequestError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterNetworkError,
  OpenRouterSchemaError,
} from "../openrouter.types";

describe("openrouter.types - Error Classes", () => {
  describe("OpenRouterError", () => {
    it("should create error with message", () => {
      const error = new OpenRouterError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("OpenRouterError");
      expect(error).toBeInstanceOf(Error);
    });

    it("should create error with message and status", () => {
      const error = new OpenRouterError("Test error", 500);
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(500);
    });

    it("should create error with message, status, and raw data", () => {
      const rawData = { detail: "Raw error data" };
      const error = new OpenRouterError("Test error", 500, rawData);
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(500);
      expect(error.raw).toEqual(rawData);
    });
  });

  describe("OpenRouterBadRequestError", () => {
    it("should create bad request error", () => {
      const error = new OpenRouterBadRequestError("Invalid request");
      expect(error.message).toBe("Invalid request");
      expect(error.name).toBe("OpenRouterBadRequestError");
      expect(error.status).toBe(400);
      expect(error).toBeInstanceOf(OpenRouterError);
    });

    it("should create bad request error with raw data", () => {
      const rawData = { errors: ["field1", "field2"] };
      const error = new OpenRouterBadRequestError("Invalid request", rawData);
      expect(error.raw).toEqual(rawData);
    });
  });

  describe("OpenRouterAuthError", () => {
    it("should create auth error", () => {
      const error = new OpenRouterAuthError("Unauthorized");
      expect(error.message).toBe("Unauthorized");
      expect(error.name).toBe("OpenRouterAuthError");
      expect(error.status).toBe(401);
      expect(error).toBeInstanceOf(OpenRouterError);
    });

    it("should create auth error with raw data", () => {
      const rawData = { reason: "Invalid API key" };
      const error = new OpenRouterAuthError("Unauthorized", rawData);
      expect(error.raw).toEqual(rawData);
    });
  });

  describe("OpenRouterRateLimitError", () => {
    it("should create rate limit error without retryAfter", () => {
      const error = new OpenRouterRateLimitError("Rate limit exceeded");
      expect(error.message).toBe("Rate limit exceeded");
      expect(error.name).toBe("OpenRouterRateLimitError");
      expect(error.status).toBe(429);
      expect(error.retryAfter).toBeUndefined();
      expect(error).toBeInstanceOf(OpenRouterError);
    });

    it("should create rate limit error with retryAfter", () => {
      const error = new OpenRouterRateLimitError("Rate limit exceeded", 60);
      expect(error.message).toBe("Rate limit exceeded");
      expect(error.retryAfter).toBe(60);
    });

    it("should create rate limit error with retryAfter and raw data", () => {
      const rawData = { limit: 100, remaining: 0 };
      const error = new OpenRouterRateLimitError("Rate limit exceeded", 60, rawData);
      expect(error.retryAfter).toBe(60);
      expect(error.raw).toEqual(rawData);
    });
  });

  describe("OpenRouterServerError", () => {
    it("should create server error", () => {
      const error = new OpenRouterServerError("Internal server error", 500);
      expect(error.message).toBe("Internal server error");
      expect(error.name).toBe("OpenRouterServerError");
      expect(error.status).toBe(500);
      expect(error).toBeInstanceOf(OpenRouterError);
    });

    it("should create server error with different status code", () => {
      const error = new OpenRouterServerError("Service unavailable", 503);
      expect(error.message).toBe("Service unavailable");
      expect(error.status).toBe(503);
    });

    it("should create server error with raw data", () => {
      const rawData = { trace_id: "abc123" };
      const error = new OpenRouterServerError("Internal server error", 500, rawData);
      expect(error.raw).toEqual(rawData);
    });
  });

  describe("OpenRouterNetworkError", () => {
    it("should create network error", () => {
      const error = new OpenRouterNetworkError("Network request failed");
      expect(error.message).toBe("Network request failed");
      expect(error.name).toBe("OpenRouterNetworkError");
      expect(error.status).toBeUndefined();
      expect(error).toBeInstanceOf(OpenRouterError);
    });

    it("should create network error with raw data", () => {
      const rawData = { code: "ECONNREFUSED" };
      const error = new OpenRouterNetworkError("Network request failed", rawData);
      expect(error.raw).toEqual(rawData);
    });
  });

  describe("OpenRouterSchemaError", () => {
    it("should create schema error", () => {
      const error = new OpenRouterSchemaError("Schema validation failed");
      expect(error.message).toBe("Schema validation failed");
      expect(error.name).toBe("OpenRouterSchemaError");
      expect(error.validationErrors).toBeUndefined();
      expect(error).toBeInstanceOf(OpenRouterError);
    });

    it("should create schema error with validation errors", () => {
      const validationErrors = [
        { field: "name", message: "Required" },
        { field: "age", message: "Must be a number" },
      ];
      const error = new OpenRouterSchemaError("Schema validation failed", validationErrors);
      expect(error.validationErrors).toEqual(validationErrors);
    });

    it("should create schema error with validation errors and raw data", () => {
      const validationErrors = [{ field: "email", message: "Invalid format" }];
      const rawData = { input: { email: "invalid" } };
      const error = new OpenRouterSchemaError("Schema validation failed", validationErrors, rawData);
      expect(error.validationErrors).toEqual(validationErrors);
      expect(error.raw).toEqual(rawData);
    });
  });

  describe("Error inheritance", () => {
    it("should maintain proper inheritance chain", () => {
      const errors = [
        new OpenRouterError("test"),
        new OpenRouterBadRequestError("test"),
        new OpenRouterAuthError("test"),
        new OpenRouterRateLimitError("test"),
        new OpenRouterServerError("test"),
        new OpenRouterNetworkError("test"),
        new OpenRouterSchemaError("test"),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(OpenRouterError);
      });
    });

    it("should have unique names for each error type", () => {
      const errors = [
        new OpenRouterError("test"),
        new OpenRouterBadRequestError("test"),
        new OpenRouterAuthError("test"),
        new OpenRouterRateLimitError("test"),
        new OpenRouterServerError("test"),
        new OpenRouterNetworkError("test"),
        new OpenRouterSchemaError("test"),
      ];

      const names = errors.map((e) => e.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(errors.length);
    });
  });

  describe("Error properties", () => {
    it("should preserve stack trace", () => {
      const error = new OpenRouterError("Test error");
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("OpenRouterError");
    });

    it("should be catchable as Error", () => {
      try {
        throw new OpenRouterBadRequestError("Test");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(OpenRouterError);
        expect(error).toBeInstanceOf(OpenRouterBadRequestError);
      }
    });

    it("should allow instanceof checks", () => {
      const error = new OpenRouterRateLimitError("Test");
      expect(error instanceof Error).toBe(true);
      expect(error instanceof OpenRouterError).toBe(true);
      expect(error instanceof OpenRouterRateLimitError).toBe(true);
      expect(error instanceof OpenRouterBadRequestError).toBe(false);
    });
  });
});
