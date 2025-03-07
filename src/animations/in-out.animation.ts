import {
  animate, style, transition, trigger 
} from '@angular/animations';

export const IN_OUT_ANIMATION = trigger(
  'inOutAnimation',
  [
    transition(
      ':enter',
      [
        style({
          height: 0,
          opacity: 0 
        }),
        animate('1s ease-out',
          style({
            height: 90,
            opacity: 1 
          }))
      ]
    ),
    transition(
      ':leave',
      [
        style({
          height: 90,
          opacity: 1 
        }),
        animate('1s ease-in',
          style({
            height: 0,
            opacity: 0 
          }))
      ]
    )
  ]
);

export const getInOutAnimation = (height: number) => {

  return trigger(
    'inOutAnimation',
    [
      transition(
        ':enter',
        [
          style({
            height: 0,
            opacity: 0 
          }),
          animate('1s ease-out',
            style({
              height: height,
              opacity: 1 
            }))
        ]
      ),
      transition(
        ':leave',
        [
          style({
            height: height,
            opacity: 1 
          }),
          animate('1s ease-in',
            style({
              height: 0,
              opacity: 0 
            }))
        ]
      )
    ]
  );

};
