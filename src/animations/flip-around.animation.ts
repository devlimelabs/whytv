import {
  animate, state, style, transition, trigger 
} from '@angular/animations';

export const FLIP_AROUND_ANIMATION = trigger('flipAround', [
  state('left', style({
    transform: 'rotate(-540deg)'
  })),
  state('right', style({
    transform: 'rotate(0)'
  })),
  transition('* => *', animate('750ms ease-in-out'))
]);

export const getFlipAroundAnimation = (time = '750ms', transitionName = 'ease-in-out') => trigger('flipAround', [
  state('left', style({
    transform: 'rotate(-540deg)'
  })),
  state('right', style({
    transform: 'rotate(0)'
  })),
  transition('* => *', animate(`${time} ${transitionName}`))
]);
