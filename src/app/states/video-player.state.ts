import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { patchState, signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import { startWith } from 'rxjs';

import { InactivityService } from '../services/inactivity/inactivity.service';


type VideoPlayerState = {
  video: Video | null;
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

export const videoPlayerState = signalStore(
  {
    protectedState: false,
    providedIn: 'root'
  },
  withState<VideoPlayerState>({
    video: null,
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
    playPauseLabel: computed(() => state.playing() ? 'Pause' : 'Play')
  })),
  withHooks((state) => ({
    onInit: () => {
      inject(InactivityService).getInactivityTimeout(2500)
      .pipe(takeUntilDestroyed(), startWith(true))
      .subscribe(active => {
        patchState(state, { userIsActive: active, hideUIOverlays: !active, showControls: active });
      });
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
};

export interface Channel {
  id: string;
  name: string;
  description: string;
  videos: Video[];
  provider?: string;  // AI provider used to create the channel
  model?: string;     // AI model used to create the channel
}
