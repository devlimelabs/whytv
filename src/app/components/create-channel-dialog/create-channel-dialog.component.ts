import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { patchState, signalState } from '@ngrx/signals';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';

import { AI_MODELS, AI_PROVIDERS } from '../../constants/provider-models.const';
import { ChannelService } from '../../services/channel/channel.service';

@Component({
  selector: 'app-create-channel-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    DropdownModule,
    FormsModule,
    FloatLabelModule
  ],
  templateUrl: './create-channel-dialog.component.html',
  styleUrl: './create-channel-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CreateChannelDialogComponent implements OnInit {


  // Services
  private channelSvc = inject(ChannelService);
  private messageSvc = inject(MessageService);
  private dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  // AI provider and model options
  providerOptions = AI_PROVIDERS;
  modelOptions = AI_MODELS;

  // Component state
  state = signalState({
    channelDescription: '',
    selectedProvider: 'openai',
    selectedModel: 'gpt-4o'
  });

  // Dropdown configuration
  dropdownAppendTo = 'body';

  // Computed models based on selected provider
  get currentModelOptions() {
    return this.modelOptions[this.state().selectedProvider as keyof typeof this.modelOptions] || [];
  }

  ngOnInit() {
    // Initialize with default values or values from config
    if (this.config.data) {
      patchState(this.state, {
        selectedProvider: this.config.data.provider || 'openai',
        selectedModel: this.config.data.model || 'gpt-4o'
      });
    }
  }

  // Methods to update signalState for two-way binding
  updateChannelDescription(value: string) {
    patchState(this.state, { channelDescription: value });
  }

  updateSelectedProvider(value: string) {
    patchState(this.state, { selectedProvider: value });
    this.onProviderChange();
  }

  updateSelectedModel(value: string) {
    patchState(this.state, { selectedModel: value });
  }

  // Method to handle provider change
  onProviderChange() {
    // When provider changes, set model to first option in the list
    const firstModelOption = this.modelOptions[this.state().selectedProvider as keyof typeof this.modelOptions]?.[0]?.value || '';

    patchState(this.state, {
      selectedModel: firstModelOption
    });
  }

  // Method to handle dialog submit
  async submitChannelCreation() {
    const description = this.state().channelDescription;

    // Validate description
    if (!description || description.trim().length === 0) {
      this.messageSvc.add({
        severity: 'error',
        summary: 'Invalid Input',
        detail: 'Please provide a channel description.'
      });
      return;
    }

    if (description.trim().length < 10) {
      this.messageSvc.add({
        severity: 'error',
        summary: 'Description Too Short',
        detail: 'Please provide a more detailed description (at least 10 characters).'
      });
      return;
    }

    const provider = this.state().selectedProvider;
    const model = this.state().selectedModel;

    try {
      // Call channel service directly
      await this.channelSvc.createChannel(description, provider, model);

      // Close dialog with success result
      this.dialogRef.close(true);
    } catch (error) {
      // Error is already handled by the channel service
      this.dialogRef.close(false);
    }
  }

  // Method to handle dialog cancel
  cancelChannelCreation() {
    this.dialogRef.close(false);
  }
}
