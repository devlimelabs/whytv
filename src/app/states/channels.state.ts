import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { FirestoreService } from '../services/firestore.service';
import { Channel, Video } from './video-player.state';

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
export const channelsStore = signalStore(
  { providedIn: 'root' },
  withState<ChannelsState>({
    channels: [],
    currentChannel: null,
    currentVideoIndex: 0,
    isLoading: true,
    error: null
  }),
  withComputed((state) => ({
    /**
     * Get the current video based on the current channel and video index
     */
    currentVideo: computed(() => {
      const channel = state.currentChannel();
      const index = state.currentVideoIndex();
      
      if (!channel || !channel.videos || !channel.videos.length) {
        return null;
      }
      
      return channel.videos[index];
    }),
    
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
    })
  })),
  withMethods((store, firestoreService = inject(FirestoreService)) => ({
    /**
     * Load all available channels from Firestore
     */
    async loadChannels() {
      patchState(store, { isLoading: true, error: null });
      
      try {
        const channels = await firestoreService.getChannels();
        
        if (channels.length > 0) {
          patchState(store, {
            channels,
            currentChannel: channels[0],
            currentVideoIndex: 0,
            isLoading: false
          });
        } else {
          patchState(store, {
            channels: [],
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error loading channels:', error);
        patchState(store, {
          isLoading: false,
          error: 'Failed to load channels'
        });
      }
    },
    
    /**
     * Set the active channel
     */
    setCurrentChannel(channel: Channel) {
      patchState(store, {
        currentChannel: channel,
        currentVideoIndex: 0
      });
    },
    
    /**
     * Set the current video index
     */
    setCurrentVideoIndex(index: number) {
      const channel = store.currentChannel();
      const count = channel?.videos?.length || 0;
      
      // Validate index to make sure it's within bounds
      if (count > 0 && index >= 0 && index < count) {
        patchState(store, { currentVideoIndex: index });
      }
    },
    
    /**
     * Go to the next video in the current channel
     * @returns true if successful, false if at the end
     */
    nextVideo(): boolean {
      const channel = store.currentChannel();
      const index = store.currentVideoIndex();
      const count = channel?.videos?.length || 0;
      
      if (count > 0 && index < count - 1) {
        patchState(store, { currentVideoIndex: index + 1 });
        return true;
      }
      
      return false;
    },
    
    /**
     * Go to the previous video in the current channel
     * @returns true if successful, false if at the beginning
     */
    previousVideo(): boolean {
      const index = store.currentVideoIndex();
      
      if (index > 0) {
        patchState(store, { currentVideoIndex: index - 1 });
        return true;
      }
      
      return false;
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