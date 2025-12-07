/**
 * Unit tests for openrouter.service.ts - OpenRouterService class
 * 
 * Tests cover:
 * - Constructor validation
 * - Message building
 * - Request building (headers, body)
 * - Error handling and classification
 * - Retry logic
 * - Model list caching
 * - Streaming support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterService } from '../openrouter.service';
import {
  OpenRouterBadRequestError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterNetworkError,
  type ChatSuccess,
  type OpenRouterMessage,
} from '../../openrouter.types';

describe('OpenRouterService', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    mockFetch = vi.fn();
    vi.clearAllMocks();
  });

  describe('Constructor Validation', () => {
    it('should throw error when API key is empty', () => {
      expect(() => {
        new OpenRouterService({ apiKey: '' });
      }).toThrow();
    });

    it('should throw error when API key is whitespace only', () => {
      expect(() => {
        new OpenRouterService({ apiKey: '   ' });
      }).toThrow();
    });

    it('should initialize with valid API key', () => {
      expect(() => {
        new OpenRouterService({ apiKey: 'valid-api-key' });
      }).not.toThrow();
    });

    it('should normalize baseURL by removing trailing slash', () => {
      const service = new OpenRouterService({
        apiKey: 'test-key',
        baseURL: 'https://api.example.com/',
        fetchImpl: mockFetch,
      });
      
      // Test by making a request and checking the URL
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
        headers: new Headers(),
      });
      
      service.modelList();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/models',
        expect.any(Object)
      );
    });

    it('should use default baseURL when not provided', async () => {
      const service = new OpenRouterService({
        apiKey: 'test-key',
        fetchImpl: mockFetch,
      });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
        headers: new Headers(),
      });
      
      await service.modelList();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/models',
        expect.any(Object)
      );
    });

    it('should accept custom logger', () => {
      const customLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };
      
      expect(() => {
        new OpenRouterService({
          apiKey: 'test-key',
          logger: customLogger,
        });
      }).not.toThrow();
    });

    it('should accept custom retry configuration', () => {
      expect(() => {
        new OpenRouterService({
          apiKey: 'test-key',
          retryConfig: {
            maxRetries: 5,
            initialDelay: 2000,
            maxDelay: 20000,
            backoffMultiplier: 3,
          },
        });
      }).not.toThrow();
    });
  });

  describe('Message Building - buildMessages()', () => {
    let service: OpenRouterService;
    
    beforeEach(() => {
      service = new OpenRouterService({ apiKey: 'test-key' });
    });

    it('should build messages with system and user', () => {
      const messages = service.buildMessages({
        system: 'You are a helpful assistant',
        user: 'Hello, world!',
      });
      
      expect(messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello, world!' },
      ]);
    });

    it('should build messages with user only (no system)', () => {
      const messages = service.buildMessages({
        user: 'Hello, world!',
      });
      
      expect(messages).toEqual([
        { role: 'user', content: 'Hello, world!' },
      ]);
    });

    it('should build messages with system, history, and user', () => {
      const messages = service.buildMessages({
        system: 'You are a helpful assistant',
        history: [
          { role: 'user', content: 'Previous question' },
          { role: 'assistant', content: 'Previous answer' },
        ],
        user: 'Current question',
      });
      
      expect(messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Previous question' },
        { role: 'assistant', content: 'Previous answer' },
        { role: 'user', content: 'Current question' },
      ]);
    });

    it('should handle empty history array', () => {
      const messages = service.buildMessages({
        system: 'System prompt',
        history: [],
        user: 'User message',
      });
      
      expect(messages).toEqual([
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User message' },
      ]);
    });

    it('should preserve message order in history', () => {
      const messages = service.buildMessages({
        history: [
          { role: 'user', content: 'Q1' },
          { role: 'assistant', content: 'A1' },
          { role: 'user', content: 'Q2' },
          { role: 'assistant', content: 'A2' },
        ],
        user: 'Q3',
      });
      
      expect(messages).toHaveLength(5);
      expect(messages[0].content).toBe('Q1');
      expect(messages[1].content).toBe('A1');
      expect(messages[2].content).toBe('Q2');
      expect(messages[3].content).toBe('A2');
      expect(messages[4].content).toBe('Q3');
    });
  });

  describe('Request Building', () => {
    let service: OpenRouterService;
    
    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: 'test-api-key',
        fetchImpl: mockFetch,
      });
    });

    it('should include Authorization header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          created: Date.now(),
          model: 'test-model',
          usage: { prompt: 10, completion: 5 },
          choices: [{ message: { role: 'assistant', content: 'Response' } }],
        }),
        headers: new Headers(),
      });
      
      await service.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
      });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should include Content-Type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          created: Date.now(),
          model: 'test-model',
          usage: { prompt: 10, completion: 5 },
          choices: [{ message: { role: 'assistant', content: 'Response' } }],
        }),
        headers: new Headers(),
      });
      
      await service.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
      });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include metadata in X-Metadata header when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          created: Date.now(),
          model: 'test-model',
          usage: { prompt: 10, completion: 5 },
          choices: [{ message: { role: 'assistant', content: 'Response' } }],
        }),
        headers: new Headers(),
      });
      
      await service.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
        metadata: { userId: '123', feature: 'test' },
      });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Metadata': JSON.stringify({ userId: '123', feature: 'test' }),
          }),
        })
      );
    });

    it('should include required fields in request body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          created: Date.now(),
          model: 'test-model',
          usage: { prompt: 10, completion: 5 },
          choices: [{ message: { role: 'assistant', content: 'Response' } }],
        }),
        headers: new Headers(),
      });
      
      const messages: OpenRouterMessage[] = [
        { role: 'user', content: 'Test message' }
      ];
      
      await service.chat({
        model: 'test-model',
        messages,
      });
      
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body).toMatchObject({
        model: 'test-model',
        messages,
      });
    });

    it('should include optional temperature when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          created: Date.now(),
          model: 'test-model',
          usage: { prompt: 10, completion: 5 },
          choices: [{ message: { role: 'assistant', content: 'Response' } }],
        }),
        headers: new Headers(),
      });
      
      await service.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.5,
      });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBe(0.5);
    });

    it('should include optional maxTokens when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          created: Date.now(),
          model: 'test-model',
          usage: { prompt: 10, completion: 5 },
          choices: [{ message: { role: 'assistant', content: 'Response' } }],
        }),
        headers: new Headers(),
      });
      
      await service.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
        maxTokens: 1000,
      });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.max_tokens).toBe(1000);
    });

    it('should include responseFormat when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          created: Date.now(),
          model: 'test-model',
          usage: { prompt: 10, completion: 5 },
          choices: [{ message: { role: 'assistant', content: 'Response' } }],
        }),
        headers: new Headers(),
      });
      
      const responseFormat = { type: 'json_object' as const };
      
      await service.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
        responseFormat,
      });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.response_format).toEqual(responseFormat);
    });

    it('should support abort signal', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          created: Date.now(),
          model: 'test-model',
          usage: { prompt: 10, completion: 5 },
          choices: [{ message: { role: 'assistant', content: 'Response' } }],
        }),
        headers: new Headers(),
      });
      
      const abortController = new AbortController();
      
      await service.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
        abortSignal: abortController.signal,
      });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    });
  });

  describe('Error Handling', () => {
    let service: OpenRouterService;
    
    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: 'test-key',
        fetchImpl: mockFetch,
        retryConfig: {
          maxRetries: 0, // Disable retries for error tests
          initialDelay: 0,
          maxDelay: 0,
          backoffMultiplier: 1,
        },
      });
    });

    it('should throw OpenRouterBadRequestError for 400 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request message' }),
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterBadRequestError);
    });

    it('should throw OpenRouterAuthError for 401 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterAuthError);
    });

    it('should throw OpenRouterAuthError for 403 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterAuthError);
    });

    it('should throw OpenRouterRateLimitError for 429 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterRateLimitError);
    });

    it('should include retry-after value in rate limit error', async () => {
      const headers = new Headers();
      headers.set('retry-after', '60');
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
        headers,
      });
      
      try {
        await service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterRateLimitError);
        expect((error as OpenRouterRateLimitError).retryAfter).toBe(60);
      }
    });

    it('should throw OpenRouterServerError for 500 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterServerError);
    });

    it('should throw OpenRouterServerError for 503 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' }),
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterServerError);
    });

    it('should throw OpenRouterNetworkError for network failures', async () => {
      mockFetch.mockRejectedValue(new TypeError('Network request failed'));
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterNetworkError);
    });

    it('should throw OpenRouterNetworkError for abort errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterNetworkError);
    });

    it('should extract error message from response body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Custom error message' }),
        headers: new Headers(),
      });
      
      try {
        await service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Custom error message');
      }
    });

    it('should handle error response with nested error object', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Nested error message',
            code: 'invalid_request',
          }
        }),
        headers: new Headers(),
      });
      
      try {
        await service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Nested error message');
      }
    });

    it('should handle error response with plain text', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Not JSON');
        },
        text: async () => 'Plain text error',
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterServerError);
    });
  });

  describe('Retry Logic', () => {
    let service: OpenRouterService;
    
    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: 'test-key',
        fetchImpl: mockFetch,
        retryConfig: {
          maxRetries: 3,
          initialDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 2,
        },
      });
    });

    it('should retry on rate limit errors', async () => {
      let callCount = 0;
      
      mockFetch.mockImplementation(async () => {
        callCount++;
        
        if (callCount < 3) {
          return {
            ok: false,
            status: 429,
            json: async () => ({ error: 'Rate limit' }),
            headers: new Headers(),
          };
        }
        
        return {
          ok: true,
          json: async () => ({
            id: 'test',
            created: Date.now(),
            model: 'test-model',
            usage: { prompt: 10, completion: 5 },
            choices: [{ message: { role: 'assistant', content: 'Success' } }],
          }),
          headers: new Headers(),
        };
      });
      
      const result = await service.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
      });
      
      expect(callCount).toBe(3);
      expect(result.choices[0].message.content).toBe('Success');
    });

    it('should retry on server errors (5xx)', async () => {
      let callCount = 0;
      
      mockFetch.mockImplementation(async () => {
        callCount++;
        
        if (callCount < 2) {
          return {
            ok: false,
            status: 503,
            json: async () => ({ error: 'Service unavailable' }),
            headers: new Headers(),
          };
        }
        
        return {
          ok: true,
          json: async () => ({
            id: 'test',
            created: Date.now(),
            model: 'test-model',
            usage: { prompt: 10, completion: 5 },
            choices: [{ message: { role: 'assistant', content: 'Success' } }],
          }),
          headers: new Headers(),
        };
      });
      
      const result = await service.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
      });
      
      expect(callCount).toBe(2);
      expect(result).toBeDefined();
    });

    it('should NOT retry on auth errors (401/403)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterAuthError);
      
      // Should only be called once (no retries)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on bad request errors (400)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterBadRequestError);
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries limit', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit' }),
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(OpenRouterRateLimitError);
      
      // Initial attempt + 3 retries = 4 total calls
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Model List Caching', () => {
    let service: OpenRouterService;
    
    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: 'test-key',
        fetchImpl: mockFetch,
      });
    });

    it('should fetch model list from API on first call', async () => {
      const mockModels = [
        { id: 'model-1', name: 'Model 1' },
        { id: 'model-2', name: 'Model 2' },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockModels }),
        headers: new Headers(),
      });
      
      const result = await service.modelList();
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModels);
    });

    it('should return cached data on second call within 5 minutes', async () => {
      const mockModels = [{ id: 'model-1', name: 'Model 1' }];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockModels }),
        headers: new Headers(),
      });
      
      // First call
      await service.modelList();
      
      // Second call (should use cache)
      const result = await service.modelList();
      
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only called once
      expect(result).toEqual(mockModels);
    });

    it('should fetch fresh data after cache expires (5 minutes)', async () => {
      vi.useFakeTimers();
      
      const mockModels = [{ id: 'model-1', name: 'Model 1' }];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockModels }),
        headers: new Headers(),
      });
      
      // First call
      await service.modelList();
      
      // Advance time by 6 minutes
      vi.advanceTimersByTime(6 * 60 * 1000);
      
      // Second call (cache expired, should fetch again)
      await service.modelList();
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });
  });

  describe('Input Validation', () => {
    let service: OpenRouterService;
    
    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: 'test-key',
        fetchImpl: mockFetch,
      });
    });

    it('should throw error when messages array is empty', async () => {
      await expect(
        service.chat({
          model: 'test-model',
          messages: [],
        })
      ).rejects.toThrow();
    });

    it('should throw error when model is empty string', async () => {
      await expect(
        service.chat({
          model: '',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow();
    });

    it('should throw error when temperature is out of range', async () => {
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
          temperature: 3, // Max is 2
        })
      ).rejects.toThrow();
    });

    it('should throw error when maxTokens is negative', async () => {
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
          maxTokens: -100,
        })
      ).rejects.toThrow();
    });

    it('should accept valid temperature values (0-2)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          created: Date.now(),
          model: 'test-model',
          usage: { prompt: 10, completion: 5 },
          choices: [{ message: { role: 'assistant', content: 'Response' } }],
        }),
        headers: new Headers(),
      });
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
          temperature: 0,
        })
      ).resolves.toBeDefined();
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
          temperature: 1,
        })
      ).resolves.toBeDefined();
      
      await expect(
        service.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
          temperature: 2,
        })
      ).resolves.toBeDefined();
    });
  });
});


