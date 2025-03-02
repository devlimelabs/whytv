import {scheduler} from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

/**
 * This scheduled function deletes empty or invalid channel documents
 * It runs periodically to clean up any orphaned or invalid channels
 */
export const cleanupEmptyChannels = scheduler.onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-central1', // or your preferred region
    timeZone: 'America/Los_Angeles', // adjust to your preferred timezone
    retryCount: 3,
    maxRetrySeconds: 60,
  },
  async () => {
    logger.info('Starting cleanup of empty channel documents');

    try {
      // Query for all channels
      const channelsRef = admin.firestore().collection('channels');
      const snapshot = await channelsRef.get();

      if (snapshot.empty) {
        logger.info('No channel documents found to check');
        return;
      }

      // Track documents to delete
      const invalidChannels = [];

      // Check each channel document for validity
      for (const doc of snapshot.docs) {
        const channelData = doc.data();
        const channelId = doc.id;

        // Check for missing required fields
        const isMissingDescription = !channelData.description ||
                                     typeof channelData.description !== 'string' ||
                                     channelData.description.trim() === '';

        const isMissingChannelName = !channelData.channelName ||
                                     typeof channelData.channelName !== 'string' ||
                                     channelData.channelName.trim() === '';

        const isMissingStatus = !channelData.status ||
                               typeof channelData.status !== 'string' ||
                               channelData.status.trim() === '';

        // Check if the document is too old and still in pending or error state
        const isStuckInPending = channelData.status === 'pending' && channelData.createdAt;
        let isOldPending = false;

        if (isStuckInPending && typeof channelData.createdAt === 'string') {
          const createdDate = new Date(channelData.createdAt);
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);

          isOldPending = createdDate < oneDayAgo;
        }

        // If the channel is invalid or stuck in pending for too long, mark for deletion
        if (isMissingDescription || isMissingChannelName || isMissingStatus || isOldPending) {
          invalidChannels.push({
            id: channelId,
            isMissingDescription,
            isMissingChannelName,
            isMissingStatus,
            isOldPending,
            data: channelData,
          });
        }
      }

      // Log the invalid channels found
      logger.info('Invalid channel documents found', {
        count: invalidChannels.length,
        channelIds: invalidChannels.map((channel) => channel.id),
      });

      // Delete invalid channels
      const batch = admin.firestore().batch();
      const batchSize = 500; // Firestore batch limit
      let batchCount = 0;
      let deleteCount = 0;

      for (let i = 0; i < invalidChannels.length; i++) {
        const channel = invalidChannels[i];
        const docRef = channelsRef.doc(channel.id);

        batch.delete(docRef);
        deleteCount++;
        batchCount++;

        // Commit batch if we reach the batch limit
        if (batchCount >= batchSize) {
          await batch.commit();
          logger.info(`Committed batch delete of ${batchCount} invalid channels`);
          batchCount = 0;
        }
      }

      // Commit any remaining deletes
      if (batchCount > 0) {
        await batch.commit();
        logger.info(`Committed final batch delete of ${batchCount} invalid channels`);
      }

      logger.info('Cleanup completed successfully', {
        totalDeleted: deleteCount,
        totalInvalid: invalidChannels.length,
      });

      // Function must not return a value
    } catch (error) {
      logger.error('Error during channel cleanup', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Rethrow error for the scheduler to handle retries
      throw error;
    }
  }
);
