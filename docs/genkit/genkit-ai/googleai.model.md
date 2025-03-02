# Google AI Models for Genkit

This module provides an interface to the Google Gemini models through the Genkit plugin system. It allows users to interact with various Gemini models by providing an API key and optional configuration.

## Available Models

| Model | Description |
|-------|-------------|
| `gemini10Pro` | Gemini 1.0 Pro model |
| `gemini15Flash` | Gemini 1.5 Flash model |
| `gemini15Flash8b` | Gemini 1.5 Flash 8b model |
| `gemini15Pro` | Gemini 1.5 Pro model |
| `gemini20Flash` | Gemini 2.0 Flash model |
| `gemini20ProExp0205` | Gemini 2.0 Pro Experimental (02/05) model |
| `textEmbedding004` | Text Embedding 004 model |
| `textEmbeddingGecko001` | Text Embedding Gecko 001 model |

## Installation

```bash
npm i --save @genkit-ai/googleai
```

## Usage

To use the Gemini models, initialize the googleAI plugin inside `genkit` and specify the model you want to use.

```typescript
import { genkit } from 'genkit';
import { googleAI, gemini } from '@genkit-ai/googleai';
import { defineSecret } from "firebase-functions/params";

// Optional: Define secret for API key
const googleAIApiKey = defineSecret("GOOGLE_GENAI_API_KEY");

const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: googleAIApiKey 
    })
    // ... other plugins
  ],
  model: gemini('gemini-1.5-flash'),
});

// Example usage
async function example() {
  const { text } = await ai.generate('hi Gemini!');
  console.log(text);
}
```

## Additional Information

The sources for this package are in the main Genkit repo. Please file issues and pull requests against that repo.

Usage information and reference details can be found in [Genkit documentation](https://genkit.dev/docs).

License: Apache 2.0
