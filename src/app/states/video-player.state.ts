import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';


type VideoPlayerState = {
  playing: boolean;
  paused: boolean;
  muted: boolean;
  liked: boolean;
  showControls: boolean;
  hideUIOverlays: boolean;  // New property to coordinate hiding all UI elements
  progress: number;
  loading: boolean;
  error: string | null;
  currentChannel: Channel | null;
  userIsActive: boolean;
};

/**
 * Video Player State Store
 * 
 * TEMPORARY: protectedState is set to false to allow direct state updates.
 * This will be changed to protectedState: true in Phase 2.
 * 
 * EXCEPTION: WhytvPlayerComponent is authorized to update this state directly
 * because it serves as the single source of truth for YouTube player events.
 * All other components must use VideoPlayerService methods to interact with the player.
 * 
 * TODO: Phase 2 - Enable protectedState and ensure only WhytvPlayerComponent 
 * and VideoPlayerService can update state through proper methods.
 */
export const videoPlayerState = signalStore(
  {
    protectedState: true,
    providedIn: 'root'
  },
  withState<VideoPlayerState>({
    playing: false,
    paused: false,
    muted: false,
    liked: false,
    showControls: true,
    hideUIOverlays: false,
    userIsActive: true,
    progress: 0,
    loading: false,
    error: null,
    currentChannel: null,
  }),
  withComputed((state) => ({
    playPauseLabel: computed(() => state.playing() ? 'Pause' : 'Play'),
  })),
  withMethods((store) => ({
    /**
     * Update playing state - for WhytvPlayerComponent use only
     */
    updatePlayingState(playing: boolean, paused: boolean) {
      patchState(store, { playing, paused });
    },

    /**
     * Set muted state
     */
    setMuted(muted: boolean) {
      patchState(store, { muted });
    },

    /**
     * Toggle liked state
     */
    toggleLiked() {
      patchState(store, { liked: !store.liked() });
    },

    /**
     * Set user active state
     */
    setUserActive() {
      patchState(store, {
        userIsActive: true,
        showControls: true,
        hideUIOverlays: false
      });
    },

    /**
     * Update loading state
     */
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },

    /**
     * Set error state
     */
    setError(error: string | null) {
      patchState(store, { error });
    },

    /**
     * Update progress
     */
    updateProgress(progress: number) {
      patchState(store, { progress });
    },

    /**
     * Set current channel
     */
    setCurrentChannel(channel: Channel | null) {
      patchState(store, { currentChannel: channel });
    }
  }))
);



export type Video = {
    channelTitle: string;
    deleted: boolean;
    description: string;
    lastUpdated: {
      "__time__": string
    },
    order: number;
    publishedAt: string;
    thumbnails: {
       default: {
        height: number;
        url: string;
        width: number;
      },
      high: {
        height: number;
        url: string;
        width: number;
      },
      medium: {
        height: number;
        url: string;
        width: number;
      }
  },
  title: string;
  youtubeId: string;
  id?: string;
};

export interface Channel {
  id: string;
  name: string;
  description: string;
  videos: Video[];
  provider?: string;  // AI provider used to create the channel
  model?: string;     // AI model used to create the channel
}

