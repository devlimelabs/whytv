import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

import { ChannelService } from '../../services/channel/channel.service';
import { Channel } from '../../shared/types/video.types';

@Component({
  selector: 'app-channel-picker',
  templateUrl: './channel-picker.component.html',
  styleUrls: ['./channel-picker.component.css'],
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    DialogModule,
    ReactiveFormsModule,
    FloatLabelModule,
    FormsModule,
    TextareaModule,
    ToastModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChannelPickerComponent {
  private channelService = inject(ChannelService);
  // Inputs
  channels = input.required<Channel[]>();
  activeChannel = input.required<Channel>();
  visible = model(false);
  channelDescription = model('');

  // Outputs
  channelSelect = output<Channel>();


  openCreateChannelDialog() {
    this.visible.set(true);
  }

  cancelCreateChannel() {
    this.visible.set(false);
  }

  async createChannel(): Promise<void> {
    await this.channelService.createChannel(this.channelDescription());
    this.visible.set(false);
  }


}
