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

// Define a flow for selecting videos
const selectVideosFlow = ai.defineFlow({
  name: 'selectChannelVideos',
  inputSchema: z.object({
    channelDescription: z.string(),
    channelName: z.string(),
    currentVideos: z.array(z.object({
      youtubeId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      // Include all video properties
      deleted: z.boolean().optional(),
    })).optional(),
  }),
  outputSchema: z.object({
    selectedVideoIds: z.array(z.string()),
  }),
}, async (input) => {
  logger.info('Starting video selection process', {
    channelName: input.channelName,
    channelDescription: input.channelDescription,
    currentVideosCount: input.currentVideos?.length || 0,
  });

  const prompt = `You are selecting videos for a YouTube Playlist with the following details:
Channel Name: "${input.channelName}"
Channel Description: "${input.channelDescription}"

Selection Criteria:
1. Choose videos that align closely with the channel's theme and description
2. Ensure diversity in content while maintaining thematic consistency
3. Avoid duplicates with existing channel videos
4. Select videos that are relevant to the channel's theme and description
5. Prioritize high-quality, engaging content

IMPORTANT: Return ONLY a JSON object with a field 'selectedVideoIds' containing an array of YouTube ID strings.
Do not include any other information in the response, just the IDs of videos that should be kept.

Here are the current videos in the playlist (review all properties to make your decision):
${input.currentVideos ? JSON.stringify(input.currentVideos) : 'None'}`;

  const result = await ai.generate({
    model: gemini20Flash,
    prompt: prompt,
    config: {
      temperature: 0.7,
    },
    output: {
      schema: z.object({
        selectedVideoIds: z.array(z.string()),
      }),
    },
  });

  // Parse the result, handling potential JSON parsing errors
  try {
    // First try to use the structured output if available
    if (result.output?.selectedVideoIds && Array.isArray(result.output.selectedVideoIds)) {
      logger.info('Video selection completed via structured output', {
        selectedVideoIdsCount: result.output.selectedVideoIds.length,
        selectedVideoIds: result.output.selectedVideoIds,
      });

      return {selectedVideoIds: result.output.selectedVideoIds};
    }

    // Fall back to parsing JSON from text
    const parsedResult = JSON.parse(result.text.trim());
    const selectedVideoIds = parsedResult.selectedVideoIds || parsedResult.videoIds || [];

    logger.info('Video selection completed via JSON parsing', {
      selectedVideoIdsCount: selectedVideoIds.length,
      selectedVideoIds: selectedVideoIds,
    });

    return {selectedVideoIds};
  } catch (error) {
    // Fallback parsing strategy
    const videoIds = result.text.trim()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    logger.info('Video selection completed by text splitting', {
      selectedVideoIdsCount: videoIds.length,
      selectedVideoIds: videoIds,
    });

    return {selectedVideoIds: videoIds};
  }
});

export const selectVideosForChannel = firestore.onDocumentUpdated('channels/{channelId}',
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Validate inputs
    if (!beforeData || !afterData ) {
      logger.error('Missing channel reference or data', {
        beforeDataExists: !!beforeData,
        afterDataExists: !!afterData,
      });
      return null;
    }

    // Only process when channel status changes to 'select_videos'
    if (beforeData.status !== 'select_videos' && afterData.status === 'select_videos') {
      logger.info('Channel status changed to \'select_videos\', starting video selection', {
        channelId: event.params.channelId,
        beforeStatus: beforeData.status,
        afterStatus: afterData.status,
      });
    } else {
      logger.info('Skipping video selection: channel status not changed to \'select_videos\'', {
        beforeStatus: beforeData.status,
        afterStatus: afterData.status,
      });
      return null;
    }

    const channelRef = admin.firestore().collection('channels').doc(event.params.channelId);

    try {
      // Get the channel data & ref
      const channelData = afterData;

      // Fetch current channel videos
      const currentVideosSnapshot = await channelRef.collection('videos').get();
      const currentVideos = currentVideosSnapshot.docs.map((doc) => ({
        youtubeId: doc.id,
        ...doc.data(),
      }));

      logger.info('Preparing video selection', {
        channelId: event.params.channelId,
        currentVideosCount: currentVideos.length,
      });

      // Select videos using AI
      const {selectedVideoIds} = await selectVideosFlow({
        channelDescription: channelData.description,
        channelName: channelData.channelName,
        currentVideos: currentVideos,
      });

      // Batch write to update video statuses
      const batch = admin.firestore().batch();

      // Create a set of selected video IDs for faster lookup
      const selectedVideoIdSet = new Set(selectedVideoIds);

      // Process all current videos
      currentVideos.forEach((video) => {
        const videoRef = channelRef.collection('videos').doc(video.youtubeId);

        if (selectedVideoIdSet.has(video.youtubeId)) {
          // Video is selected - ensure it's not marked as deleted
          batch.update(videoRef, {
            deleted: false,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          // Video is not selected - mark as deleted
          batch.update(videoRef, {
            deleted: true,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      // Commit batch write
      await batch.commit();

      logger.info('Video status updates completed', {
        channelId: event.params.channelId,
        selectedVideoIdsCount: selectedVideoIds.length,
        totalVideosCount: currentVideos.length,
        deletedVideosCount: currentVideos.length - selectedVideoIds.length,
      });

      // Update channel status
      await channelRef.update({
        status: 'videos_selected',
        selectedVideosCount: selectedVideoIds.length,
        deletedVideosCount: currentVideos.length - selectedVideoIds.length,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('Video selection process completed successfully', {
        channelId: event.params.channelId,
        selectedVideosCount: selectedVideoIds.length,
        deletedVideosCount: currentVideos.length - selectedVideoIds.length,
      });

      return {
        success: true,
        selectedVideosCount: selectedVideoIds.length,
        deletedVideosCount: currentVideos.length - selectedVideoIds.length,
      };
    } catch (error) {
      logger.error('Video selection error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        channelId: event.params.channelId,
      });

      // Update channel status to error
      await channelRef.update({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw new functionsV2.https.HttpsError('internal', 'Failed to select videos');
    }
  });
