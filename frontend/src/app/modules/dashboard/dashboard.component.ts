import { Component, signal, inject, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, AdminStats } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard">
      <h2>Dashboard</h2>
      <div class="stats-grid">
        <mat-card *ngFor="let stat of statCards">
          <mat-card-content class="stat-card">
            <mat-icon>{{ stat.icon }}</mat-icon>
            <div>
              <div class="stat-value" #statValue>{{ stat.value }}</div>
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
    .stat-card {
      display: flex; align-items: center; gap: 1rem; padding: 1rem;
      opacity: 0;
      animation: fadeInUp 300ms ease-out forwards;
    }
    .stat-card:nth-child(1) { animation-delay: 50ms; }
    .stat-card:nth-child(2) { animation-delay: 100ms; }
    .stat-card:nth-child(3) { animation-delay: 150ms; }
    .stat-card:nth-child(4) { animation-delay: 200ms; }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { color: #666; }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .stat-card { flex-direction: column; text-align: center; gap: 0.5rem; padding: 0.75rem; }
      .stat-value { font-size: 1.5rem; }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent {
  private snackBar = inject(MatSnackBar);
  @ViewChildren('statValue') statValues!: QueryList<ElementRef<HTMLElement>>;
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
        setTimeout(() => {
          this.statValues.forEach((el, i) => {
            const numericValue = parseFloat(this.statCards[i].value);
            if (!isNaN(numericValue)) {
              this.animateValue(el.nativeElement, numericValue, this.statCards[i].value.includes('.'));
            }
          });
        });
      },
      error: () => {
        this.snackBar.open('No se pudieron cargar las estadísticas. Revisa tu conexión.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  private animateValue(element: HTMLElement, end: number, isFloat: boolean) {
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const current = progress * end;
      element.textContent = isFloat ? current.toFixed(2) : Math.floor(current).toString();
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}
