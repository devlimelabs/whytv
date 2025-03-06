import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ChannelService } from '../../services/channel/channel.service';
import { Channel } from '../../states/video-player.state';

interface DropdownOption {
  name: string;
  value: string;
}

@Component({
  selector: 'app-channel-picker',
  templateUrl: './channel-picker.component.html',
  styleUrls: ['./channel-picker.component.css'],
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    DialogModule,
    DropdownModule,
    ReactiveFormsModule,
    FloatLabelModule,
    FormsModule,
    TextareaModule,
    ToastModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChannelPickerComponent implements OnInit, OnDestroy {
  private channelService = inject(ChannelService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  channels = input.required<Channel[]>();
  activeChannel = input.required<Channel>();
  visible = model(false);
  channelDescription = model('');

  // Outputs
  channelSelect = output<Channel>();

  // Signals for UI state
  isExpanded = signal(false);
  showControls = signal(true);
  private hideControlsTimer: ReturnType<typeof setTimeout> | null = null;

  // AI Provider and model selection
  selectedProvider = 'openai';
  selectedModel = 'gpt-4o';
  
  // Available AI providers
  providers: DropdownOption[] = [
    { name: 'OpenAI', value: 'openai' },
    { name: 'Anthropic', value: 'anthropic' },
    { name: 'Google AI', value: 'googleai' }
  ];
  
  // Available models for each provider
  openaiModels: DropdownOption[] = [
    { name: 'GPT-4o', value: 'gpt-4o' },
    { name: 'GPT-4o mini', value: 'gpt-4o-mini' },
    { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' }
  ];
  
  anthropicModels: DropdownOption[] = [
    { name: 'Claude 3.7 Sonnet', value: 'claude-3-7-sonnet' },
    { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
    { name: 'Claude 3 Opus', value: 'claude-3-opus' },
    { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
    { name: 'Claude 3 Haiku', value: 'claude-3-haiku' },
    { name: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku' }
  ];
  
  googleModels: DropdownOption[] = [
    { name: 'Gemini Pro', value: 'gemini-pro' },
    { name: 'Gemini Ultra', value: 'gemini-ultra' }
  ];
  
  // Computed signal to filter models based on selected provider
  filteredModels = computed(() => {
    switch (this.selectedProvider) {
      case 'anthropic':
        return this.anthropicModels;
      case 'googleai':
        return this.googleModels;
      case 'openai':
      default:
        return this.openaiModels;
    }
  });

  // Computed signal to filter out the active channel
  filteredChannels = computed(() => {
    // Filter out the active channel and ensure we have a valid array
    return this.channels().filter(channel =>
      channel && this.activeChannel() && channel.id !== this.activeChannel().id
    );
  });

  ngOnInit(): void {
    // Track mouse movement for smoother hover behavior and controls visibility
    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(
        debounceTime(50),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        // Show controls on mouse movement
        this.showControls.set(true);
        this.resetHideControlsTimer();
      });
  }

  ngOnDestroy(): void {
    // Clean up timer
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }
  }

  private resetHideControlsTimer(): void {
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }
    this.hideControlsTimer = setTimeout(() => {
      this.showControls.set(false);
    }, 3000);
  }

  openCreateChannelDialog() {
    this.visible.set(true);
  }

  cancelCreateChannel() {
    this.visible.set(false);
  }
  
  /**
   * Handler for provider change to update the model selection
   */
  onProviderChange(): void {
    // Set default model based on selected provider
    switch (this.selectedProvider) {
      case 'anthropic':
        this.selectedModel = 'claude-3-7-sonnet';
        break;
      case 'googleai':
        this.selectedModel = 'gemini-pro';
        break;
      case 'openai':
      default:
        this.selectedModel = 'gpt-4o';
        break;
    }
  }

  /**
   * Create a new channel with the provided description and AI model settings
   */
  async createChannel(): Promise<void> {
    await this.channelService.createChannel(
      this.channelDescription(),
      this.selectedProvider,
      this.selectedModel
    );
    this.visible.set(false);
  }
}
