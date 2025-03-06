import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, fromEvent, interval, merge, Observable, Subscription, timer } from 'rxjs';
import { map, startWith, switchMap, tap, throttle } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {

  private lastActiveTime = new BehaviorSubject<number>(Date.now());
  readonly lastActiveTime$ = this.lastActiveTime.asObservable();

  private userActivitySub!: Subscription;

  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private INACTIVITY_TIMEOUT_MILLIS = 2000;

  startWatch(): void {
    if (this.userActivitySub instanceof Subscription) {
      this.userActivitySub.unsubscribe();
    }

    this.userActivitySub = merge([
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'click'),
      fromEvent(window, 'touchstart'),
      fromEvent(window, 'touchmove'),
      fromEvent(window, 'touchend'),
      fromEvent(window, 'keydown'),
      fromEvent(window, 'scroll')
    ])
      .pipe(
        startWith('initialEvent'),
        throttle(() => interval(500)),
        takeUntilDestroyed(this.destroyRef),
        tap(() => console.log('user is active'))
      )
      .subscribe(() => this.lastActiveTime.next(Date.now()));
  }

  getInactivityTimeout(timeoutInMillis: number = this.INACTIVITY_TIMEOUT_MILLIS): Observable<boolean> {
    return this.lastActiveTime$
      .pipe(
        switchMap(lastActiveTime => timer(new Date(lastActiveTime + timeoutInMillis))),
        tap(() => console.log('user is inactive')),
        map(() => false)
      )
  }
}


export function initInactivityService(inactivityService: InactivityService): void {
  inactivityService.startWatch();
}
