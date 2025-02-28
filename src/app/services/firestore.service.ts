import { inject, Injectable } from '@angular/core';
import { collection, doc, Firestore, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';

import { Channel, Video } from '../states/video-player.state';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);

  /**
   * Fetches all channels with 'live' status
   */
  async getChannels(): Promise<Channel[]> {
    try {
      const channelsRef = collection(this.firestore, 'channels');
      const channelsQuery = query(channelsRef, where('status', '==', 'live'));
      const channelsSnapshot = await getDocs(channelsQuery);

      const channels = channelsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const channelsWithVideos = await Promise.all(
        channels.map(async (channel: any) => {
          const videos = await this.getChannelVideos(channel.id);
          return {
            id: channel.id,
            name: channel.channelName,
            description: channel.description,
            videos: videos
          } as Channel;
        })
      );

      // Filter out channels with no videos
      return channelsWithVideos.filter(channel => channel.videos.length > 0);
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error;
    }
  }

  /**
   * Fetches a single channel by ID
   */
  async getChannel(channelId: string): Promise<Channel | null> {
    try {
      const channelRef = doc(this.firestore, `channels/${channelId}`);
      const channelDoc = await getDoc(channelRef);

      if (!channelDoc.exists()) return null;

      const channelData = channelDoc.data() as any;

      // Only return channel if it has 'live' status
      if (channelData.status !== 'live') return null;

      const videos = await this.getChannelVideos(channelId);

      return {
        id: channelDoc.id,
        name: channelData.channelName,
        description: channelData.description,
        videos: videos
      } as Channel;
    } catch (error) {
      console.error(`Error fetching channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches videos for a specific channel
   */
  private async getChannelVideos(channelId: string): Promise<Video[]> {
    const videosRef = collection(this.firestore, `channels/${channelId}/videos`);
    const videosSnapshot = await getDocs(videosRef);

    const videos: Video[] = [];

    videosSnapshot.forEach((videoDoc) => {
      const videoData = videoDoc.data() as any;

      // Only include videos that aren't deleted and have a YouTube ID
      if (videoData.deleted || !videoData.youtubeId) return;

      const video: Video = {
        title: videoData.title || 'Untitled Video',
        description: videoData.description || '',
        channelTitle: videoData.channelTitle || '',
        publishedAt: videoData.publishedAt || new Date().toISOString(),
        youtubeId: videoData.youtubeId,
        deleted: videoData.deleted || false,
        order: videoData.order || 999,
        thumbnails: {
          default: {
            url: get(videoData, 'thumbnails.default.url', ''),
            width: get(videoData, 'thumbnails.default.width', 120),
            height: get(videoData, 'thumbnails.default.height', 90)
          },
          medium: {
            url: get(videoData, 'thumbnails.medium.url', ''),
            width: get(videoData, 'thumbnails.medium.width', 320),
            height: get(videoData, 'thumbnails.medium.height', 180)
          },
          high: {
            url: get(videoData, 'thumbnails.high.url', ''),
            width: get(videoData, 'thumbnails.high.width', 480),
            height: get(videoData, 'thumbnails.high.height', 360)
          }
        },
        lastUpdated: videoData.lastUpdated || { "__time__": new Date().toISOString() }
      };

      videos.push(video);
    });

    // Sort videos by order if available
    return sortBy(videos, [(video) => video.order || 999]);
  }
}
