import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection } from 'firebase/firestore';
import { MessageService } from 'primeng/api';
import { channelsStore } from '../../states/channels.state';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private firestore = inject(Firestore);
  private messageSvc = inject(MessageService);
  private channels = inject(channelsStore);

  /**
   * Create a new channel with the provided description
   * @param channelDescription The description to use for generating channel content
   */
  async createChannel(channelDescription: string): Promise<void> {
    // Validate description
    if (!channelDescription || channelDescription.trim().length === 0) {
      this.messageSvc.add({ 
        severity: 'error', 
        summary: 'Invalid Input', 
        detail: 'Please provide a channel description.' 
      });
      return;
    }
    
    // Ensure description has enough content for AI to work with
    if (channelDescription.trim().length < 10) {
      this.messageSvc.add({ 
        severity: 'error', 
        summary: 'Description Too Short', 
        detail: 'Please provide a more detailed description (at least 10 characters).' 
      });
      return;
    }

    const channel = {
      description: channelDescription.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      channelName: 'New Channel', // Will be replaced by the backend
      // Add these fields to ensure consistent document structure
      channelNumber: null,
      queriesCount: 0,
      totalVideosFound: 0,
      selectedVideosCount: 0,
      deletedVideosCount: 0
    };

    try {
      const channelsRef = collection(this.firestore, 'channels');
      await addDoc(channelsRef, channel);

      this.messageSvc.add({ 
        severity: 'success', 
        summary: 'Channel Processing', 
        detail: 'Channel created successfully! Channel takes 1-2 minutes to process.' 
      });
      
      // Refresh the channels list after a short delay to allow the backend to process
      setTimeout(() => {
        this.refreshChannels();
      }, 5000);
    } catch (error) {
      console.error('Error creating channel:', error);
      this.messageSvc.add({ 
        severity: 'error', 
        summary: 'Channel Creation Failed', 
        detail: 'Failed to create channel. Please try again.' 
      });
    }
  }

  /**
   * Refresh the channels list from Firestore
   */
  async refreshChannels(): Promise<void> {
    try {
      await this.channels.loadChannels();
      this.messageSvc.add({ 
        severity: 'info', 
        summary: 'Channels Refreshed', 
        detail: 'The channel list has been refreshed.' 
      });
    } catch (error) {
      console.error('Error refreshing channels:', error);
      this.messageSvc.add({ 
        severity: 'error', 
        summary: 'Refresh Failed', 
        detail: 'Failed to refresh channels. Please try again.' 
      });
    }
  }
}
