import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ConversationsResponse, IdeiaResponse } from "../models/ideia-response.model";

@Injectable({
  providedIn: 'root'
})
export class AIService {
    private readonly http = inject(HttpClient);
    private readonly backendUri: string = "http://localhost:8000";

    public async getIdeiaSacada(ideia: string): Promise<IdeiaResponse>  {
      return firstValueFrom(
        this.http.post<IdeiaResponse>(`${this.backendUri}/api/v1/saca-ideia`, { ideia }, { withCredentials: true })
      );
    }

    public async continueConversation(
      conversationId: string,
      userMessage: string
    ): Promise<IdeiaResponse> {
      return firstValueFrom(
        this.http.post<IdeiaResponse>(`${this.backendUri}/api/v1/saca-ideia/chat`, {
          conversation_id: conversationId,
          message: userMessage,
        }, { withCredentials: true })
      );
    }

    public async getConversations(
      offset = 0,
      limit = 3,
      orderBy: 'updated_at' | 'created_at' = 'updated_at',
    ): Promise<ConversationsResponse> {
      return firstValueFrom(
        this.http.get<ConversationsResponse>(
          `${this.backendUri}/api/v1/conversations?offset=${offset}&limit=${limit}&order_by=${orderBy}&order_direction=desc`,
          { withCredentials: true },
        ),
      );
    }

    public async deleteConversation(conversationId: string): Promise<void> {
      await firstValueFrom(
        this.http.delete<void>(
          `${this.backendUri}/api/v1/conversations/${encodeURIComponent(conversationId)}`,
          { withCredentials: true },
        ),
      );
    }
}
