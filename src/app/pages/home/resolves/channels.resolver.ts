import { inject } from '@angular/core';

import { channelsStore } from '../../../states/channels.state';

import type { ResolveFn } from '@angular/router';

export const channelsResolver: ResolveFn<Promise<any[]>> = async (route, state) => {
  return inject(channelsStore).loadChannels();
};
