# 10xCards Documentation

Welcome to the 10xCards documentation! This directory contains comprehensive guides for the OpenRouter Service implementation.

## 📚 Documentation Index

### Core Documentation

1. **[OpenRouter Service](./openrouter-service.md)** - Complete usage guide
   - Installation and setup
   - Basic and advanced usage examples
   - API reference
   - Security best practices
   - Performance optimization
   - Troubleshooting

2. **[Testing Guide](./openrouter-service-testing.md)** - Comprehensive testing strategies
   - 8 manual test scripts
   - Unit testing setup with Vitest
   - Integration testing examples
   - Best practices and troubleshooting

3. **[Integration Example](./openrouter-integration-example.md)** - Real-world implementation
   - Complete API endpoint example
   - Error handling patterns
   - Event logging integration
   - Migration guide from mock to real AI
   - Monitoring and analytics

4. **[Implementation Summary](./openrouter-implementation-summary.md)** - Project overview
   - What was implemented
   - File structure
   - Key features
   - Migration guide
   - Performance metrics

## 🚀 Quick Start

### 1. Add API Key

```bash
# Add to .env file
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 2. Basic Usage

```typescript
import { OpenRouterService } from "@/lib/services/openrouter.service";

const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});

const response = await service.chat({
  model: "openai/gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello!" }],
});
```

### 3. Generate Flashcards

```typescript
import { generateFlashcards } from "@/lib/services/ai.service";

const result = await generateFlashcards(inputText, "openai/gpt-3.5-turbo");
console.log(result.candidates); // Array of flashcards
```

## 📖 Documentation Guide

### For First-Time Users

Start here:

1. [OpenRouter Service](./openrouter-service.md) - Read "Overview" and "Basic Usage"
2. [Integration Example](./openrouter-integration-example.md) - See real-world usage
3. [Testing Guide](./openrouter-service-testing.md) - Run manual tests

### For Developers

Implementing features:

1. [OpenRouter Service](./openrouter-service.md) - Full API reference
2. [Integration Example](./openrouter-integration-example.md) - Integration patterns
3. [Testing Guide](./openrouter-service-testing.md) - Unit test examples

### For DevOps/Deployment

Setting up production:

1. [Implementation Summary](./openrouter-implementation-summary.md) - Environment setup
2. [OpenRouter Service](./openrouter-service.md) - Security section
3. [Integration Example](./openrouter-integration-example.md) - Monitoring section

### For Troubleshooting

Having issues:

1. [OpenRouter Service](./openrouter-service.md) - Troubleshooting section
2. [Testing Guide](./openrouter-service-testing.md) - Test your setup
3. [Integration Example](./openrouter-integration-example.md) - Common issues

## 🎯 Common Tasks

### Task: Test the Service

→ See [Testing Guide](./openrouter-service-testing.md) - Manual Testing section

### Task: Integrate into API Endpoint

→ See [Integration Example](./openrouter-integration-example.md) - Complete Integration Example

### Task: Handle Errors

→ See [OpenRouter Service](./openrouter-service.md) - Error Handling section

### Task: Enable Streaming

→ See [OpenRouter Service](./openrouter-service.md) - Streaming Responses section

### Task: Optimize Performance

→ See [OpenRouter Service](./openrouter-service.md) - Performance Tips section

### Task: Deploy to Production

→ See [Implementation Summary](./openrouter-implementation-summary.md) - Migration Guide

## 🔑 Key Concepts

### Service Architecture

The OpenRouter Service follows a layered architecture:

```
API Endpoint (ai-sessions.ts)
    ↓
AI Service (ai.service.ts)
    ↓
OpenRouter Service (openrouter.service.ts)
    ↓
OpenRouter API
```

### Error Handling Flow

```
Service Error
    ↓
Custom Error Class (OpenRouterError)
    ↓
API Error Handler (handleApiError)
    ↓
Event Logger (logEvent)
    ↓
Client Response
```

### Type Safety

All interactions are fully typed:

- Request options (`ChatOptions`)
- Response data (`ChatSuccess`)
- Error classes (7 custom types)
- Message formats (`OpenRouterMessage`)

## 📦 What's Included

### Service Files

- `src/lib/openrouter.types.ts` - Type definitions
- `src/lib/services/openrouter.service.ts` - Core service
- `src/lib/services/ai.service.ts` - Flashcard generation

### Documentation Files

- `docs/openrouter-service.md` - Usage guide
- `docs/openrouter-service-testing.md` - Testing guide
- `docs/openrouter-integration-example.md` - Integration example
- `docs/openrouter-implementation-summary.md` - Implementation summary
- `docs/README.md` - This file

### Dependencies

- `zod` - Runtime validation
- `p-retry` - Retry logic

## 🛡️ Security

**Important**: The OpenRouter Service is designed for server-side use only.

- ✅ API key stored server-side
- ✅ Environment variable configuration
- ✅ Input validation
- ✅ Error sanitization
- ⚠️ Never expose API key to client
- ⚠️ Implement rate limiting at API route level

See [OpenRouter Service - Security](./openrouter-service.md#security-best-practices) for details.

## 🧪 Testing

### Quick Test

```bash
# Add API key
export OPENROUTER_API_KEY=your-key

# Run test script (create from testing guide)
npx tsx scripts/test-openrouter.ts
```

### Full Test Suite

See [Testing Guide](./openrouter-service-testing.md) for:

- 8 manual test scripts
- Unit test setup
- Integration tests

## 📊 Performance

Expected metrics:

- **Response time**: 2-15 seconds (model dependent)
- **Token usage**: 500-1500 tokens per generation
- **Cost**: $0.001-0.01 per generation
- **Success rate**: 95%+ with retry logic

See [Implementation Summary - Performance Metrics](./openrouter-implementation-summary.md#performance-metrics) for details.

## 🐛 Troubleshooting

### Common Issues

| Issue             | Solution             | Documentation                                                                          |
| ----------------- | -------------------- | -------------------------------------------------------------------------------------- |
| API key not found | Add to `.env`        | [OpenRouter Service](./openrouter-service.md#installation)                             |
| Rate limit errors | Auto-retries enabled | [OpenRouter Service](./openrouter-service.md#error-handling)                           |
| Slow generation   | Use faster model     | [OpenRouter Service](./openrouter-service.md#performance-tips)                         |
| Invalid format    | JSON schema enforced | [Integration Example](./openrouter-integration-example.md#response-format-integration) |

## 📞 Support

1. **Check Documentation**: Start with relevant guide above
2. **Review Examples**: See [Integration Example](./openrouter-integration-example.md)
3. **Test Your Setup**: Use [Testing Guide](./openrouter-service-testing.md)
4. **Check Logs**: Review Supabase event logs
5. **OpenRouter Status**: https://openrouter.ai/status

## 🎓 Learning Path

### Beginner

1. Read [OpenRouter Service - Overview](./openrouter-service.md#overview)
2. Try [Basic Usage](./openrouter-service.md#basic-usage) examples
3. Run [Manual Tests](./openrouter-service-testing.md#manual-testing)

### Intermediate

1. Study [Integration Example](./openrouter-integration-example.md)
2. Implement in your API endpoint
3. Add error handling and logging

### Advanced

1. Optimize with [Performance Tips](./openrouter-service.md#performance-tips)
2. Set up [Monitoring](./openrouter-integration-example.md#monitoring-and-analytics)
3. Implement streaming and caching

## 📝 Additional Resources

### External Links

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter API Reference](https://openrouter.ai/docs/api-reference)
- [OpenRouter Models](https://openrouter.ai/models)

### Related Code

- Error handling: `src/lib/utils/api-error.ts`
- Event logging: `src/lib/services/event-log.service.ts`
- AI sessions: `src/lib/services/ai-sessions.service.ts`

## ✅ Status

**Implementation**: Complete ✅  
**Documentation**: Complete ✅  
**Testing**: Guides provided ✅  
**Production Ready**: Yes ✅

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Status**: Production Ready 🚀

