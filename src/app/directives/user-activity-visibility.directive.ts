import { Directive, effect, ElementRef, inject, Input, OnInit, Renderer2 } from '@angular/core';

import { UserActivityState } from '../states/user-activity.state';

@Directive({
  selector: '[whytvActivityVisibility]',
  standalone: true
})
export class UserActivityVisibilityDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly userActivityState = inject(UserActivityState);

  // Optional input to invert the behavior (hide when active, show when inactive)
  @Input() invertBehavior = false;

  // Optional input for custom CSS classes
  @Input() activeClass = 'activity-visible';
  @Input() inactiveClass = 'activity-hidden';

  // Optional input for transition duration
  @Input() transitionDuration = '0.3s';

  ngOnInit(): void {
    // Set initial styles for smooth transitions
    this.renderer.setStyle(this.el.nativeElement, 'transition', `opacity ${this.transitionDuration} ease-in-out`);

    // Apply initial state
    this.updateVisibility(this.userActivityState.isActive());

    // Create an effect to react to activity state changes
    effect(() => {
      const isActive = this.userActivityState.isActive();
      console.log('Activity state changed:', isActive); // Debug log
      this.updateVisibility(isActive);
    });
  }

  private updateVisibility(isActive: boolean): void {
    // Determine if element should be visible based on activity state and invert setting
    const shouldBeVisible = this.invertBehavior ? !isActive : isActive;

    console.log('Updating visibility:', shouldBeVisible); // Debug log

    if (shouldBeVisible) {
      this.renderer.removeClass(this.el.nativeElement, this.inactiveClass);
      this.renderer.addClass(this.el.nativeElement, this.activeClass);
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      this.renderer.setStyle(this.el.nativeElement, 'pointer-events', 'auto');
    } else {
      this.renderer.removeClass(this.el.nativeElement, this.activeClass);
      this.renderer.addClass(this.el.nativeElement, this.inactiveClass);
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
      this.renderer.setStyle(this.el.nativeElement, 'pointer-events', 'none');
    }
  }
}
