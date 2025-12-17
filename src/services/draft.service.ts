import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CustomerDraft, ProcessDraftPayload } from '../models/draft.model';
import { catchError, map, of, tap, timer, finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private http = inject(HttpClient);
  
  // Replace this with your actual n8n webhook URL
  private readonly API_BASE = 'https://your-n8n-instance.com/webhook';

  // State
  readonly drafts = signal<CustomerDraft[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadDrafts();
  }

  loadDrafts() {
    this.loading.set(true);
    this.error.set(null);

    // MOCK DATA IMPLEMENTATION
    const mockData: CustomerDraft[] = [
      // Pending Items
      {
        id: '1',
        customerName: 'Alice Johnson',
        contextSummary: 'Customer complained about delivery delay (Ticket #4021). Previous sentiment: Negative.',
        draftMessage: 'Hi Alice, we sincerely apologize for the delay with your order #4021. We have expedited the shipping and it should arrive by tomorrow. Thank you for your patience.',
        status: 'PENDING'
      },
      {
        id: '2',
        customerName: 'TechSolutions Inc.',
        contextSummary: 'Inquiry about Enterprise Plan pricing. High-value prospect.',
        draftMessage: 'Hello, following up on our demo. Are you ready to proceed with the Enterprise Plan? Let me know.',
        status: 'PENDING'
      },
      // History Items (Already Processed)
      {
        id: '101',
        customerName: 'Marcus Aurelius',
        contextSummary: 'Refund request for defective product.',
        draftMessage: 'We have processed your refund, Marcus. It will appear in 3-5 days.',
        status: 'APPROVED',
        processedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        satisfactionScore: 5
      },
      {
        id: '102',
        customerName: 'Cleopatra Egypt',
        contextSummary: 'Spam/Solicitation message.',
        draftMessage: '',
        status: 'REJECTED',
        processedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
      {
        id: '103',
        customerName: 'Julius Caesar',
        contextSummary: 'Feedback on new feature.',
        draftMessage: 'Thank you for your feedback, Julius! We passed it to the product team.',
        status: 'APPROVED',
        processedAt: new Date(Date.now() - 250000000).toISOString(), // 3 days ago
        satisfactionScore: 3
      }
    ];

    // Simulate API call
    setTimeout(() => {
      this.drafts.set(mockData);
      this.loading.set(false);
    }, 800);
  }

  approveDraft(id: string, finalMessage: string) {
    this.updateLocalStatus(id, 'APPROVED');
    this.processDraftApi({ id, action: 'APPROVE', finalMessage });
  }

  rejectDraft(id: string) {
    this.updateLocalStatus(id, 'REJECTED');
    this.processDraftApi({ id, action: 'REJECT' });
  }

  updateDraftContent(id: string, newMessage: string) {
    this.drafts.update(current => 
      current.map(d => d.id === id ? { ...d, draftMessage: newMessage } : d)
    );
  }

  regenerateDraft(id: string, target: 'CONTEXT' | 'MESSAGE') {
    // Return an observable so the component can subscribe and handle loading state
    return timer(2000).pipe( // Simulate 2s AI delay
      map(() => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (target === 'CONTEXT') {
          return `[Updated ${timestamp}] Deep dive analysis: Customer has opened 3 tickets in the last week regarding logistics. Sentiment detected: Frustrated but open to resolution. High churn risk.`;
        } else {
          return `[AI Draft ${timestamp}] Dear Customer, thank you for your patience. We have reviewed your request and I am personally overseeing the resolution. Expect an update within 2 hours.`;
        }
      }),
      tap((newContent) => {
        // Update the store
        this.drafts.update(current => 
          current.map(d => {
            if (d.id !== id) return d;
            return target === 'CONTEXT' 
              ? { ...d, contextSummary: newContent }
              : { ...d, draftMessage: newContent };
          })
        );
      })
    );
  }

  private updateLocalStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    // We do NOT filter out processed items anymore, so they appear in History
    this.drafts.update(current => 
      current.map(d => d.id === id ? { 
        ...d, 
        status,
        processedAt: new Date().toISOString() // Mark time of action
      } : d)
    );
  }

  private processDraftApi(payload: ProcessDraftPayload) {
    console.log('Sending to n8n:', payload);
  }
}