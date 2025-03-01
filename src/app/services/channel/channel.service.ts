import { inject, Injectable, OnDestroy } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection } from 'firebase/firestore';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { FirestoreService, ChannelStatusUpdate } from '../firestore.service';
import { channelsStore } from '../../states/channels.state';

@Injectable({
  providedIn: 'root'
})
export class ChannelService implements OnDestroy {
  private firestore = inject(Firestore);
  private messageSvc = inject(MessageService);
  private channels = inject(channelsStore);
  private firestoreService = inject(FirestoreService);
  
  // Track active subscriptions
  private destroy$ = new Subject<void>();
  private activeSubscription: (() => void) | null = null;

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
      const docRef = await addDoc(channelsRef, channel);
      const channelId = docRef.id;

      this.messageSvc.add({ 
        severity: 'success', 
        summary: 'Channel Processing', 
        detail: 'Channel created successfully! Starting processing...' 
      });
      
      // Set up a subscription to listen for channel status changes
      this.subscribeToChannelStatus(channelId);
      
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
  
  /**
   * Subscribe to channel status updates and show toasts for each update
   * @param channelId The ID of the channel to subscribe to
   */
  private subscribeToChannelStatus(channelId: string): void {
    // If there's an existing subscription, unsubscribe
    if (this.activeSubscription) {
      this.activeSubscription();
      this.destroy$.next();
    }
    
    // Create a new subscription
    this.activeSubscription = this.firestoreService.subscribeToChannel(channelId);
    
    // Subscribe to channel status updates
    this.firestoreService.channelStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (update: ChannelStatusUpdate) => {
        // Only process updates for this channel
        if (update.id !== channelId) return;
        
        switch (update.status) {
          case 'pending':
            this.messageSvc.add({
              severity: 'info',
              summary: 'Channel Creation',
              detail: 'Creating channel...'
            });
            break;
            
          case 'new':
            this.messageSvc.add({
              severity: 'info',
              summary: 'Channel Created',
              detail: `"${update.channelName}" - Generating video queries...`
            });
            break;
            
          case 'select_videos':
            let statusDetail = 'Selecting videos for your channel...';
            if (update.queriesCount && update.queriesCompleted) {
              const percent = Math.floor((update.queriesCompleted / update.queriesCount) * 100);
              statusDetail = `Selecting videos: ${percent}% complete`;
            }
            if (update.totalVideosFound) {
              statusDetail += ` (${update.totalVideosFound} videos found)`;
            }
            
            this.messageSvc.add({
              severity: 'info',
              summary: `Processing "${update.channelName}"`,
              detail: statusDetail
            });
            break;
            
          case 'live':
            this.messageSvc.add({
              severity: 'success',
              summary: 'Channel Ready!',
              detail: `"${update.channelName}" is now available`
            });
            
            // When channel is live, load it
            await this.loadAndSelectLiveChannel(channelId);
            
            // Clean up subscription since channel is now live
            if (this.activeSubscription) {
              this.activeSubscription();
              this.activeSubscription = null;
              this.destroy$.next();
            }
            break;
            
          default:
            console.log(`Unknown channel status: ${update.status}`);
        }
      });
  }
  
  /**
   * Load a specific channel when it's ready and select it
   * @param channelId The ID of the channel to load
   */
  private async loadAndSelectLiveChannel(channelId: string): Promise<void> {
    try {
      // Refresh the channel list to make sure it includes the new channel
      await this.channels.loadChannels();
      
      // Get the full channel list
      const channelList = this.channels.channels();
      
      // Find the new channel in the list
      const newChannel = channelList.find(channel => channel.id === channelId);
      
      // If found, set it as the current channel
      if (newChannel) {
        this.channels.setCurrentChannel(newChannel);
      }
    } catch (error) {
      console.error('Error loading new channel:', error);
    }
  }
  
  /**
   * Clean up subscriptions on service destroy
   */
  ngOnDestroy(): void {
    if (this.activeSubscription) {
      this.activeSubscription();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
