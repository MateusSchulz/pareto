import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerDraft } from '../models/draft.model';
import { DraftService } from '../services/draft.service';

@Component({
  selector: 'app-draft-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">{{ draft().Cliente }}</h3>
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">ID: {{ draft().ID }}</span>
        </div>
        <div class="flex items-center gap-3">
          @if(isEditing()) {
             <span class="px-2 py-1 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 uppercase tracking-wider">Editing Mode</span>
          }
          <div class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            {{ draft().Status }}
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        
        <!-- Context Section -->
        <div class="relative group">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-bold text-indigo-800 uppercase flex items-center gap-2">
              Context / History
              <!-- Context Regeneration Spinner -->
              @if (isRegeneratingContext()) {
                <svg class="animate-spin h-3 w-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
            </h4>
            
            <!-- Context Regenerate Button -->
            @if (!isRegeneratingContext() && draft().Status === 'PENDING') {
              <button 
                (click)="onRegenerate('CONTEXT')"
                class="text-indigo-400 hover:text-indigo-700 transition-colors p-1 rounded-md hover:bg-indigo-50"
                title="Regenerate Context with AI"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            }
          </div>
          
          <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100 transition-all" [class.opacity-60]="isRegeneratingContext()">
             <p class="text-sm text-indigo-900 leading-relaxed">{{ draft().Contexto }}</p>
          </div>
        </div>

        <!-- Message Section -->
        <div class="relative">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
              Draft Message 
              @if(isEditing()) { <span class="text-red-500">*</span> }
              
              <!-- Message Regeneration Spinner -->
              @if (isRegeneratingMessage()) {
                <svg class="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
            </label>

            <!-- Message Regenerate Button -->
            @if (!isEditing() && !isRegeneratingMessage() && draft().Status === 'PENDING') {
              <button 
                (click)="onRegenerate('MESSAGE')"
                class="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                title="Regenerate Draft Message with AI"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            }
          </div>
          
          <!-- View Mode: Read Only Display -->
          @if (!isEditing()) {
            <div class="w-full p-4 bg-gray-50 text-sm text-gray-800 border border-gray-200 rounded-lg leading-relaxed whitespace-pre-wrap transition-all" [class.opacity-60]="isRegeneratingMessage()">
              {{ draft().DraftMessage }}
            </div>
          }

          <!-- Edit Mode: Textarea -->
          @if (isEditing()) {
            <textarea 
              [ngModel]="tempMessage()"
              (ngModelChange)="tempMessage.set($event)"
              rows="5"
              placeholder="Write the message to the customer..."
              class="w-full p-3 text-sm text-gray-900 bg-white border border-blue-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-y shadow-sm"
            ></textarea>
          }
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
        
        <!-- Action Buttons for View Mode -->
        @if (!isEditing()) {
          <button 
            (click)="onReject()"
            [disabled]="isRegeneratingMessage() || isRegeneratingContext()"
            class="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject
          </button>
          
          <button 
            (click)="startEditing()"
            [disabled]="isRegeneratingMessage() || isRegeneratingContext()"
            class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-colors focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit Message
          </button>

          <button 
            (click)="onApprove()"
            [disabled]="isRegeneratingMessage() || isRegeneratingContext()"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Approve & Send</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        }

        <!-- Action Buttons for Edit Mode -->
        @if (isEditing()) {
          <button 
            (click)="cancelEditing()"
            class="px-4 py-2 text-gray-500 text-sm font-medium rounded-lg hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <button 
            (click)="saveEditing()"
            class="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 shadow-sm transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Save Changes
          </button>
        }
      </div>
    </div>
  `
})
export class DraftCardComponent {
  private draftService = inject(DraftService);
  draft = input.required<CustomerDraft>();
  
  approve = output<{ id: string, message: string }>();
  reject = output<string>();
  save = output<{ id: string, message: string }>();

  isEditing = signal(false);
  
  // Specific Loading States
  isRegeneratingContext = signal(false);
  isRegeneratingMessage = signal(false);

  tempMessage = signal('');

  startEditing() {
    this.tempMessage.set(this.draft().DraftMessage);
    this.isEditing.set(true);
  }

  cancelEditing() {
    this.isEditing.set(false);
    this.tempMessage.set(''); 
  }

  saveEditing() {
    this.save.emit({
      id: this.draft().ID,
      message: this.tempMessage()
    });
    this.isEditing.set(false);
  }

  onApprove() {
    this.draftService.approveDraft(this.draft().ID, this.draft().DraftMessage)
      .subscribe(() => {
        this.approve.emit({
          id: this.draft().ID,
          message: this.draft().DraftMessage
        });
      });
  }

  onReject() {
    this.draftService.rejectDraft(this.draft().ID)
      .subscribe(() => {
        this.reject.emit(this.draft().ID);
      });
  }

  onRegenerate(target: 'CONTEXT' | 'MESSAGE') {
    if (target === 'CONTEXT') {
      this.isRegeneratingContext.set(true);
    } else {
      this.isRegeneratingMessage.set(true);
    }

    this.draftService.regenerateDraft(this.draft().ID, this.draft().Contexto, this.draft().Cliente)
      .subscribe({
        error: () => {
          if (target === 'CONTEXT') {
            this.isRegeneratingContext.set(false);
          } else {
            this.isRegeneratingMessage.set(false);
          }
        },
        complete: () => {
          if (target === 'CONTEXT') {
            this.isRegeneratingContext.set(false);
          } else {
            this.isRegeneratingMessage.set(false);
          }
        }
      });
  }
}