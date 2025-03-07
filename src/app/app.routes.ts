import { Routes } from '@angular/router';

import { WhytvPlayerComponent } from './components/whytv-player/whytv-player.component';
import { HomePage } from './pages/home/home.page';
import { activeChannelResolver } from './pages/home/resolves/active-channel.resolver';
import { channelsResolver } from './pages/home/resolves/channels.resolver';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    resolve: {
      channels: channelsResolver,
    },
    children: [
      {
        path: '',
        component: WhytvPlayerComponent,
        resolve: {
          activeChannel: activeChannelResolver
        },
        runGuardsAndResolvers: 'pathParamsOrQueryParamsChange'
      },
    ],
  },
];
