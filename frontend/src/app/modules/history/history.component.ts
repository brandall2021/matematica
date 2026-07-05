import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule],
  template: `
    <div class="history-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Historial</mat-card-title>
          <mat-card-subtitle>Tus consultas anteriores</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-list *ngIf="history().length > 0; else empty">
            <mat-list-item *ngFor="let item of history()">
              <mat-icon matListItemIcon>chat</mat-icon>
              <div matListItemTitle>{{ item.content?.substring(0, 100) }}</div>
              <div matListItemLine>{{ item.createdAt | date:'short' }}</div>
            </mat-list-item>
          </mat-list>
          <ng-template #empty>
            <p class="empty">No hay consultas registradas</p>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .history-container { max-width: 800px; margin: 0 auto; }
    .empty { text-align: center; color: #666; padding: 2rem; }
  `]
})
export class HistoryComponent {
  history = signal<any[]>([]);

  constructor(private api: ApiService) {
    this.api.getHistory().subscribe({
      next: (res) => this.history.set(res.content || [])
    });
  }
}
