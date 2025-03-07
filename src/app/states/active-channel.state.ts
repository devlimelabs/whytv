import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { channelsStore } from './channels.state';

/**
 * Interface for the active channel state
 */
export interface ActiveChannelState {
  currentVideoIndex: number;
  autoPlay: boolean;
  showUI: boolean;
  showInfo: boolean;
}

/**
 * The signal store for managing the active channel
 */
export const activeChannelStore = signalStore(
  {
    providedIn: 'root',
    protectedState: false
  },
  withState<ActiveChannelState>({
    currentVideoIndex: 0,
    autoPlay: true,
    showUI: true,
    showInfo: true
  }),
  withComputed((state, channelsState = inject(channelsStore)) => ({
    /**
     * The active channel
     */
    activeChannel: computed(() => channelsState.currentChannel()),

    /**
     * The active video
     */
    activeVideo: computed(() => {
      const channel = channelsState.currentChannel();
      const index = state.currentVideoIndex();

      if (!channel || !channel.videos || channel.videos.length === 0) {
        return null;
      }

      return channel.videos[index];
    }),

    /**
     * The video ID of the active video
     */
    activeVideoId: computed(() => {
      const channel = channelsState.currentChannel();
      const index = state.currentVideoIndex();

      if (!channel || !channel.videos || channel.videos.length === 0) {
        return '';
      }

      const videoId = channel?.videos?.[index]?.youtubeId ?? '';
      return videoId;
    }),

    /**
     * Whether there's a next video
     */
    hasNextVideo: computed(() => {
      const channel = channelsState.currentChannel();
      if (!channel || !channel.videos) return false;

      return state.currentVideoIndex() < channel.videos.length - 1;
    }),

    /**
     * Whether there's a previous video
     */
    hasPreviousVideo: computed(() => {
      return state.currentVideoIndex() > 0;
    })
  })),
  withMethods((store, channelsState = inject(channelsStore)) => ({
    /**
     * Play the next video
     */
    nextVideo() {
      const channel = channelsState.currentChannel();
      if (!channel || !channel.videos) return;

      const currentIndex = store.currentVideoIndex();
      if (currentIndex < channel.videos.length - 1) {
        patchState(store, { currentVideoIndex: currentIndex + 1 });
      }
    },

    /**
     * Play the previous video
     */
    previousVideo() {
      const currentIndex = store.currentVideoIndex();
      if (currentIndex > 0) {
        patchState(store, { currentVideoIndex: currentIndex - 1 });
      }
    },

    /**
     * Toggle UI visibility
     */
    toggleUI() {
      patchState(store, { showUI: !store.showUI() });
    },

    /**
     * Toggle info panel visibility
     */
    toggleInfo() {
      patchState(store, { showInfo: !store.showInfo() });
    },

    /**
     * Set a specific video index
     */
    setVideoIndex(index: number) {
      const channel = channelsState.currentChannel();
      if (!channel || !channel.videos) return;

      if (index >= 0 && index < channel.videos.length) {
        patchState(store, { currentVideoIndex: index });
      }
    },

    /**
     * Reset the active channel state when a new channel is selected
     */
    resetForNewChannel() {
      patchState(store, {
        currentVideoIndex: 0,
        showUI: true,
        showInfo: true
      });
    }
  }))
);
