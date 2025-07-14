import { Injectable } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface UIState {
  carouselVisible: boolean;
}

const initialState: UIState = {
  carouselVisible: false  // Default to hidden on load
};

@Injectable({
  providedIn: 'root'
})
export class UIStateService extends signalStore(
  withState(initialState),
  withMethods((store) => ({
    toggleCarousel() {
      patchState(store, {
        carouselVisible: !store.carouselVisible()
      });
    },

    setCarouselVisible(visible: boolean) {
      patchState(store, {
        carouselVisible: visible
      });
    }
  }))
) {}