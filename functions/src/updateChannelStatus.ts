import * as functionsV2 from 'firebase-functions/v2';
import {firestore} from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import * as _ from 'lodash';

/**
 * This function triggers when a query document is updated to 'completed' status.
 * It checks if all queries for a channel are completed, and if so, updates the channel status.
 */
export const updateChannelStatus = firestore.onDocumentUpdated(
  'channels/{channelId}/queries/{queryId}',
  async (event) => {
    const afterData = event.data?.after.data();
    const beforeData = event.data?.before.data();

    // Only proceed if the query status changed to 'completed'
    if (!afterData || !beforeData ||
        beforeData.status === afterData.status ||
        afterData.status !== 'completed') {
      return null;
    }

    const {channelId} = event.params;
    logger.info('Query completed, checking channel status', {
      channelId,
      queryId: event.params.queryId,
    });

    try {
      // Get the channel document
      const channelRef = admin.firestore().collection('channels').doc(channelId);
      const channelDoc = await channelRef.get();

      if (!channelDoc.exists) {
        logger.error('Channel document not found', {channelId});
        return null;
      }

      // Get all queries for this channel
      const queriesSnapshot = await channelRef.collection('queries').get();

      // Check if all queries are completed
      const allQueries = queriesSnapshot.docs.map((doc) => doc.data());
      const allQueriesCompleted = _.every(allQueries, (query) => query.status === 'completed');

      if (!allQueriesCompleted) {
        logger.info('Not all queries are completed yet', {
          channelId,
          completedQueries: _.filter(allQueries, (query) => query.status === 'completed').length,
          totalQueries: allQueries.length,
        });
        return null;
      }

      logger.info('All queries completed, updating channel status', {
        channelId,
        totalQueries: allQueries.length,
      });

      // Get all videos for this channel
      const videosSnapshot = await channelRef.collection('videos').get();
      const totalVideos = videosSnapshot.size;

      // Update channel status
      await channelRef.update({
        status: 'select_videos',
        queriesCompleted: allQueries.length,
        totalVideosFound: totalVideos,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('Channel status updated to select_videos', {
        channelId,
        totalQueries: allQueries.length,
        totalVideos,
      });

      return {
        success: true,
        channelId,
        queriesCompleted: allQueries.length,
        totalVideos,
      };
    } catch (error) {
      logger.error('Error updating channel status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        channelId,
      });

      throw new functionsV2.https.HttpsError(
        'internal',
        'Failed to update channel status'
      );
    }
  }
);
