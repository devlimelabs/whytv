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

// Define a flow for generating YouTube search queries
const generateQueriesFlow = ai.defineFlow({
  name: 'generateYouTubeQueries',
  inputSchema: z.object({
    description: z.string(),
    channelName: z.string(),
  }),
  outputSchema: z.object({
    queries: z.array(z.string()),
  }),
}, async (input) => {
  logger.info('Starting YouTube query generation', {
    channelName: input.channelName,
    description: input.description,
  });

  const prompt = `
whytv.ai provides a tv like experience for users to watch endless videos, powered by youtube. You are creating queries to populate the channel's playlist.
Generate 15-20 diverse, highly specific YouTube search queries based on this channel description:

Channel Name: "${input.channelName}"
Description: "${input.description}"

Guidelines:
- Queries should cover different aspects of the channel's theme
- Ensure queries are specific and likely to return relevant video results
- Avoid overly broad or generic queries
- Include variations in search terms
- DO NOT include the channel name in the queries

Return a JSON array of search queries.`;

  const result = await ai.generate({
    model: gemini20Flash,
    prompt: prompt,
    config: {
      temperature: 0.7,
    },
    output: {
      schema: z.object({
        queries: z.array(z.string()),
      }),
    },
  });

  // Parse the result, handling potential JSON parsing errors
  try {
    // First try to use the structured output if available
    if (result.output?.queries && Array.isArray(result.output.queries)) {
      logger.info('Successfully generated queries via structured output', {
        queriesCount: result.output.queries.length,
        queries: result.output.queries,
      });

      return {queries: result.output.queries};
    }

    // Fall back to parsing JSON from text
    const queries = JSON.parse(result.text.trim());

    logger.info('Successfully generated queries via JSON parsing', {
      queriesCount: queries.length,
      queries,
    });

    return {queries};
  } catch (error) {
    // Fallback to splitting by newline if JSON parsing fails
    const queries = result.text.trim().split('\n')
      .map((q) => q.replace(/^["']|["']$/g, '').trim())
      .filter((q) => q.length > 0);

    logger.info('Generated queries by splitting text', {
      queriesCount: queries.length,
      queries,
    });

    return {queries};
  }
});

export const generateChannelQueries = firestore.onDocumentUpdated('channels/{channelId}',
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const channelRef = event.data?.after.ref;

    // Validate inputs
    if (!beforeData || !afterData || !channelRef) {
      logger.error('Missing channel data or reference', {
        beforeData,
        afterData,
        channelRefExists: !!channelRef,
      });
      return null;
    }

    // Only process if the channel status changes to 'new'
    if (afterData.status !== 'new') {
      logger.info('Skipping query generation: status not \'new\'', {
        beforeStatus: beforeData.status,
        afterStatus: afterData.status,
      });
      return null;
    }

    try {
      // Update channel status to 'processing queries'
      await channelRef.update({status: 'processing queries'});

      logger.info('Starting query generation process', {
        channelId: event.params.channelId,
        channelName: afterData.channelName,
      });

      // Generate queries using AI
      const {queries} = await generateQueriesFlow({
        description: afterData.description,
        channelName: afterData.channelName,
      });

      // Create a batch write for queries
      const batch = admin.firestore().batch();

      queries.forEach((queryText) => {
        const queryRef = channelRef.collection('queries').doc();
        batch.set(queryRef, {
          queryText,
          status: 'new',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Commit the batch
      await batch.commit();

      logger.info('Queries batch write completed', {
        queriesCount: queries.length,
      });

      // Update channel status to 'queries ready'
      await channelRef.update({
        status: 'queries ready',
        queriesCount: queries.length,
      });

      logger.info('Channel queries generation completed successfully', {
        channelId: event.params.channelId,
        queriesGenerated: queries.length,
      });

      return {success: true, queriesGenerated: queries.length};
    } catch (error) {
      logger.error('Query generation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        channelId: event.params.channelId,
      });

      // Revert status if something goes wrong
      if (channelRef) {
        await channelRef.update({status: 'new'});
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to generate queries');
    }
  });
