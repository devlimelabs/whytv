export interface Video {
  id: string;
  title: string;
  channelName: string;
  thumbnail: string;
  videoUrl: string;
  youtubeId?: string; // Optional YouTube video ID for YouTube videos
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  videos: Video[];
}

// Mock data with working video URLs from a reliable source
export const mockChannels: Channel[] = [
  {
    id: '1',
    name: 'Ambient Vibes',
    description: 'Relaxing ambient music for focus and calm',
    videos: [
      {
        id: 'v1',
        title: 'Morning Meditation',
        channelName: 'Ambient Vibes',
        thumbnail: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?auto=format&fit=crop&w=1920',
        videoUrl: 'https://cdn.coverr.co/videos/coverr-a-small-stream-in-a-forest-2633/1080p.mp4',
        youtubeId: 'jfKfPfyJRdk' // Lofi Girl - lofi hip hop radio 📚 - beats to relax/study to
      },
      {
        id: 'v2',
        title: 'Ocean Waves',
        channelName: 'Ambient Vibes',
        thumbnail: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920',
        videoUrl: 'https://cdn.coverr.co/videos/coverr-ocean-waves-hitting-rocks-5443/1080p.mp4'
      },
      {
        id: 'v3',
        title: 'Forest Walk',
        channelName: 'Ambient Vibes',
        thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920',
        videoUrl: 'https://cdn.coverr.co/videos/coverr-walking-in-a-forest-1576/1080p.mp4'
      }
    ]
  },
  {
    id: '2',
    name: 'City Life',
    description: 'Urban scenes and city vibes',
    videos: [
      {
        id: 'v4',
        title: 'City Lights',
        channelName: 'City Life',
        thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1920',
        videoUrl: 'https://cdn.coverr.co/videos/coverr-aerial-view-of-a-city-at-night-3124/1080p.mp4',
        youtubeId: 'n_Dv4JMiwK8' // The Beauty Of Cities | 4K
      }
    ]
  },
  {
    id: '3',
    name: 'Nature',
    description: 'Beautiful natural landscapes',
    videos: [
      {
        id: 'v5',
        title: 'Mountain View',
        channelName: 'Nature',
        thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920',
        videoUrl: 'https://cdn.coverr.co/videos/coverr-hiking-in-the-mountains-9721/1080p.mp4',
        youtubeId: 'wnhvanMdx4s' // 4K Scenic Nature Documentary with Relaxing Music
      }
    ]
  },
  {
    id: '4',
    name: 'YouTube Originals',
    description: 'YouTube exclusive content',
    videos: [
      {
        id: 'v6',
        title: 'Dude Perfect: Backstage Pass',
        channelName: 'YouTube Originals',
        thumbnail: 'https://i.ytimg.com/vi/H0iSh9A7rLI/maxresdefault.jpg',
        videoUrl: '',
        youtubeId: 'H0iSh9A7rLI'
      },
      {
        id: 'v7',
        title: 'BTS: Permission to Dance',
        channelName: 'YouTube Originals',
        thumbnail: 'https://i.ytimg.com/vi/CuklIb9d3fI/maxresdefault.jpg',
        videoUrl: '',
        youtubeId: 'CuklIb9d3fI'
      }
    ]
  }
];
