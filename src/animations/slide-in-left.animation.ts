import {
  animate, style, transition, trigger
} from '@angular/animations';

export const slideInLeft = (duration = '300') => trigger('slideInLeft', [
  transition(':enter', [
    style({ right: '-{{position}}px' }),
    animate(`${duration}ms ease-in-out`,
      style({ right: '0' }))
  ], { params: { position: 48 } }),
  transition(':leave', [
    animate(`${duration}ms ease-in-out`,
      style({ right: `-{{position}}px` }))
  ], { params: { position: 48 } })
]);
