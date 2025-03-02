import type { Genkit } from 'genkit';
import { genkitPlugin } from 'genkit/plugin';
import Anthropic from '@anthropic-ai/sdk';

import {
  claude37Sonnet,
  claude35Sonnet,
  claude3Opus,
  claude3Sonnet,
  claude3Haiku,
  claude35Haiku,
  claudeModel,
  SUPPORTED_CLAUDE_MODELS,
} from './claude.js';

export {
  claude37Sonnet,
  claude35Sonnet,
  claude3Opus,
  claude3Sonnet,
  claude3Haiku,
  claude35Haiku,
};

export interface PluginOptions {
  apiKey?: string;
  cacheSystemPrompt?: boolean;
}

# Anthropic Models for Genkit

This module provides an interface to the Anthropic AI models through the Genkit plugin system. It allows users to interact with various Claude models by providing an API key and optional configuration.

## Available Models

| Model | Description |
|-------|-------------|
| `claude37Sonnet` | Claude 3.7 Sonnet model |
| `claude35Sonnet` | Claude 3.5 Sonnet model |
| `claude3Opus` | Claude 3 Opus model |
| `claude3Sonnet` | Claude 3 Sonnet model |
| `claude3Haiku` | Claude 3 Haiku model |
| `claude35Haiku` | Claude 3.5 Haiku model |

## Usage

To use the Claude models, initialize the anthropic plugin inside `configureGenkit` and pass the configuration options. If no API key is provided in the options, the environment variable `ANTHROPIC_API_KEY` must be set. If you want to cache the system prompt, set `cacheSystemPrompt` to `true`.

**Note:** Prompt caching is in beta and may change. To learn more, see [Anthropic's documentation on prompt caching](https://docs.anthropic.com/en/docs/prompt-caching).

```typescript
import { anthropic, claude37Sonnet } from 'genkitx-anthropic';
import { defineSecret } from "firebase-functions/params";
import { configureGenkit } from 'genkit';

// Define secret for API key
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

export default configureGenkit({
  plugins: [
    anthropic({ 
      apiKey: anthropicApiKey, 
      cacheSystemPrompt: false 
    })
    // ... other plugins
  ],
  model: claude37Sonnet
});
```

## Exports

The module exports all the model references listed above, as well as the main `anthropic` plugin function to interact with Anthropic AI services.
