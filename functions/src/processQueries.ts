/* eslint-disable camelcase,require-jsdoc,@typescript-eslint/no-explicit-any */
import * as functionsV2 from 'firebase-functions/v2';
import {firestore} from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {youtube_v3, google} from 'googleapis';

// Initialize YouTube Data API client
const youtubeClient = google.youtube('v3');

export const processYouTubeQuery = firestore.onDocumentCreated('channels/{channelId}/queries/{queryId}',
  async (event) => {
    // Retrieve the YouTube API key from Firebase Functions configuration
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      logger.error('YouTube API key is not configured', {
        channelId: event.params.channelId,
        queryId: event.params.queryId,
      });
      return null;
    }

    const queryData = event.data?.data();
    const queryRef = event.data?.ref;
    const channelRef = queryRef?.parent.parent;

    if (!queryData || !queryRef || !channelRef) {
      logger.error('Missing query or channel reference', {
        queryDataExists: !!queryData,
        queryRefExists: !!queryRef,
        channelRefExists: !!channelRef,
      });
      return null;
    }

    const queryText = queryData.queryText;

    logger.info('Starting YouTube query processing', {
      channelId: event.params.channelId,
      queryId: event.params.queryId,
      queryText,
    });

    try {
      // Update query status to 'processing'
      await queryRef.update({status: 'searching'});

      logger.info('Query status updated to processing', {
        channelId: event.params.channelId,
        queryId: event.params.queryId,
      });

      // Perform YouTube search
      const searchResults = await searchYouTubeVideos(queryText, youtubeApiKey);


      // Batch write search results
      const batch = admin.firestore().batch();

      searchResults.forEach((video) => {
        const resultRef = channelRef.collection('videos').doc(video.youtubeId);
        batch.set(resultRef, video, {merge: true});
      });


      // Commit batch write
      await batch.commit();

      logger.info('Search results batch write completed', {
        channelId: event.params.channelId,
        queryId: event.params.queryId,
        resultsCount: searchResults.length,
      });


      // Update query status to 'ready'
      await queryRef.update({
        status: 'completed',
        resultsCount: searchResults.length,
      });

      logger.info('YouTube query processing completed successfully', {
        channelId: event.params.channelId,
        queryId: event.params.queryId,
        queryText,
        resultsCount: searchResults.length,
      });


      return {
        success: true,
        queryText,
        resultsCount: searchResults.length,
      };
    } catch (error) {
      logger.error('YouTube query processing error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        channelId: event.params.channelId,
        queryId: event.params.queryId,
        queryText,
      });

      // Update query status to 'error' if processing fails
      if (queryRef) {
        await queryRef.update({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to process YouTube query');
    }
  });


// Helper function to search YouTube videos
async function searchYouTubeVideos(
  query: string,
  apiKey: string,
  maxResults = 10
): Promise<Array<{
  youtubeId: string;
  title?: string;
  description?: string;
  channelTitle?: string;
  publishedAt?: string;
  thumbnails?: youtube_v3.Schema$ThumbnailDetails;
}>> {
  logger.info(`Searching YouTube videos for query: ${query}`, {
    query,
    maxResults,
  });

  try {
    const response = await youtubeClient.search.list({
      key: apiKey,
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults: maxResults,
      videoEmbeddable: true,
    } as any);

    const searchResponse = response.data as youtube_v3.Schema$SearchListResponse;
    const results = (searchResponse.items || [])
      .map((item: any): {
        youtubeId: string;
        title?: string;
        description?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: youtube_v3.Schema$ThumbnailDetails;
      } => ({
        youtubeId: item.id?.videoId ?? '',
        title: item.snippet?.title ?? undefined,
        description: item.snippet?.description ?? undefined,
        channelTitle: item.snippet?.channelTitle ?? undefined,
        publishedAt: item.snippet?.publishedAt ?? undefined,
        thumbnails: item.snippet?.thumbnails,
      }))
      .filter((video): video is {
        youtubeId: string;
        title?: string;
        description?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: youtube_v3.Schema$ThumbnailDetails;
      } => video.youtubeId !== '');

    logger.info('YouTube video search completed', {
      resultsCount: results.length,
      query,
    });

    return results;
  } catch (error) {
    logger.error(`YouTube search error for query "${query}"`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      query,
    });
    return [];
  }
}
