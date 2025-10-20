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
    species?: string[];
    character?: string[];
    artist?: string[];
  };
  score?: { total: number };
  rating?: string;
}

export interface SearchResult {
  posts: E621Post[];
}
