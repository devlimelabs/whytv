# OpenAI Models for Genkit

This module provides an interface to the OpenAI models through the Genkit plugin system. It allows users to interact with various models by providing an API key and optional configuration.

## Available Models

| Model | Description |
|-------|-------------|
| `gpt4o` | GPT-4o model |
| `gpt4oMini` | GPT-4o-mini model |
| `gpt4Turbo` | GPT-4 Turbo model |
| `gpt4Vision` | GPT-4 Vision model |
| `gpt4` | GPT-4 model |
| `gpt35Turbo` | GPT-3.5 Turbo model |
| `dallE3` | DALL-E 3 image generation model |
| `o1` | O1 model |
| `o1Preview` | O1 Preview model |
| `o1Mini` | O1 Mini model |
| `o3Mini` | O3 Mini model |
| `tts1` | Text-to-speech 1 model |
| `tts1Hd` | Text-to-speech 1 HD model |
| `whisper1` | Whisper speech-to-text model |
| `textEmbedding3Large` | Text Embedding 3 Large model |
| `textEmbedding3Small` | Text Embedding 3 Small model |
| `textEmbeddingAda002` | Ada 002 text embedding model |

## Usage

To use the models, initialize the openai plugin inside `configureGenkit` and pass the configuration options. If no API key is provided in the options, the environment variable `OPENAI_API_KEY` must be set.

```typescript
import { openai, gpt4o } from 'genkitx-openai';
import { defineSecret } from "firebase-functions/params";
import { configureGenkit } from 'genkit';

// Optional: Define secret for API key
const openAIApiKey = defineSecret("OPENAI_API_KEY");

export default configureGenkit({
  plugins: [
    openai({ apiKey: openAIApiKey })
    // ... other plugins
  ],
  model: gpt4o
});
```

## Exports

The module exports all the model references listed above, as well as the main `openai` plugin function to interact with OpenAI services.
