import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from '@angular/fire/firestore';
import { Channel, Video } from '../shared/types/video.types';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';

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
        id: videoDoc.id,
        title: videoData.title,
        channelName: videoData.channelTitle || '',
        thumbnail: get(videoData, 'thumbnails.high.url') || get(videoData, 'thumbnails.medium.url') || get(videoData, 'thumbnails.default.url') || '',
        videoUrl: '',
        youtubeId: videoData.youtubeId,
        order: videoData.order || 999
      };

      videos.push(video);
    });

    // Sort videos by order if available
    return sortBy(videos, [(video) => video.order || 999]);
  }
}
