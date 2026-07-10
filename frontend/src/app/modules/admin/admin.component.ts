import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="admin-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Administracion</mat-card-title>
          <mat-card-subtitle>Gestion del sistema</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="actions">
            <button mat-raised-button color="primary" (click)="reindex()" [disabled]="loading()">
              <mat-icon>refresh</mat-icon> {{ loading() ? 'Reindexando...' : 'Reindexar Todos los Documentos' }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 800px; margin: 0 auto; }
    .actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem; }

    @media (max-width: 480px) {
      .actions { flex-direction: column; }
      .actions button { width: 100%; }
    }
  `]
})
export class AdminComponent {
  private snackBar = inject(MatSnackBar);
  loading = signal(false);

  constructor(private api: ApiService) {}

  reindex(): void {
    this.loading.set(true);
    this.api.reindexAll().subscribe({
      next: () => {
        this.snackBar.open('Reindexacion iniciada correctamente', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
      error: (err) => {
        this.snackBar.open('Error al reindexar: ' + err.message, 'Cerrar', { duration: 5000 });
        this.loading.set(false);
      }
    });
  }
}
