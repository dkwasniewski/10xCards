# API Endpoint Implementation Plan: POST /ai-sessions

## 1. Endpoint Overview

This endpoint creates a new AI generation session and generates flashcard candidates from user-provided input text. The endpoint handles authentication, input validation, rate limiting, and integrates with external AI services to generate flashcard content.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/ai-sessions`
- **Parameters**:
  - Required:
    - `input_text`: string (1000-10000 characters)
    - `model`: string (AI model identifier)
  - Optional: None
- **Request Body**:
  ```json
  {
    "input_text": "string (1000-10000 chars)",
    "model": "string"
  }
  ```

## 3. Used Types

- `CreateAiSessionCommand`: Request command type
- `AiSessionResponseDto`: Response DTO type
- `CandidateCreateDto`: Individual candidate structure
- `TablesInsert<"ai_generation_sessions">`: Database insert type
- `TablesInsert<"event_logs">`: Event logging type

## 4. Response Details

- **Success Response (201)**:
  ```json
  {
    "id": "uuid",
    "candidates": [
      {
        "front": "string",
        "back": "string",
        "prompt": "string"
      }
    ]
  }
  ```
- **Error Responses**:
  - 400: Validation errors (invalid input length, malformed JSON)
  - 401: Unauthorized (missing/invalid JWT)
  - 429: Rate limit exceeded
  - 500: Server errors (AI service failure, database errors)

## 5. Data Flow

1. **Authentication**: Verify JWT token from Authorization header
2. **Rate Limiting**: Check user's request frequency against limits
3. **Input Validation**: Validate request body using Zod schema
4. **Database Transaction**: Create AI session record with user_id and input_text
5. **AI Service Call**: Send request to OpenRouter API with input_text and model
6. **Response Processing**: Parse AI response and extract candidate flashcards
7. **Database Update**: Store generated candidates and update session metadata
8. **Event Logging**: Log successful generation event
9. **Response**: Return session ID and candidates array

## 6. Security Considerations

- **Authentication**: JWT token validation via Supabase Auth
- **Authorization**: RLS policies ensure user can only access their own sessions
- **Input Sanitization**: Validate and sanitize input_text to prevent injection attacks
- **Rate Limiting**: Implement per-user rate limits to prevent abuse
- **Model Validation**: Validate model parameter against allowed models list
- **Error Handling**: Avoid exposing sensitive information in error messages
- **API Key Security**: Store OpenRouter API key in environment variables

## 7. Error Handling

- **400 Bad Request**:
  - Input text length validation failure
  - Invalid model parameter
  - Malformed JSON request body
  - Missing required fields
- **401 Unauthorized**:
  - Missing Authorization header
  - Invalid or expired JWT token
  - User not authenticated
- **429 Too Many Requests**:
  - User exceeded rate limit for AI generation
  - Implement exponential backoff
- **500 Internal Server Error**:
  - AI service (OpenRouter) unavailable
  - Database connection failure
  - Unexpected server errors

## 8. Performance Considerations

- **Database Optimization**: Use prepared statements and connection pooling
- **AI Service Timeout**: Set reasonable timeout for external AI API calls
- **Caching**: Consider caching common model responses (if applicable)
- **Async Processing**: Handle AI generation asynchronously for better UX
- **Connection Pooling**: Optimize Supabase client connections
- **Response Compression**: Enable gzip compression for large responses

## 9. Implementation Steps

1. **Create Zod Validation Schema**:
   - Define schema for request body validation
   - Include input_text length constraints (1000-10000)
   - Validate model parameter against allowed values

2. **Implement Rate Limiting Service**:
   - Create rate limiting middleware/service
   - Track user requests per time window
   - Return 429 when limits exceeded

3. **Create AI Service**:
   - Implement OpenRouter API integration
   - Handle API authentication and requests
   - Parse AI responses into candidate format
   - Implement retry logic and error handling

4. **Create Database Service**:
   - Implement session creation logic
   - Handle candidate storage
   - Implement transaction management

5. **Create Astro API Route**:
   - Set up POST handler in `/src/pages/api/ai-sessions.ts`
   - Implement authentication middleware
   - Add request validation
   - Integrate rate limiting

6. **Implement Error Handling**:
   - Create standardized error response format
   - Implement error logging to event_logs table
   - Add proper HTTP status codes

7. **Add Event Logging**:
   - Log successful AI generation events
   - Log failed attempts with error details
   - Track generation duration and metadata

8. **Testing and Validation**:
   - Unit tests for validation schemas
   - Integration tests for AI service
   - End-to-end tests for complete flow
   - Load testing for rate limiting

9. **Documentation and Monitoring**:
   - Add API documentation
   - Implement monitoring and alerting
   - Set up logging for debugging
   - Create health check endpoints
