import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DraftService } from '../services/draft.service';
import { DraftCardComponent } from './draft-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DraftCardComponent, DatePipe],
  template: `
    <div class="space-y-6">
      
      <!-- Dashboard Controls & Tabs -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-1">
        
        <!-- Tab Navigation -->
        <nav class="flex space-x-8" aria-label="Tabs">
          <button 
            (click)="currentTab.set('queue')"
            [class.border-blue-500]="currentTab() === 'queue'"
            [class.text-blue-600]="currentTab() === 'queue'"
            [class.border-transparent]="currentTab() !== 'queue'"
            [class.text-gray-500]="currentTab() !== 'queue'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 transition-colors flex items-center gap-2"
          >
            <span>Approval Queue</span>
            @if (pendingDrafts().length > 0) {
              <span class="bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-bold">{{ pendingDrafts().length }}</span>
            }
          </button>

          <button 
            (click)="currentTab.set('history')"
            [class.border-blue-500]="currentTab() === 'history'"
            [class.text-blue-600]="currentTab() === 'history'"
            [class.border-transparent]="currentTab() !== 'history'"
            [class.text-gray-500]="currentTab() !== 'history'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 transition-colors flex items-center gap-2"
          >
            <span>History Log</span>
            <span class="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-bold">{{ historyDrafts().length }}</span>
          </button>
        </nav>

        <!-- Global Actions -->
        <button 
          (click)="draftService.loadDrafts()" 
          [disabled]="draftService.loading()"
          class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-2 sm:mb-0"
        >
          <svg [class.animate-spin]="draftService.loading()" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {{ draftService.loading() ? 'Syncing...' : 'Refresh' }}
        </button>
      </div>

      <!-- Loading State -->
      @if (draftService.loading()) {
        <div class="flex flex-col items-center justify-center py-24 space-y-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div class="relative">
            <div class="w-12 h-12 border-4 border-blue-100 rounded-full"></div>
            <div class="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p class="text-gray-500 text-sm font-medium animate-pulse">Syncing data...</p>
        </div>
      }

      <!-- TAB CONTENT: QUEUE -->
      @if (!draftService.loading() && currentTab() === 'queue') {
        
        @if (pendingDrafts().length === 0) {
          <div class="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div class="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-10 h-10">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900">All Caught Up!</h3>
            <p class="text-gray-500 mt-2 max-w-sm mx-auto">There are no pending message drafts to review right now.</p>
          </div>
        }

        <div class="grid gap-6">
          @for (draft of pendingDrafts(); track draft.id) {
            <app-draft-card 
              [draft]="draft"
              (approve)="handleApprove($event)"
              (reject)="handleReject($event)"
              (save)="handleSave($event)"
            ></app-draft-card>
          }
        </div>
      }

      <!-- TAB CONTENT: HISTORY -->
      @if (!draftService.loading() && currentTab() === 'history') {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Message</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CSAT</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (draft of historyDrafts(); track draft.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ draft.processedAt | date:'MMM d, y, h:mm a' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ draft.customerName }}</div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-600 max-w-xs truncate" [title]="draft.draftMessage">
                        {{ draft.draftMessage || '(No message sent)' }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                        [class.bg-green-100]="draft.status === 'APPROVED'"
                        [class.text-green-800]="draft.status === 'APPROVED'"
                        [class.bg-red-100]="draft.status === 'REJECTED'"
                        [class.text-red-800]="draft.status === 'REJECTED'">
                        {{ draft.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      @if (draft.satisfactionScore) {
                         <div class="flex items-center text-yellow-400">
                           <span class="mr-1 font-bold text-gray-700">{{ draft.satisfactionScore }}</span>
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                              <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
                            </svg>
                         </div>
                      } @else {
                        <span class="text-gray-300">-</span>
                      }
                    </td>
                  </tr>
                }
                @if (historyDrafts().length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-10 text-center text-gray-500 text-sm">
                      No history available yet. Process some drafts to see them here.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent {
  draftService = inject(DraftService);
  
  // State for tabs
  currentTab = signal<'queue' | 'history'>('queue');

  // Computed views of the data
  pendingDrafts = computed(() => 
    this.draftService.drafts().filter(d => d.status === 'PENDING')
  );

  historyDrafts = computed(() => 
    this.draftService.drafts()
      .filter(d => d.status !== 'PENDING')
      .sort((a, b) => {
        const dateA = new Date(a.processedAt || 0).getTime();
        const dateB = new Date(b.processedAt || 0).getTime();
        return dateB - dateA; // Newest first
      })
  );

  handleApprove(event: { id: string, message: string }) {
    this.draftService.approveDraft(event.id, event.message);
  }

  handleReject(id: string) {
    this.draftService.rejectDraft(id);
  }

  handleSave(event: { id: string, message: string }) {
    this.draftService.updateDraftContent(event.id, event.message);
  }
}