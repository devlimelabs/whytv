import { inject } from '@angular/core';
import { find } from 'lodash';

import { channelsStore } from '../../../states/channels.state';
import { Video } from '../../../states/video-player.state';

import type { ResolveFn } from '@angular/router';
export const videoResolver: ResolveFn<Video | undefined> = (route, state) => {
  const { videoId } = route.queryParams;
  const store = inject(channelsStore);
  const channel = store.currentChannel();
  let video = find(channel?.videos, { youtubeId: videoId });

  if (video) {
    video = video;
  }

  if (!video) {
    video = channel?.videos[0];
  }

  console.log(video);


  return video;
};
