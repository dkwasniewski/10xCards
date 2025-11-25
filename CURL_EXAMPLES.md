# OpenRouter Integration - cURL Examples

This document provides cURL examples to test the OpenRouter integration for AI-powered flashcard generation.

## Prerequisites

1. **Server running**: `npm run dev` (default: http://localhost:3000)
2. **Environment variables set** in `.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   SUPABASE_URL=https://...
   SUPABASE_KEY=eyJ...
   ```

## API Endpoint

```
POST /api/ai-sessions
```

### Request Body

```json
{
  "input_text": "string (1000-10000 characters)",
  "model": "string (optional, defaults to openai/gpt-4o-mini)"
}
```

### Allowed Models

- `openai/gpt-4o-mini` (default)
- `openai/gpt-4`
- `openai/gpt-3.5-turbo`
- `anthropic/claude-3-sonnet`
- `anthropic/claude-3-haiku`

### Response (201 Created)

```json
{
  "id": "uuid",
  "candidates": [
    {
      "front": "Question text",
      "back": "Answer text",
      "prompt": "What this flashcard tests"
    }
  ],
  "input_text_hash": "md5-hash"
}
```

## cURL Examples

### 1. Basic Request (Default Model)

```bash
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Artificial Intelligence (AI) has revolutionized numerous fields, from healthcare to finance, transportation to entertainment. At its core, AI refers to the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, and self-correction. Machine learning, a subset of AI, enables systems to automatically learn and improve from experience without being explicitly programmed. Deep learning, a further subset of machine learning, uses neural networks with multiple layers to progressively extract higher-level features from raw input. Natural Language Processing (NLP) is another crucial area of AI that focuses on the interaction between computers and human language. It enables machines to read, understand, and derive meaning from human languages in a valuable way. Computer vision, yet another important AI domain, trains computers to interpret and understand the visual world. Using digital images from cameras and videos and deep learning models, machines can accurately identify and classify objects. The applications of AI are vast and growing. In healthcare, AI assists in diagnosis, drug discovery, and personalized treatment plans. In finance, it powers algorithmic trading, fraud detection, and risk assessment. Autonomous vehicles rely heavily on AI for navigation and decision-making. Virtual assistants like Siri and Alexa use AI to understand and respond to user queries. As AI continues to evolve, ethical considerations become increasingly important, including concerns about privacy, bias, job displacement, and the need for responsible AI development."
  }'
```

### 2. Request with Specific Model

```bash
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Quantum computing represents a paradigm shift in computational technology. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits or qubits, which can exist in multiple states simultaneously through a phenomenon called superposition. This allows quantum computers to process vast amounts of information in parallel. Another key principle is entanglement, where qubits become correlated in ways that have no classical analog. When qubits are entangled, the state of one qubit instantly influences the state of another, regardless of distance. Quantum computers excel at specific tasks such as factoring large numbers, simulating molecular behavior, and optimizing complex systems. However, they face significant challenges including maintaining quantum coherence, error correction, and scaling up the number of qubits. Major tech companies and research institutions are racing to achieve quantum supremacy - the point where quantum computers can solve problems that classical computers practically cannot. Applications of quantum computing span cryptography, drug discovery, financial modeling, artificial intelligence, and climate modeling. While still in early stages, quantum computing promises to revolutionize fields requiring massive computational power and could potentially break current encryption methods, necessitating the development of quantum-resistant cryptography.",
    "model": "openai/gpt-3.5-turbo"
  }'
```

### 3. Request with GPT-4 (Higher Quality)

```bash
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "The human brain is the most complex organ in the body, containing approximately 86 billion neurons. Each neuron can form thousands of synaptic connections with other neurons, creating a vast network of communication pathways. Neurons transmit information through electrical and chemical signals. When a neuron fires, an electrical impulse travels down its axon and triggers the release of neurotransmitters at the synapse. These chemical messengers cross the synaptic gap and bind to receptors on the receiving neuron, either exciting or inhibiting its activity. The brain is divided into several major regions, each with specialized functions. The cerebral cortex, the outer layer of the brain, is responsible for higher-order thinking, including reasoning, language, and consciousness. The hippocampus plays a crucial role in forming new memories and spatial navigation. The amygdala processes emotions, particularly fear and anxiety. The cerebellum coordinates movement and balance. Neuroplasticity refers to the brain'\''s remarkable ability to reorganize itself by forming new neural connections throughout life. This allows the brain to adapt to new experiences, learn new information, and recover from injuries. Understanding brain function has profound implications for treating neurological disorders, developing artificial intelligence, and enhancing human cognitive capabilities through brain-computer interfaces.",
    "model": "openai/gpt-4"
  }'
```

### 4. Request with Claude (Anthropic)

```bash
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Climate change refers to long-term shifts in global temperatures and weather patterns. While climate has changed throughout Earth'\''s history, current changes are occurring at an unprecedented rate, primarily due to human activities. The burning of fossil fuels releases greenhouse gases, particularly carbon dioxide and methane, which trap heat in the atmosphere. This enhanced greenhouse effect leads to global warming. The consequences of climate change are far-reaching and include rising sea levels due to melting ice caps and thermal expansion of oceans, more frequent and severe weather events such as hurricanes and droughts, shifts in ecosystems and biodiversity loss, and impacts on agriculture and food security. The Paris Agreement, adopted in 2015, represents a global effort to limit temperature increases to well below 2 degrees Celsius above pre-industrial levels. Mitigation strategies include transitioning to renewable energy sources like solar and wind power, improving energy efficiency, protecting and restoring forests, and developing carbon capture technologies. Adaptation measures help communities prepare for unavoidable climate impacts through improved infrastructure, water management, and agricultural practices. Individual actions, while important, must be complemented by systemic changes in policy, technology, and economic structures to effectively address this global challenge.",
    "model": "anthropic/claude-3-haiku"
  }'
```

### 5. Pretty Print Response with jq

```bash
curl -s -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "YOUR_TEXT_HERE (1000+ characters)"
  }' | jq '.'
```

### 6. Save Response to File

```bash
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "YOUR_TEXT_HERE (1000+ characters)"
  }' -o response.json

# View the response
cat response.json | jq '.'
```

### 7. Extract Session ID

```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "YOUR_TEXT_HERE (1000+ characters)"
  }' | jq -r '.id')

echo "Session ID: $SESSION_ID"
```

### 8. Get Candidates for a Session

```bash
# First, create a session and get the ID
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{"input_text": "YOUR_TEXT_HERE"}' | jq -r '.id')

# Then, fetch the candidates
curl -X GET "http://localhost:3000/api/ai-sessions/${SESSION_ID}/candidates" \
  -H "Content-Type: application/json" | jq '.'
```

## Error Examples

### 1. Text Too Short (< 1000 characters)

```bash
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "This text is too short."
  }'
```

**Response (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 1000,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "input_text must be at least 1000 characters",
      "path": ["input_text"]
    }
  ]
}
```

### 2. Invalid Model

```bash
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "YOUR_TEXT_HERE (1000+ characters)",
    "model": "invalid-model"
  }'
```

**Response (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "custom",
      "message": "Invalid model. Allowed models: openai/gpt-4o-mini, openai/gpt-4, openai/gpt-3.5-turbo, anthropic/claude-3-sonnet, anthropic/claude-3-haiku",
      "path": ["model"]
    }
  ]
}
```

### 3. Malformed JSON

```bash
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{ invalid json }'
```

**Response (400 Bad Request):**

```json
{
  "error": "Invalid JSON",
  "message": "Request body must be valid JSON."
}
```

## Testing with the Automated Script

Make the test script executable and run it:

```bash
chmod +x test-openrouter-integration.sh
./test-openrouter-integration.sh
```

Or specify a custom base URL:

```bash
BASE_URL=https://your-production-domain.com ./test-openrouter-integration.sh
```

## Performance Testing

### Measure Response Time

```bash
time curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "YOUR_TEXT_HERE (1000+ characters)"
  }'
```

### Verbose Output (Debug)

```bash
curl -v -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "YOUR_TEXT_HERE (1000+ characters)"
  }'
```

## Tips

1. **Use variables for long text**: Store your input text in a file and use it in curl:

   ```bash
   INPUT_TEXT=$(cat sample-text.txt)
   curl -X POST http://localhost:3000/api/ai-sessions \
     -H "Content-Type: application/json" \
     -d "{\"input_text\": \"${INPUT_TEXT}\"}"
   ```

2. **Check HTTP status code**:

   ```bash
   curl -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/api/ai-sessions \
     -H "Content-Type: application/json" \
     -d '{"input_text": "YOUR_TEXT_HERE"}'
   ```

3. **Follow redirects** (if any):
   ```bash
   curl -L -X POST http://localhost:3000/api/ai-sessions \
     -H "Content-Type: application/json" \
     -d '{"input_text": "YOUR_TEXT_HERE"}'
   ```

## Troubleshooting

### Issue: "OPENROUTER_API_KEY environment variable is not set"

**Solution**: Ensure your `.env` file contains the API key:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Issue: Connection refused

**Solution**: Make sure the dev server is running:

```bash
npm run dev
```

### Issue: 500 Internal Server Error

**Solution**: Check the server logs for detailed error messages. Common causes:

- Invalid OpenRouter API key
- Database connection issues
- Network connectivity problems

## Next Steps

After successful testing:

1. Monitor API usage in OpenRouter dashboard
2. Check database for stored sessions and candidates
3. Test the candidate actions endpoint (accept/edit/reject)
4. Verify event logging is working correctly
