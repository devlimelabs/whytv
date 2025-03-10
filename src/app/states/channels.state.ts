import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { FirestoreService } from '../services/firestore.service';

import type { Channel } from './video-player.state';

/**
 * Interface for the channels state
 */
export interface ChannelsState {
  channels: Channel[];
  currentChannel: Channel | null;
  currentVideoIndex: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * The signal store for managing channels
 */
export const ChannelsState = signalStore(
  { providedIn: 'root', protectedState: false },
  withState<ChannelsState>({
    channels: [],
    currentChannel: null,
    currentVideoIndex: 0,
    isLoading: true,
    error: null
  }),
  withComputed((state) => {
    /**
     * Get the current video based on the current channel and video index
     */
    const currentVideo = computed(() => {
      const channel = state.currentChannel();
      const index = state.currentVideoIndex();

      if (!channel || !channel.videos || !channel.videos.length) {
        return null;
      }

      return channel.videos[index];
    });


    return {
      currentVideo,
      /**
       * Get the total number of channels
       */
      channelCount: computed(() => state.channels().length),

      /**
       * Get the total number of videos in the current channel
       */
      currentChannelVideoCount: computed(() => {
        const channel = state.currentChannel();
        if (!channel || !channel.videos) {
          return 0;
        }
        return channel.videos.length;
      }),

      /**
       * Get whether there is a next video in the current channel
       */
      hasNextVideo: computed(() => {
        const channel = state.currentChannel();
        const count = channel?.videos?.length || 0;
        return count > 0 && state.currentVideoIndex() < count - 1;
      }),

      /**
       * Get whether there is a previous video in the current channel
       */
      hasPreviousVideo: computed(() => {
        return state.currentVideoIndex() > 0;
      }),

      currentVideoId: computed(() => currentVideo()?.youtubeId ?? 'dQw4w9WgXcQ')
    };
  }),
  withMethods((store, firestoreService = inject(FirestoreService), router = inject(Router)) => ({



    /**
     * Set the current video index
     */
    setCurrentVideoIndex(index: number) {
      const channel = store.currentChannel();
      const count = channel?.videos?.length || 0;
      // Validate index to make sure it's within bounds
      if (count > 0 && index >= 0 && index < count) {
        patchState(store, {
          currentVideoIndex: index
        });
      }
    },



    /**
     * Set mock channels for fallback or testing
     */
    setMockChannels(mockChannels: Channel[]) {
      if (mockChannels.length > 0) {
        patchState(store, {
          channels: mockChannels,
          currentChannel: mockChannels[0],
          currentVideoIndex: 0,
          isLoading: false
        });
      }
    }
  }))
);
