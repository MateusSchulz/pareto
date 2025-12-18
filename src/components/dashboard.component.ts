import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DraftService } from '../services/draft.service';
import { DraftCardComponent } from './draft-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DraftCardComponent],
  template: `
    <div class="space-y-6">
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-1">
        <nav class="flex space-x-8" aria-label="Tabs">
          <button (click)="currentTab.set('queue')" [class.border-blue-500]="currentTab() === 'queue'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2" [ngClass]="currentTab() === 'queue' ? 'text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
            <span>Approval Queue</span>
            @if (pendingDrafts().length > 0) { <span class="bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-bold">{{ pendingDrafts().length }}</span> }
          </button>
          <button (click)="currentTab.set('history')" [class.border-blue-500]="currentTab() === 'history'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2" [ngClass]="currentTab() === 'history' ? 'text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
            <span>History Log</span>
            <span class="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-bold">{{ historyDrafts().length }}</span>
          </button>
        </nav>
        <button (click)="draftService.getDrafts()" class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mb-2 sm:mb-0">
          Sync
        </button>
      </div>

      @if (!draftService.loading() && currentTab() === 'queue') {
        <div class="grid gap-6">
          @if (pendingDrafts().length === 0) { <div class="p-10 text-center text-gray-500">No pending drafts.</div> }
          @for (draft of pendingDrafts(); track draft.ID) {
            <app-draft-card [draft]="draft" (approve)="handleApprove($event)" (reject)="handleReject($event)" (save)="handleSave($event)"></app-draft-card>
          }
        </div>
      }

      @if (!draftService.loading() && currentTab() === 'history') {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CSAT</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (draft of historyDrafts(); track draft.ID) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ draft.Data }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ draft.Cliente }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 text-xs font-semibold rounded-full" [ngClass]="draft.Status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">{{ draft.Status }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ draft.SatisfactionScore ? '⭐ ' + draft.SatisfactionScore : '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        (click)="draftService.openChat(draft)"
                        class="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors text-xs font-bold uppercase tracking-wide"
                      >
                        <span>💬 View Chat</span>
                      </button>
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
export class DashboardComponent implements OnInit {
  draftService = inject(DraftService);
  currentTab = signal<'queue' | 'history'>('queue');

  ngOnInit() { this.draftService.getDrafts(); }

  pendingDrafts = computed(() => this.draftService.drafts().filter(d => d.Status === 'PENDING'));
  
  historyDrafts = computed(() => 
    this.draftService.drafts()
      .filter(d => d.Status !== 'PENDING')
      .sort((a, b) => new Date(b.ProcessedAt || '').getTime() - new Date(a.ProcessedAt || '').getTime())
  );

  handleApprove(event: any) { this.draftService.approveDraft(event.id, event.message); }
  handleReject(id: string) { this.draftService.rejectDraft(id); }
  handleSave(event: any) { this.draftService.updateDraftContent(event.id, event.message); }
}