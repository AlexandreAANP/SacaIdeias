export interface IdeiaResponse {
  title: string;
  content: string;
  conversationId?: string;
}

export interface IdeiaImproved {
    originalIdeia: string;
    title: string;
    content: string;
    conversationId?: string;
}