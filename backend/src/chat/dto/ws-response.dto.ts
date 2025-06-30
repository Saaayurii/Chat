export interface WsConnectionResponse {
  message: string;
  user: {
    id: string;
    email: string;
    username?: string;
  };
}

export interface WsRoomJoinedResponse {
  conversationId: string;
  message?: string;
}

export interface WsErrorResponse {
  message: string;
  code?: string;
  timestamp?: Date;
}

export interface WsTypingResponse {
  userId: string;
  username?: string;
  conversationId: string;
}

export interface WsMessageResponse {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  type: string;
  status: string;
  createdAt: Date;
  sender?: {
    email: string;
    profile?: {
      username?: string;
      avatarUrl?: string;
    };
  };
}