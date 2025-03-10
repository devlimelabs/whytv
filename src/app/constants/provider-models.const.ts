// AI Provider and Model settings
export const AI_PROVIDERS = [
  { name: 'OpenAI', value: 'openai' },
  { name: 'Anthropic', value: 'anthropic' },
  { name: 'Google AI', value: 'google' }
];

// Available models by provider
export const AI_MODELS = {
  openai: [
    { name: 'GPT-4o', value: 'gpt-4o' },
    { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
    { name: 'GPT-4o Mini', value: 'gpt-4o-mini' },
    { name: 'o1 Mini', value: 'o1-mini' },
  ],
  anthropic: [
    { name: 'Claude 3.7 Sonnet', value: 'claude-3.7-sonnet' },
    { name: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
    { name: 'Claude 3 Opus', value: 'claude-3-opus' },
    { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
    { name: 'Claude 3.5 Haiku', value: 'claude-3.5-haiku' },
    { name: 'Claude 3 Haiku', value: 'claude-3-haiku' },
  ],
  google: [
    { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
    { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
    { name: 'Gemini 1.0 Pro', value: 'gemini-1.0-pro' },
    { name: 'Gemini 1.0 Flash', value: 'gemini-1.0-flash' }
  ]
};
