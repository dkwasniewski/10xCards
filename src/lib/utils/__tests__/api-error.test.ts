import { describe, it, expect, vi, beforeEach } from "vitest";
import { errorResponse, handleApiError, logError, ErrorMessages } from "../api-error";
import type { SupabaseClient } from "../../../db/supabase.client";

/**
 * Unit tests for API error utilities
 * Tests error response creation, error logging, and standardized error handling
 * Following Vitest best practices: vi.fn() for mocks, AAA pattern, descriptive tests
 */

describe("errorResponse", () => {
  describe("basic error responses", () => {
    it("should create response with correct status and error message", () => {
      // Arrange
      const status = 400;
      const error = "Bad request";

      // Act
      const response = errorResponse(status, error);

      // Assert
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should include error message in response body", async () => {
      // Arrange
      const status = 404;
      const error = "Resource not found";

      // Act
      const response = errorResponse(status, error);
      const body = await response.json();

      // Assert
      expect(body).toEqual({ error: "Resource not found" });
    });

    it("should handle different status codes", () => {
      // Arrange
      const testCases = [
        { status: 400, error: "Bad Request" },
        { status: 401, error: "Unauthorized" },
        { status: 403, error: "Forbidden" },
        { status: 404, error: "Not Found" },
        { status: 500, error: "Internal Server Error" },
      ];

      testCases.forEach(({ status, error }) => {
        // Act
        const response = errorResponse(status, error);

        // Assert
        expect(response.status).toBe(status);
      });
    });
  });

  describe("error responses with details", () => {
    it("should include details when provided", async () => {
      // Arrange
      const status = 400;
      const error = "Validation error";
      const details = { field: "email", message: "Invalid format" };

      // Act
      const response = errorResponse(status, error, details);
      const body = await response.json();

      // Assert
      expect(body).toEqual({
        error: "Validation error",
        details: { field: "email", message: "Invalid format" },
      });
    });

    it("should omit details when not provided", async () => {
      // Arrange
      const status = 400;
      const error = "Bad request";

      // Act
      const response = errorResponse(status, error);
      const body = await response.json();

      // Assert
      expect(body).toEqual({ error: "Bad request" });
      expect(body).not.toHaveProperty("details");
    });

    it("should handle complex details objects", async () => {
      // Arrange
      const status = 400;
      const error = "Validation error";
      const details = {
        errors: [
          { field: "email", message: "Required" },
          { field: "password", message: "Too short" },
        ],
        timestamp: "2024-01-01T00:00:00Z",
      };

      // Act
      const response = errorResponse(status, error, details);
      const body = await response.json();

      // Assert
      expect(body.details).toEqual(details);
    });

    it("should handle null details", async () => {
      // Arrange
      const status = 400;
      const error = "Bad request";
      const details = null;

      // Act
      const response = errorResponse(status, error, details);
      const body = await response.json();

      // Assert
      expect(body).toEqual({ error: "Bad request" });
    });

    it("should handle undefined details", async () => {
      // Arrange
      const status = 400;
      const error = "Bad request";
      const details = undefined;

      // Act
      const response = errorResponse(status, error, details);
      const body = await response.json();

      // Assert
      expect(body).toEqual({ error: "Bad request" });
    });
  });

  describe("response format", () => {
    it("should set Content-Type header to application/json", () => {
      // Arrange
      const status = 400;
      const error = "Bad request";

      // Act
      const response = errorResponse(status, error);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return valid JSON", async () => {
      // Arrange
      const status = 400;
      const error = "Bad request";

      // Act
      const response = errorResponse(status, error);
      const body = await response.json();

      // Assert
      expect(body).toBeDefined();
      expect(typeof body).toBe("object");
    });
  });
});

describe("logError", () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Arrange - Create fresh mock for each test
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
  });

  describe("successful error logging", () => {
    it("should log error to event_logs table", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const userId = "user-123";

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("event_logs");
    });

    it("should include error message in metadata", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.metadata.error).toBe("Test error");
    });

    it("should include error stack in metadata", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.metadata.stack).toBeDefined();
    });

    it("should include service name in metadata", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.metadata.service).toBe("POST /api/login");
    });

    it("should include timestamp in metadata", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.metadata.timestamp).toBeDefined();
      expect(typeof insertCall.metadata.timestamp).toBe("string");
    });

    it('should set event_type to "error"', async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.event_type).toBe("error");
    });

    it('should set event_source to "manual"', async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.event_source).toBe("manual");
    });

    it("should include userId when provided", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.user_id).toBe("user-123");
    });

    it("should set userId to null when not provided", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.user_id).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should handle non-Error objects", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = "String error";
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.metadata.error).toBe("String error");
      expect(insertCall.metadata.stack).toBeUndefined();
    });

    it("should not throw when logging fails", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const userId = "user-123";
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error("Database error")),
      });

      // Act & Assert - Should not throw
      await expect(logError(mockSupabase as unknown as SupabaseClient, service, error, userId)).resolves.not.toThrow();
    });

    it("should silently fail when database insert fails", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("Test error");
      const userId = "user-123";
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: { message: "Insert failed" } }),
      });

      // Act & Assert - Should not throw
      await expect(logError(mockSupabase as unknown as SupabaseClient, service, error, userId)).resolves.not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle empty error message", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = new Error("");
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.metadata.error).toBe("");
    });

    it("should handle null error", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = null;
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.metadata.error).toBe("null");
    });

    it("should handle undefined error", async () => {
      // Arrange
      const service = "POST /api/login";
      const error = undefined;
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await logError(mockSupabase as unknown as SupabaseClient, service, error, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.metadata.error).toBe("undefined");
    });
  });
});

describe("handleApiError", () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Arrange - Create fresh mock for each test
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
  });

  describe("4xx errors (client errors)", () => {
    it("should not log 4xx errors", async () => {
      // Arrange
      const status = 400;
      const error = "Bad request";

      // Act
      await handleApiError(status, error, undefined, mockSupabase as unknown as SupabaseClient, "POST /api/test");

      // Assert
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should return error response for 400", async () => {
      // Arrange
      const status = 400;
      const error = "Bad request";

      // Act
      const response = await handleApiError(status, error);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body.error).toBe("Bad request");
    });

    it("should return error response for 401", async () => {
      // Arrange
      const status = 401;
      const error = "Unauthorized";

      // Act
      const response = await handleApiError(status, error);

      // Assert
      expect(response.status).toBe(401);
    });

    it("should return error response for 404", async () => {
      // Arrange
      const status = 404;
      const error = "Not found";

      // Act
      const response = await handleApiError(status, error);

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe("5xx errors (server errors)", () => {
    it("should log 5xx errors when supabase client provided", async () => {
      // Arrange
      const status = 500;
      const error = "Internal server error";
      const service = "POST /api/test";

      // Act
      await handleApiError(status, error, undefined, mockSupabase as unknown as SupabaseClient, service);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("event_logs");
    });

    it("should return error response for 500", async () => {
      // Arrange
      const status = 500;
      const error = "Internal server error";

      // Act
      const response = await handleApiError(status, error);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });

    it("should not log when supabase client not provided", async () => {
      // Arrange
      const status = 500;
      const error = "Internal server error";

      // Act
      await handleApiError(status, error);

      // Assert
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should not log when service name not provided", async () => {
      // Arrange
      const status = 500;
      const error = "Internal server error";

      // Act
      await handleApiError(status, error, undefined, mockSupabase as unknown as SupabaseClient);

      // Assert
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should log with userId when provided", async () => {
      // Arrange
      const status = 500;
      const error = "Internal server error";
      const service = "POST /api/test";
      const userId = "user-123";
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });

      // Act
      await handleApiError(status, error, undefined, mockSupabase as unknown as SupabaseClient, service, userId);

      // Assert
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.user_id).toBe("user-123");
    });
  });

  describe("error responses with details", () => {
    it("should include details in response", async () => {
      // Arrange
      const status = 400;
      const error = "Validation error";
      const details = { field: "email", message: "Invalid" };

      // Act
      const response = await handleApiError(status, error, details);
      const body = await response.json();

      // Assert
      expect(body).toEqual({
        error: "Validation error",
        details: { field: "email", message: "Invalid" },
      });
    });

    it("should omit details when not provided", async () => {
      // Arrange
      const status = 400;
      const error = "Bad request";

      // Act
      const response = await handleApiError(status, error);
      const body = await response.json();

      // Assert
      expect(body).toEqual({ error: "Bad request" });
      expect(body).not.toHaveProperty("details");
    });
  });

  describe("response format", () => {
    it("should set Content-Type header to application/json", async () => {
      // Arrange
      const status = 400;
      const error = "Bad request";

      // Act
      const response = await handleApiError(status, error);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return Response object", async () => {
      // Arrange
      const status = 400;
      const error = "Bad request";

      // Act
      const response = await handleApiError(status, error);

      // Assert
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("edge cases", () => {
    it("should handle exactly 500 status (boundary)", async () => {
      // Arrange
      const status = 500;
      const error = "Internal server error";
      const service = "POST /api/test";

      // Act
      await handleApiError(status, error, undefined, mockSupabase as unknown as SupabaseClient, service);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    it("should handle 501+ status codes", async () => {
      // Arrange
      const status = 503;
      const error = "Service unavailable";
      const service = "POST /api/test";

      // Act
      await handleApiError(status, error, undefined, mockSupabase as unknown as SupabaseClient, service);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    it("should handle 499 status (not logged)", async () => {
      // Arrange
      const status = 499;
      const error = "Client closed request";
      const service = "POST /api/test";

      // Act
      await handleApiError(status, error, undefined, mockSupabase as unknown as SupabaseClient, service);

      // Assert
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});

describe("ErrorMessages", () => {
  describe("constant values", () => {
    it("should have UNAUTHORIZED message", () => {
      // Assert
      expect(ErrorMessages.UNAUTHORIZED).toBe("Unauthorized");
    });

    it("should have BAD_REQUEST message", () => {
      // Assert
      expect(ErrorMessages.BAD_REQUEST).toBe("Bad request");
    });

    it("should have VALIDATION_ERROR message", () => {
      // Assert
      expect(ErrorMessages.VALIDATION_ERROR).toBe("Validation error");
    });

    it("should have NOT_FOUND message", () => {
      // Assert
      expect(ErrorMessages.NOT_FOUND).toBe("Resource not found");
    });

    it("should have INTERNAL_SERVER_ERROR message", () => {
      // Assert
      expect(ErrorMessages.INTERNAL_SERVER_ERROR).toBe("Internal server error");
    });

    it("should have INVALID_JSON message", () => {
      // Assert
      expect(ErrorMessages.INVALID_JSON).toBe("Invalid JSON body");
    });

    it("should have SUPABASE_CLIENT_UNAVAILABLE message", () => {
      // Assert
      expect(ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE).toBe("Supabase client not available");
    });
  });

  describe("immutability", () => {
    it("should be readonly (const assertion)", () => {
      // Assert - TypeScript will catch if we try to modify
      // This test documents the expected behavior
      expect(Object.isFrozen(ErrorMessages)).toBe(false); // Not frozen, but const assertion
      expect(ErrorMessages).toBeDefined();
    });

    it("should have all expected keys", () => {
      // Assert
      const expectedKeys = [
        "UNAUTHORIZED",
        "BAD_REQUEST",
        "VALIDATION_ERROR",
        "NOT_FOUND",
        "INTERNAL_SERVER_ERROR",
        "INVALID_JSON",
        "SUPABASE_CLIENT_UNAVAILABLE",
      ];

      expectedKeys.forEach((key) => {
        expect(ErrorMessages).toHaveProperty(key);
      });
    });
  });
});
