import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CustomerDraft, ProcessDraftPayload } from '../models/draft.model';
import { catchError, map, of, tap, timer, finalize, Observable } from 'rxjs';
import { text } from 'stream/consumers';

export interface ChatMessage {
  from: 'client' | 'bot' | 'human';
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private http = inject(HttpClient);
  private readonly API_BASE = 'https://wake-victoria-tonight-hardly.trycloudflare.com/webhook/api/drafts';
  readonly drafts = signal<CustomerDraft[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private readonly API_HISTORY = 'https://wake-victoria-tonight-hardly.trycloudflare.com/webhook/api/chat-history';
  readonly activeChat = signal<CustomerDraft | null>(null);
  readonly chatHistory = signal<ChatMessage[]>([]);
  readonly loadingChat = signal<boolean>(false); // Novo loading só pro chat

  private readonly API_MESSAGES = 'https://wake-victoria-tonight-hardly.trycloudflare.com/webhook/api/messages';
  private readonly API_TOGGLE = 'https://wake-victoria-tonight-hardly.trycloudflare.com/webhook/api/toggle-ai';

  openChat(draft: CustomerDraft) {
    this.activeChat.set(draft);
    this.chatHistory.set([]); // Limpa o chat anterior para não piscar dados velhos
    
    // Se o draft tiver um ID de Telegram, busca o histórico real
    if (draft.TelegramChatID) {
      this.fetchChatHistory(draft.TelegramChatID);
    } else {
      // Fallback se não tiver ID: mostra mensagem de erro ou vazio
      this.chatHistory.set([{ 
        from: 'bot', 
        message: 'Erro: Cliente sem Telegram ID vinculado.', 
        timestamp: '--:--' 
      }]);
    }
  }

  fetchChatHistory(telegramChatId: string) {
    this.loadingChat.set(true);
    
    const params = new HttpParams().set('chat_id', telegramChatId);

    this.http.get<ChatMessage[]>(this.API_HISTORY, { params }).pipe(
      tap(history => {
        // Atualiza o sinal com os dados reais do Google Sheets
        this.chatHistory.set(history);
      }),
      catchError(err => {
        console.error('Erro ao buscar chat:', err);
        // Fallback visual em caso de erro
        this.chatHistory.set([{ 
          from: 'bot', 
          message: 'Não foi possível carregar o histórico.', 
          timestamp: 'Erro' 
        }]);
        return of([]);
      }),
      finalize(() => this.loadingChat.set(false))
    ).subscribe();
  }

  closeChat() {
    this.activeChat.set(null);
  }

  constructor() {
    this.getDrafts();
  }

  getDrafts() {
    this.loading.set(true);
    this.error.set(null);
    
    this.http.get<CustomerDraft[]>(this.API_BASE).pipe(
      tap(data => {
        if (Array.isArray(data)) {
          this.drafts.set(data);
        } else {
          console.warn('API did not return an array:', data);
          this.drafts.set([]);
          this.error.set('Invalid data format received from server.');
        }
      }),
      catchError(err => {
        console.error('Error fetching drafts:', err);
        this.error.set('Failed to load drafts. Is n8n running?');
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  approveDraft(id: string, finalMessage: string) {
    this.loading.set(true);
    return this.http.post(this.API_BASE, { id, action: 'APPROVE', finalMessage }).pipe(
      tap(() => this.getDrafts()), // Refresh list after action
      catchError(err => {
        this.error.set('Failed to approve draft');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  rejectDraft(id: string) {
    this.loading.set(true);
    return this.http.post(this.API_BASE, { id, action: 'REJECT' }).pipe(
      tap(() => this.getDrafts()), // Refresh list after action
      catchError(err => {
        this.error.set('Failed to reject draft');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  regenerateDraft(id: string, context: string, client: string) {
    this.loading.set(true);
    return this.http.post<{ newDraft: string }>(this.API_BASE, { id, action: 'REGENERATE', context, client }).pipe(
      tap(response => {
        if (response?.newDraft) {
          this.updateDraftContent(id, response.newDraft);
        }
        this.getDrafts();
      }),
      catchError(err => {
        this.error.set('Failed to regenerate draft');
        throw err;
      }),
      finalize(() => this.loading.set(false))
    );
  }

  updateDraftContent(id: string, newMessage: string) {
    this.drafts.update(current => 
      current.map(d => d.ID === id ? { ...d, DraftMessage: newMessage } : d)
    );
  }

  sendHumanMessage(text: string) {
    const currentChat = this.activeChat();
    
    // Segurança: Se não tiver chat aberto ou não tiver ID do Telegram, não faz nada
    if (!currentChat || !currentChat.TelegramChatID) {
      console.error('Erro: Chat sem ID do Telegram vinculado.');
      return;
    }

    // 1. Atualização Otimista (Mostra na tela na hora para não parecer travado)
    this.chatHistory.update(history => [
      ...history,
      { 
        from: 'human', 
        message: text, 
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
      }
    ]);

    // 2. Envia para o n8n (Fire and Forget - ou tratamos erro se falhar)
    const body = {
      chat_id: currentChat.TelegramChatID,
      text: text
    };

    // Usando a URL que você já definiu: API_MESSAGES
    this.http.post(this.API_MESSAGES, body).subscribe({
      next: (res) => console.log('Enviado para n8n:', res),
      error: (err) => {
        console.error('Erro ao enviar para n8n:', err);
        // Opcional: Adicionar aviso visual de erro no chatHistory se falhar
      }
    });
  }

  sendMessage(chatId: string, text: string): Observable<any> {
    const body = {
      chat_id: chatId,
      text: text
    };

    return this.http.post(this.API_MESSAGES, body);
  }

  toggleAI(chatId: string, status: boolean) {
    const body = {
      chat_id: chatId,
      status: status
    };

    return this.http.post(this.API_TOGGLE, body).pipe(
      tap(() => console.log(`IA alterada para: ${status}`)),
      catchError(err => {
        console.error('Erro ao alterar IA', err);
        return of(null);
      })
    );
  }
}
