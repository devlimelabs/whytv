import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';


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
    protectedState: false,
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

