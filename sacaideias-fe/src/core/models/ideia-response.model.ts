export interface IdeiaResponse {
  title: string;
  content: string;
  tags: string[];
  conversationId?: string;
}

export interface IdeiaImproved {
    originalIdeia: string;
    title: string;
    content: string;
    tags: string[];
    conversationId?: string;
    createdAt?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  response?: IdeiaResponse;
}

export interface PersistedConversation {
  id: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  messages: ConversationMessage[];
}

export interface ConversationsResponse {
  conversations: PersistedConversation[];
  has_more: boolean;
}
