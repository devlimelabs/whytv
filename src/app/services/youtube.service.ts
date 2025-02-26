import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// Define the YouTube types directly if they don't already exist
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: typeof YT;
  }

  namespace YT {
    interface PlayerOptions {
      width?: number;
      height?: number;
      videoId?: string;
      playerVars?: PlayerVars;
      events?: Events;
    }

    interface PlayerVars {
      autoplay?: 0 | 1;
      cc_load_policy?: 1;
      color?: 'red' | 'white';
      controls?: 0 | 1 | 2;
      disablekb?: 0 | 1;
      enablejsapi?: 0 | 1;
      end?: number;
      fs?: 0 | 1;
      hl?: string;
      iv_load_policy?: 1 | 3;
      list?: string;
      listType?: 'playlist' | 'search' | 'user_uploads';
      loop?: 0 | 1;
      modestbranding?: 1;
      origin?: string;
      playlist?: string;
      playsinline?: 0 | 1;
      rel?: 0 | 1;
      showinfo?: 0 | 1;
      start?: number;
      mute?: 0 | 1;
    }

    interface Events {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onPlaybackQualityChange?: (event: OnPlaybackQualityChangeEvent) => void;
      onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void;
      onError?: (event: OnErrorEvent) => void;
      onApiChange?: (event: PlayerEvent) => void;
    }

    interface PlayerEvent {
      target: Player;
    }

    interface OnStateChangeEvent {
      target: Player;
      data: PlayerState;
    }

    interface OnPlaybackQualityChangeEvent {
      target: Player;
      data: string;
    }

    interface OnPlaybackRateChangeEvent {
      target: Player;
      data: number;
    }

    interface OnErrorEvent {
      target: Player;
      data: number;
    }

    interface Player {
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
      seekTo(seconds: number, allowSeekAhead?: boolean): void;
      loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
      cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
      loadVideoByUrl(mediaContentUrl: string, startSeconds?: number, suggestedQuality?: string): void;
      cueVideoByUrl(mediaContentUrl: string, startSeconds?: number, suggestedQuality?: string): void;
      loadPlaylist(playlist: string | string[], index?: number, startSeconds?: number, suggestedQuality?: string): void;
      cuePlaylist(playlist: string | string[], index?: number, startSeconds?: number, suggestedQuality?: string): void;
      nextVideo(): void;
      previousVideo(): void;
      playVideoAt(index: number): void;
      mute(): void;
      unMute(): void;
      isMuted(): boolean;
      setVolume(volume: number): void;
      getVolume(): number;
      setSize(width: number, height: number): void;
      getPlaybackRate(): number;
      setPlaybackRate(suggestedRate: number): void;
      getAvailablePlaybackRates(): number[];
      setLoop(loopPlaylists: boolean): void;
      setShuffle(shufflePlaylist: boolean): void;
      getVideoLoadedFraction(): number;
      getPlayerState(): number;
      getCurrentTime(): number;
      getDuration(): number;
      getVideoUrl(): string;
      getVideoEmbedCode(): string;
      getPlaylist(): string[];
      getPlaylistIndex(): number;
      addEventListener(event: string, listener: string): void;
      removeEventListener(event: string, listener: string): void;
      getIframe(): HTMLIFrameElement;
      destroy(): void;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  private apiLoaded = false;
  private apiLoaded$ = new Subject<boolean>();

  constructor(private ngZone: NgZone) {
    this.loadYouTubeApi();
  }

  /**
   * Loads the YouTube IFrame API script
   */
  private loadYouTubeApi(): void {
    // If the API is already loaded, emit true
    if (this.apiLoaded) {
      this.apiLoaded$.next(true);
      return;
    }

    // Create script element
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';

    // Insert the script before the first script tag
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up the callback function that the YouTube API will call when ready
    window.onYouTubeIframeAPIReady = () => {
      this.ngZone.run(() => {
        this.apiLoaded = true;
        this.apiLoaded$.next(true);
      });
    };
  }

  /**
   * Returns an Observable that emits when the YouTube API is loaded
   */
  public apiReady(): Observable<boolean> {
    return this.apiLoaded$.asObservable();
  }

  /**
   * Creates a YouTube player in the specified element
   * @param elementId The ID of the element to replace with the YouTube player
   * @param options The YouTube player options
   * @returns The YouTube player instance
   */
  public createPlayer(elementId: string, options: YT.PlayerOptions): YT.Player {
    return new window.YT.Player(elementId, options);
  }
}
