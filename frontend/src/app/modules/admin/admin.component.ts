import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="admin-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Administración</mat-card-title>
          <mat-card-subtitle>Gestión del sistema</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="actions">
            <button mat-raised-button color="primary" (click)="reindex()">
              <mat-icon>refresh</mat-icon> Reindexar Todos los Documentos
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 800px; margin: 0 auto; }
    .actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem; }
  `]
})
export class AdminComponent {
  constructor(private api: ApiService) {}

  reindex(): void {
    this.api.reindexAll().subscribe();
  }
}
