import {firestore} from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {genkit, z} from 'genkit';
import {googleAI, gemini15Flash, gemini15Pro, gemini10Flash} from '@genkit-ai/googleai';
import {anthropicAI} from 'genkitx-anthropic';
import {openAI} from 'genkitx-openai';

// Initialize Genkit with all AI plugins
const ai = genkit({
  plugins: [
    googleAI(),
    anthropicAI(),
    openAI(),
  ],
});

// Model constants for different providers
const models = {
  // OpenAI models
  'gpt-4o': {provider: 'openai', id: 'openai/gpt-4o'},
  'gpt-4-turbo': {provider: 'openai', id: 'openai/gpt-4-turbo'},
  'gpt-3.5-turbo': {provider: 'openai', id: 'openai/gpt-3.5-turbo'},
  
  // Anthropic models
  'claude-3-opus': {provider: 'anthropic', id: 'anthropic/claude-3-opus'},
  'claude-3-sonnet': {provider: 'anthropic', id: 'anthropic/claude-3-sonnet'},
  'claude-3-haiku': {provider: 'anthropic', id: 'anthropic/claude-3-haiku'},
  
  // Google models
  'gemini-1.5-pro': {provider: 'google', id: gemini15Pro},
  'gemini-1.5-flash': {provider: 'google', id: gemini15Flash},
  'gemini-1.0-pro': {provider: 'google', id: 'gemini-1.0-pro-latest'},
  'gemini-1.0-flash': {provider: 'google', id: gemini10Flash},
};

/**
 * Helper function to get the model object based on provider and model ID
 * Falls back to OpenAI GPT-4o if the specified model is not found
 */
function getModelById(modelId: string) {
  if (models[modelId]) {
    return models[modelId];
  }
  
  // Default to OpenAI GPT-4o
  logger.warn('Specified model not found, falling back to GPT-4o', {
    requestedModel: modelId,
    fallbackModel: 'gpt-4o',
  });
  
  return models['gpt-4o'];
}

// Define a flow for generating a channel name
const generateChannelNameFlow = ai.defineFlow({
  name: 'generateChannelName',
  inputSchema: z.object({
    description: z.string(),
    provider: z.string().optional(),
    model: z.string().optional(),
  }),
  outputSchema: z.string(),
}, async (input) => {
  const { description, provider = 'openai', model = 'gpt-4o' } = input;
  const modelInfo = getModelById(model);
  
  logger.info(`Generating channel name for description with ${provider}/${model}`, {
    description,
    provider,
    model,
    flowName: 'generateChannelName',
  });

  const prompt = `Generate a unique, creative YouTube channel name based on this description: "${description}".
  The name should be catchy, memorable, and directly relate to the content description.`;

  const result = await ai.generate({
    model: modelInfo.id,
    prompt: prompt,
    output: {
      schema: z.object({
        channelName: z.string(),
      }),
    },
    config: {
      temperature: 0.7,
    },
  });

  // Extract the channel name from the result
  const channelName = result.output?.channelName || result.text.trim();

  logger.info('Generated channel name', {
    generatedName: channelName,
    flowName: 'generateChannelName',
  });

  return channelName;
});

export const onChannelCreate = firestore.onDocumentCreated('channels/{channelId}',
  async (event) => {
    const channelData = event.data?.data();
    if (!channelData) {
      logger.error('No channel data found during channel creation', {
        eventData: event.data,
        eventId: event.id,
      });
      return null;
    }

    const description = channelData.description;

    // Validate that we have a description field to work with
    if (!description || typeof description !== 'string' || description.trim() === '') {
      logger.error('Missing or invalid description in channel document', {
        channelId: event.params.channelId,
        description,
      });

      // Delete invalid channel document to prevent empty documents
      if (event.data) {
        try {
          await event.data.ref.delete();
          logger.info('Deleted invalid channel document', {
            channelId: event.params.channelId,
          });
        } catch (deleteError) {
          logger.error('Failed to delete invalid channel document', {
            channelId: event.params.channelId,
            error: deleteError instanceof Error ? deleteError.message : 'Unknown error',
          });
        }
      }

      return null;
    }

    logger.info('Starting channel creation process', {
      channelId: event.params.channelId,
      description,
    });

    try {
      // Get the provider and model from the channel data
      const provider = channelData.provider || 'openai';
      const model = channelData.model || 'gpt-4o';
      
      // Generate channel name using AI with specified provider and model
      const channelName = await generateChannelNameFlow({
        description,
        provider,
        model,
      });

      // Validate channel name result
      if (!channelName || typeof channelName !== 'string' || channelName.trim() === '') {
        logger.error('Failed to generate valid channel name', {
          channelId: event.params.channelId,
          generatedName: channelName,
        });

        // Delete the channel document to prevent empty documents
        if (event.data) {
          await event.data.ref.delete();
          logger.info('Deleted channel document due to name generation failure', {
            channelId: event.params.channelId,
          });
        }

        return null;
      }

      // Increment channel number atomically
      const counterRef = admin.firestore().doc('counters/channels');

      return admin.firestore().runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        const nextChannelNumber = counterDoc.exists ?
          (counterDoc.data()?.nextChannelNumber || 1) :
          1;

        logger.info('Generating next channel number', {
          currentNumber: nextChannelNumber,
          counterDocExists: counterDoc.exists,
        });

        // Update counter
        transaction.set(counterRef, {
          nextChannelNumber: nextChannelNumber + 1,
        }, {merge: true});

        // Update channel document
        if (event.data) {
          transaction.update(event.data.ref, {
            channelName,
            channelNumber: nextChannelNumber,
            status: 'new',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });

          logger.info('Channel document updated successfully', {
            channelName,
            channelNumber: nextChannelNumber,
            status: 'new',
          });
        } else {
          throw new Error('Event data reference is missing');
        }

        return {channelName, channelNumber: nextChannelNumber};
      });
    } catch (error) {
      logger.error('Channel creation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        description,
        channelId: event.params.channelId,
      });

      // Delete the channel document to prevent orphaned documents
      if (event.data) {
        try {
          await event.data.ref.delete();
          logger.info('Deleted channel document due to creation error', {
            channelId: event.params.channelId,
          });
        } catch (deleteError) {
          logger.error('Failed to delete channel document after error', {
            channelId: event.params.channelId,
            error: deleteError instanceof Error ? deleteError.message : 'Unknown error',
          });
        }
      }

      throw new Error('Failed to create channel');
    }
  });
