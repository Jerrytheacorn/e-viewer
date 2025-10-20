export interface E621File {
  url: string;
  preview_url?: string;
  width?: number;
  height?: number;
  type?: 'image' | 'video';
  video_url?: string;
}

export interface E621Post {
  id: number;
  file: E621File;
  tags: {
    general?: string[];
    [key: string]: any;
  };
  score?: { total: number };
  rating?: string;
}
