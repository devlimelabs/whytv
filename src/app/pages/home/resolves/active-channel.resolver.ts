import { inject } from '@angular/core';
import { ResolveFn, Router, UrlTree } from '@angular/router';
import { findIndex } from 'lodash';
import find from 'lodash/find';

import { activeChannelStore } from '../../../states/active-channel.state';
import { channelsStore } from '../../../states/channels.state';

import type { Channel } from '../../../states/video-player.state';
export const activeChannelResolver: ResolveFn<Channel | UrlTree> = async (route, state) => {
  const { channelId, videoId } = route.queryParams;
  const store = inject(channelsStore);
  const activeChannelState = inject(activeChannelStore);
  const router = inject(Router);
  const channels = store.channels();
  const channel = find(channels, { id: channelId });

  if (channel && videoId) {
    store.setCurrentChannel(channel);
    store.setCurrentVideoIndex(videoId ? findIndex(channel.videos, { youtubeId: videoId }) : 0);
  } else if (channelId) {
    return router.createUrlTree(['/'], { queryParams: { channelId: channel?.id, videoId: channel?.videos[0].youtubeId } });
  } else {
    return router.createUrlTree(['/'], { queryParams: { channelId: channels[0].id, videoId: channels[0].videos[0].youtubeId } });
  }



  return channel;
};
