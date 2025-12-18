import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CustomerDraft, ProcessDraftPayload } from '../models/draft.model';
import { catchError, map, of, tap, timer, finalize } from 'rxjs';

export interface ChatMessage {
  sender: 'client' | 'bot' | 'human';
  text: string;
  time: string;
}

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private http = inject(HttpClient);
  private readonly API_BASE = 'http://localhost:5678/webhook/api/drafts';

  // State
  // Chat State
  readonly activeChat = signal<CustomerDraft | null>(null);
  readonly chatHistory = signal<ChatMessage[]>([
    { sender: 'client', text: 'Hi, I have an issue with my recent order.', time: '10:00 AM' },
    { sender: 'bot', text: 'Hello! I can help with that. Could you please provide your Order ID?', time: '10:01 AM' },
    { sender: 'client', text: 'Sure, it is #12345.', time: '10:02 AM' },
    { sender: 'bot', text: 'Thank you. I see the delay. I have prioritized it for shipping today.', time: '10:03 AM' },
    { sender: 'bot', text: 'On a scale of 1-5, how satisfied are you with this resolution?', time: '10:03 AM' },
    { sender: 'client', text: '4', time: '10:04 AM' },
    { sender: 'human', text: 'Hi, Manager here. I wanted to personally apologize for the delay.', time: '10:05 AM' }
  ]);

  readonly drafts = signal<CustomerDraft[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  openChat(draft: CustomerDraft) {
    this.activeChat.set(draft);
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
}