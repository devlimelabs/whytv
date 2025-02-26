import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection } from 'firebase/firestore';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {

  private firestore = inject(Firestore);
  private messageSvc = inject(MessageService);

  async createChannel(channelDescription: string): Promise<void> {
    const channel = {
      description: channelDescription
    }

    const channelsRef = collection(this.firestore, 'channels');

    await addDoc(channelsRef, channel);

    this.messageSvc.add({ severity: 'success', summary: 'Channel Processing', detail: 'Channel created successfully! Channel takes 1-2 minutes to process.' });

    return;
  }
}
