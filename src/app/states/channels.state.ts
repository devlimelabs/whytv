import { computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { find, findIndex } from 'lodash';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { FirestoreService } from '../services/firestore.service';
import { Channel } from './video-player.state';

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
  withMethods((store, firestoreService = inject(FirestoreService), router = inject(Router)) => ({
    /**
     * Load all available channels from Firestore
     */
    async loadChannels() {
      let channels: Channel[] = [];
      patchState(store, { isLoading: true, error: null });

      try {
        channels = await firestoreService.getChannels();

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

      return channels;
    },

    /**
     * Set the active channel
     */
    setCurrentChannel(channel: Channel) {
      patchState(store, {
        currentChannel: channel
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
        patchState(store, {
          currentVideoIndex: index
        });
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
  })),
  withHooks((store, route = inject(ActivatedRoute), router = inject(Router), destroyRef = inject(DestroyRef)) => ({
    async onInit() {
      await store.loadChannels();

     route.queryParams
        .pipe(
          takeUntilDestroyed(destroyRef),
          map(({ channelId }) => channelId),
          distinctUntilChanged()
        )
        .subscribe((channelId) => {
          const currentChannel = find(store.channels(), { id: channelId });
          if (currentChannel) {
            store.setCurrentChannel(currentChannel);
            store.setCurrentVideoIndex(0);
          }
        });

      route.queryParams
        .pipe(
          takeUntilDestroyed(destroyRef),
          map(({ videoId }) => videoId),
          distinctUntilChanged()
        )
        .subscribe((videoId) => {
          store.setCurrentVideoIndex(findIndex(store.currentChannel()?.videos, { youtubeId: videoId }));
        });

      router.navigate([], { queryParams: { channelId: store.channels()?.[0]?.id, videoId: store.currentVideo()?.youtubeId } });
    }
  }))
);
