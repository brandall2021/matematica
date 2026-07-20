import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatListModule, MatButtonModule, MatIconModule],
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
            <div class="empty-state">
              <mat-icon class="empty-icon">history</mat-icon>
              <h3>Aún no hay consultas</h3>
              <p>Empieza una conversación con el tutor para ver tu historial aquí.</p>
              <button mat-raised-button color="primary" routerLink="/chat">
                <mat-icon>chat</mat-icon>
                Abrir Chat
              </button>
            </div>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .history-container { max-width: 800px; margin: 0 auto; }
    .empty-state { text-align: center; padding: 3rem 1rem; color: #666; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #bdbdbd; }
    .empty-state h3 { margin: 1rem 0 0.5rem; color: #424242; }
    .empty-state p { margin: 0 0 1.5rem; max-width: 360px; margin-left: auto; margin-right: auto; }

    @media (max-width: 480px) {
      .empty-state { padding: 1.5rem 1rem; }
    }
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
