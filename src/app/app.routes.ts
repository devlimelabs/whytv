import { Routes } from '@angular/router';

import { WhytvPlayerComponent } from './components/whytv-player/whytv-player.component';
import { HomePage } from './pages/home/home.page';

export const routes: Routes = [
  // {
  //   path: '',
  //   component: AppComponent
  // },
  {
    path: '',
    component: HomePage,
    children: [
      { path: '', component: WhytvPlayerComponent },
    ],
  },
];
