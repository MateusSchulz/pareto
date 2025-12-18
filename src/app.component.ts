import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { DraftService } from './services/draft.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
})
export class AppComponent {
  // We keep DraftService here just to access the count for the header badge
  draftService = inject(DraftService);
  
  pendingCount = computed(() => 
    this.draftService.drafts().filter(d => d.Status === 'PENDING').length
  );
}