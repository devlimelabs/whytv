import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';


type VideoPlayerState = {
  video: Video | null;
  playing: boolean;
  paused: boolean;
  muted: boolean;
  liked: boolean;
  showControls: boolean;
  progress: number;
  loading: boolean;
  error: string | null;
  currentChannel: Channel | null;
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
    progress: 0,
    loading: false,
    error: null,
    currentChannel: null,
  }),
  withComputed((state) => ({
    playPauseLabel: computed(() => state.playing() ? 'Pause' : 'Play')
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
}
