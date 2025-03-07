// video-carousel.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { VideoCarouselComponent } from './video-carousel.component';

@NgModule({
  declarations: [
    VideoCarouselComponent
  ],
  imports: [
    CommonModule,
    BrowserAnimationsModule
  ],
  exports: [
    VideoCarouselComponent
  ]
})
export class VideoCarouselModule { }
