import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { ApiService, AdminStats } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatGridListModule],
  template: `
    <div class="dashboard">
      <h2>Dashboard</h2>
      <div class="stats-grid">
        <mat-card *ngFor="let stat of statCards">
          <mat-card-content class="stat-card">
            <mat-icon>{{ stat.icon }}</mat-icon>
            <div>
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1000px; margin: 0 auto; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .stat-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { color: #666; }
  `]
})
export class DashboardComponent {
  statCards: any[] = [];

  constructor(private api: ApiService) {
    this.api.getAdminStats().subscribe({
      next: (stats) => {
        this.statCards = [
          { icon: 'description', label: 'Documentos', value: stats.totalDocuments },
          { icon: 'storage', label: 'Indexados', value: stats.indexedDocuments },
          { icon: 'chat', label: 'Consultas Hoy', value: stats.dailyQueries },
          { icon: 'speed', label: 'Tiempo Prom. (s)', value: stats.avgResponseTime.toFixed(2) },
        ];
      }
    });
  }
}
