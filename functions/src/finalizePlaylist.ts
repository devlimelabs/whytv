import * as functionsV2 from 'firebase-functions/v2';
import {firestore} from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {genkit, z} from 'genkit';
import {googleAI, gemini20Flash} from '@genkit-ai/googleai';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Genkit with Google AI plugin
const ai = genkit({
  plugins: [googleAI()],
});

// Define a flow for ordering playlist videos
const orderPlaylistVideosFlow = ai.defineFlow({
  name: 'orderChannelPlaylist',
  inputSchema: z.object({
    channelDescription: z.string(),
    channelName: z.string(),
    videos: z.array(z.object({
      youtubeId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
    })),
  }),
  outputSchema: z.object({
    orderedVideos: z.array(z.object({
      youtubeId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
    })),
  }),
}, async (input) => {
  logger.info('Starting playlist ordering process', {
    channelName: input.channelName,
    channelDescription: input.channelDescription,
    videosCount: input.videos.length,
  });

  // Split the prompt to avoid max-len error
  const promptIntro = 'whytv.ai provides a tv like experience for users to watch endless videos, powered by youtube. ' +
    'You are creating a cohesive playlist for a whytv.ai channel with the following details:\n' +
    `Channel Name: "${input.channelName}"\n` +
    `Channel Description: "${input.channelDescription}"`;

  const promptGuidelines = 'Playlist Creation Guidelines:\n' +
    '1. Order videos to create a compelling, engaging narrative\n' +
    '2. Consider thematic progression and viewer retention\n' +
    '3. Ensure smooth transitions between videos\n' +
    '4. Highlight the channel\'s core message and theme\n' +
    '5. Optimize for viewer interest and watch time';

  const promptOutput = 'Return a JSON object with a field \'orderedVideos\' containing an array of video objects in the recommended playlist order.\n' +
    'Each video object should include \'youtubeId\', and optionally \'title\' and \'description\'.';

  const prompt = `${promptIntro}

Available Videos: ${JSON.stringify(input.videos)}

${promptGuidelines}

${promptOutput}`;

  const result = await ai.generate({
    model: gemini20Flash,
    prompt: prompt,
    config: {
      temperature: 0.6,
    },
    output: {
      schema: z.object({
        orderedVideos: z.array(z.object({
          youtubeId: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
        })),
      }),
    },
  });

  // Parse the result, handling potential JSON parsing errors
  try {
    // First try to use the structured output if available
    if (result.output?.orderedVideos && Array.isArray(result.output.orderedVideos)) {
      logger.info('Playlist ordering completed via structured output', {
        orderedVideosCount: result.output.orderedVideos.length,
        orderedVideoIds: result.output.orderedVideos.map((v: {youtubeId: string}) => v.youtubeId),
      });

      return {orderedVideos: result.output.orderedVideos};
    }

    // Fall back to parsing JSON from text
    const parsedResult = JSON.parse(result.text.trim());
    const orderedVideos = parsedResult.orderedVideos || parsedResult.videos;

    logger.info('Playlist ordering completed via JSON parsing', {
      orderedVideosCount: orderedVideos.length,
      orderedVideoIds: orderedVideos.map((v: {youtubeId: string}) => v.youtubeId),
    });

    return {orderedVideos};
  } catch (error) {
    // Fallback parsing strategy
    const videoIds = result.text.trim()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const orderedVideos = videoIds.map((youtubeId) => ({youtubeId}));

    logger.info('Playlist ordering completed by text splitting', {
      orderedVideosCount: orderedVideos.length,
      orderedVideoIds: orderedVideos.map((v) => v.youtubeId),
    });

    return {orderedVideos};
  }
});

export const finalizeChannelPlaylist = firestore.onDocumentUpdated('channels/{channelId}',
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const channelRef = event.data?.after.ref;

    // Validate inputs
    if (!beforeData || !afterData || !channelRef) {
      logger.error('Missing channel data or reference', {
        beforeDataExists: !!beforeData,
        afterDataExists: !!afterData,
        channelRefExists: !!channelRef,
      });
      return null;
    }

    // Only process when the channel status changes to "videos_selected"
    if (beforeData.status === afterData.status || afterData.status !== 'videos_selected') {
      logger.info('Skipping playlist finalization: channel status not changed to \'videos_selected\'', {
        beforeStatus: beforeData.status,
        afterStatus: afterData.status,
      });
      return null;
    }

    try {
      // Fetch channel data (we already have it in afterData, but keeping this for consistency)
      const channelData = afterData;

      // Fetch all channel videos
      const videosSnapshot = await channelRef.collection('videos').get();
      const videos = videosSnapshot.docs.map((doc) => ({
        youtubeId: doc.id,
        ...doc.data(),
      }));

      if (videos.length === 0) {
        logger.error('No videos found for channel', {
          channelId: event.params.channelId,
        });
        await channelRef.update({
          status: 'error',
          error: 'No videos found for channel',
        });
        return null;
      }

      logger.info('Preparing playlist ordering', {
        channelId: event.params.channelId,
        videosCount: videos.length,
      });

      // Order videos using AI
      const {orderedVideos} = await orderPlaylistVideosFlow({
        channelDescription: channelData.description,
        channelName: channelData.channelName,
        videos: videos,
      });

      // Update the order property of each video in the videos subcollection
      const batch = admin.firestore().batch();

      // Create a map of youtubeId to order index for quick lookup
      const orderMap = new Map();
      orderedVideos.forEach((video, index) => {
        orderMap.set(video.youtubeId, index);
      });

      // Update each video document with its order
      for (const doc of videosSnapshot.docs) {
        const youtubeId = doc.id;
        const orderIndex = orderMap.has(youtubeId) ? orderMap.get(youtubeId) : videos.length; // Default to end if not found
        batch.update(doc.ref, {order: orderIndex});
      }

      // Commit all updates in a single batch
      await batch.commit();

      logger.info('Video order updated successfully', {
        channelId: event.params.channelId,
        videosCount: orderedVideos.length,
      });

      // Update channel status
      await channelRef.update({
        status: 'available',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('Channel playlist finalization completed', {
        channelId: event.params.channelId,
        videosCount: orderedVideos.length,
      });

      return {
        success: true,
        videosCount: orderedVideos.length,
      };
    } catch (error) {
      logger.error('Playlist finalization error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        channelId: event.params.channelId,
      });

      // Update channel status to error
      await channelRef.update({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new functionsV2.https.HttpsError('internal', 'Failed to finalize playlist');
    }
  });
