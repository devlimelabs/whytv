import {
  animate, state, style, transition, trigger 
} from '@angular/animations';

export const SLIDE_IN_OUT_ANIMATION = trigger('slideInOut', [
  state('hide', style({
    width: '0px'
  })),
  state('show', style({
    width: '250px'
  })),
  transition('* => *', animate('400ms ease-in-out'))
]);

export const getSlideInOutAnimation = (width: string | number = '250px') => {

  return trigger('slideInOut', [
    state('hide', style({
      width: '0px'
    })),
    state('show', style({
      width: width
    })),
    transition('* => *', animate('400ms ease-in-out'))
  ]);

};
