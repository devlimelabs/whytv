import { Injectable } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface UIState {
  carouselVisible: boolean;  // For future video list feature
  channelRailVisible: boolean;  // For channel carousel at bottom
}

const initialState: UIState = {
  carouselVisible: false,  // Default to hidden on load
  channelRailVisible: false  // Default to hidden on load
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
    },

    toggleChannelRail() {
      patchState(store, {
        channelRailVisible: !store.channelRailVisible()
      });
    },

    setChannelRailVisible(visible: boolean) {
      patchState(store, {
        channelRailVisible: visible
      });
    },

    showChannelRail() {
      patchState(store, {
        channelRailVisible: true
      });
    },

    hideChannelRail() {
      patchState(store, {
        channelRailVisible: false
      });
    }
  }))
) {}