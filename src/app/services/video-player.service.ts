import { inject, Injectable } from '@angular/core';
import { patchState } from '@ngrx/signals';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';

import { ChannelsState } from '../states/channels.state';
import { videoPlayerState } from '../states/video-player.state';


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





  /* Video Control Event StreamMethods */

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
}
