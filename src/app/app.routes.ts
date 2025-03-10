import { Routes } from '@angular/router';

import { WhytvPlayerComponent } from './pages/home/components/whytv-player/whytv-player.component';
import { HomePage } from './pages/home/home.page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    children: [
      {
        path: '',
        component: WhytvPlayerComponent
      },
    ],
  },
];
