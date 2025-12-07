export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 string
  isStreaming?: boolean;
}

export interface VisionState {
  isLoading: boolean;
  error: string | null;
}

export interface ImageAttachment {
  data: string; // base64
  mimeType: string;
}
