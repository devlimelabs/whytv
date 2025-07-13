import { inject, Injectable } from '@angular/core';
import { patchState } from '@ngrx/signals';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';

import { ChannelsState } from '../states/channels.state';
import { videoPlayerState } from '../states/video-player.state';

/**
 * VideoPlayerService - Centralized Video Player Control
 * 
 * This service implements the RxJS Subject pattern for event coordination between
 * components and the video player. This pattern is used because:
 * 
 * 1. Event Streams: Player control events (play, pause, seek) are inherently event-driven
 * 2. Decoupling: Components can trigger player actions without direct player access
 * 3. Observable Streams: The player component subscribes to these streams to execute commands
 * 
 * Pattern Guidelines:
 * - Use RxJS Subjects/Observables for:
 *   * Event coordination (play, pause, seek commands)
 *   * Asynchronous operations
 *   * Cross-component communication
 * 
 * - Use Signals for:
 *   * Reactive state (playing, paused, muted states)
 *   * Synchronous data that components need to react to
 *   * UI state that drives template rendering
 * 
 * This service acts as the command center - components call methods here to control
 * the player, and WhytvPlayerComponent subscribes to execute these commands.
 */
@Injectable({
  providedIn: 'root'
})
export class VideoPlayerService {
  private messageSvc = inject(MessageService);
  #videoPlayerStore = inject(videoPlayerState);
  #channelsState = inject(ChannelsState);
  #play = new Subject<void>();
  #pause = new Subject<void>();
  #stop = new Subject<void>();
  #seek = new Subject<number>();
  #volume = new Subject<number>();
  #rate = new Subject<number>();
  #quality = new Subject<string>();

  readonly play$ = this.#play.asObservable();
  readonly pause$ = this.#pause.asObservable();
  readonly stop$ = this.#stop.asObservable();
  readonly seek$ = this.#seek.asObservable();
  readonly volume$ = this.#volume.asObservable();
  readonly rate$ = this.#rate.asObservable();
  readonly quality$ = this.#quality.asObservable();





  /* Video Control Event Stream Methods */
  
  /**
   * Emit play command - WhytvPlayerComponent will execute
   */
  play() {
    this.#play.next();
  }

  pause() {
    this.#pause.next();
  }

  stop() {
    this.#stop.next();
  }

  seek(time: number) {
    this.#seek.next(time);
  }

  volume(volume: number) {
    this.#volume.next(volume);
  }

  rate(rate: number) {
    this.#rate.next(rate);
  }

  quality(quality: string) {
    this.#quality.next(quality);
  }

  /**
   * State update callbacks - called by WhytvPlayerComponent after executing commands
   * These methods update the signal state to reflect the actual player state
   */
  onPlayed() {
    patchState(this.#videoPlayerStore, { playing: true, paused: false });
  }

  onPaused() {
    patchState(this.#videoPlayerStore, { playing: false, paused: true });
  }

  onMuted() {
    patchState(this.#videoPlayerStore, { muted: true });
  }

  onUnmuted() {
    patchState(this.#videoPlayerStore, { muted: false });
  }

  /**
   * Toggle the liked state of the current video
   */
  toggleLiked() {
    const currentLikedState = this.#videoPlayerStore.liked();
    patchState(this.#videoPlayerStore, { liked: !currentLikedState });
  }

  /**
   * Set the user as active and update related UI states
   */
  setUserActive() {
    patchState(this.#videoPlayerStore, {
      userIsActive: true,
      showControls: true,
      hideUIOverlays: false
    });
  }
}
