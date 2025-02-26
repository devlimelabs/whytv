import * as functionsV2 from 'firebase-functions/v2';
import {firestore} from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {genkit, z} from 'genkit';
import {googleAI, gemini20Flash} from '@genkit-ai/googleai';

// Initialize Genkit with Google AI plugin
const ai = genkit({
  plugins: [googleAI()],
});

// Define a flow for generating a channel name
const generateChannelNameFlow = ai.defineFlow({
  name: 'generateChannelName',
  inputSchema: z.string(),
  outputSchema: z.string(),
}, async (description) => {
  logger.info(`Generating channel name for description: ${description}`, {
    description,
    flowName: 'generateChannelName',
  });

  const prompt = `Generate a unique, creative YouTube channel name based on this description: "${description}".
  The name should be catchy, memorable, and directly relate to the content description.`;

  const result = await ai.generate({
    model: gemini20Flash,
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

    logger.info('Starting channel creation process', {
      channelId: event.params.channelId,
      description,
    });

    try {
      // Generate channel name using AI
      const channelName = await generateChannelNameFlow(description);

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
          });

          logger.info('Channel document updated successfully', {
            channelName,
            channelNumber: nextChannelNumber,
            status: 'new',
          });
        }

        return {channelName, channelNumber: nextChannelNumber};
      });
    } catch (error) {
      logger.error('Channel creation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        description,
      });
      throw new functionsV2.https.HttpsError('internal', 'Failed to create channel');
    }
  });
