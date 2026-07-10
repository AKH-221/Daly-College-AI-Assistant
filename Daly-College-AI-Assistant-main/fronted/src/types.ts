
export type Role = 'user' | 'model';

export interface MessagePart {
    text: string;
}

export interface WebGroundingChunk {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: WebGroundingChunk;
}

export interface Message {
  role: Role;
  parts: MessagePart[];
  groundingChunks?: GroundingChunk[];
}
