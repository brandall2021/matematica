import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

interface AuditLogEntry {
  id: number;
  userId: string;
  username: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface AuditPageResponse {
  content: AuditLogEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface AuditStats {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByEntity: Record<string, number>;
  eventsByUser: Record<string, number>;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatPaginatorModule, MatChipsModule, MatTooltipModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="audit-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Registro de Auditoria</mat-card-title>
          <mat-card-subtitle>Historial de acciones de usuarios</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Usuario</mat-label>
              <input matInput [(ngModel)]="filterUserId" placeholder="ID de usuario">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Accion</mat-label>
              <mat-select [(ngModel)]="filterAction">
                <mat-option value="">Todas</mat-option>
                <mat-option *ngFor="let a of actions" [value]="a">{{ a }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Entidad</mat-label>
              <mat-select [(ngModel)]="filterEntityType">
                <mat-option value="">Todas</mat-option>
                <mat-option *ngFor="let e of entityTypes" [value]="e">{{ e }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Desde</mat-label>
              <input matInput [matDatepicker]="fromPicker" [(ngModel)]="filterFrom">
              <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
              <mat-datepicker #fromPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Hasta</mat-label>
              <input matInput [matDatepicker]="toPicker" [(ngModel)]="filterTo">
              <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
              <mat-datepicker #toPicker></mat-datepicker>
            </mat-form-field>

            <div class="filter-actions">
              <button mat-raised-button color="primary" (click)="applyFilters()">
                <mat-icon>search</mat-icon> Buscar
              </button>
              <button mat-stroked-button (click)="clearFilters()">
                <mat-icon>clear</mat-icon> Limpiar
              </button>
              <button mat-stroked-button (click)="exportCsv()" [disabled]="logs().length === 0">
                <mat-icon>download</mat-icon> CSV
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card *ngIf="stats()" class="stats-card">
        <mat-card-content>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ stats()!.totalEvents }}</span>
              <span class="stat-label">Total Eventos</span>
            </div>
            <div class="stat-item" *ngFor="let entry of topActions()">
              <span class="stat-value">{{ entry.count }}</span>
              <span class="stat-label">{{ entry.action }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <div *ngIf="loading()" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div *ngIf="!loading() && logs().length === 0" class="empty-state">
            <mat-icon class="empty-icon">history</mat-icon>
            <h3>No hay registros</h3>
            <p>Ajusta los filtros para ver resultados.</p>
          </div>

          <table mat-table [dataSource]="logs()" class="full-width" *ngIf="!loading() && logs().length > 0">
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let log">{{ formatDate(log.createdAt) }}</td>
            </ng-container>

            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>Usuario</th>
              <td mat-cell *matCellDef="let log">{{ log.username || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef>Accion</th>
              <td mat-cell *matCellDef="let log">
                <mat-chip [class]="'action-' + log.action.toLowerCase()">{{ log.action }}</mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="entityType">
              <th mat-header-cell *matHeaderCellDef>Entidad</th>
              <td mat-cell *matCellDef="let log">{{ log.entityType || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="entityId">
              <th mat-header-cell *matHeaderCellDef>ID Entidad</th>
              <td mat-cell *matCellDef="let log">{{ log.entityId || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="ipAddress">
              <th mat-header-cell *matHeaderCellDef>IP</th>
              <td mat-cell *matCellDef="let log">{{ log.ipAddress || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="details">
              <th mat-header-cell *matHeaderCellDef>Detalles</th>
              <td mat-cell *matCellDef="let log">
                <button mat-icon-button *ngIf="log.details" (click)="toggleDetails(log)"
                        matTooltip="Ver detalles">
                  <mat-icon>{{ expandedRow === log.id ? 'expand_less' : 'expand_more' }}</mat-icon>
                </button>
              </td>
            </ng-container>

            <ng-container matColumnDef="expandedDetail">
              <td mat-cell *matCellDef="let log" [attr.colspan]="displayedColumns.length">
                <div *ngIf="expandedRow === log.id" class="expanded-detail">
                  <pre>{{ formatDetails(log.details) }}</pre>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                (click)="toggleDetails(row)"></tr>
          </table>

          <mat-paginator *ngIf="!loading() && logs().length > 0"
                         [length]="totalElements()"
                         [pageSize]="pageSize"
                         [pageSizeOptions]="[10, 25, 50, 100]"
                         (page)="onPage($event)"
                         showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .audit-container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: flex-start; }
    .filters mat-form-field { flex: 1; min-width: 150px; }
    .filter-actions { display: flex; gap: 0.5rem; align-items: center; padding-top: 0.5rem; }
    .stats-grid { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .stat-item { display: flex; flex-direction: column; align-items: center; }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #1976d2; }
    .stat-label { font-size: 0.8rem; color: #666; }
    .full-width { width: 100%; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .empty-state { text-align: center; padding: 2rem; color: #666; }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; }
    .expanded-detail { padding: 1rem; background: #f5f5f5; border-radius: 4px; }
    .expanded-detail pre { margin: 0; white-space: pre-wrap; font-size: 0.85rem; }
    .action-login { background-color: #e3f2fd !important; }
    .action-logout { background-color: #fce4ec !important; }
    .action-chat_send { background-color: #e8f5e9 !important; }
    .action-doc_upload { background-color: #fff3e0 !important; }
    .action-doc_delete { background-color: #fbe9e7 !important; }
    .action-rag_index { background-color: #f3e5f5 !important; }
    .action-settings_change { background-color: #e0f2f1 !important; }
    tr.mat-mdc-row { cursor: pointer; }
    tr.mat-mdc-row:hover { background-color: #f5f5f5; }

    @media (max-width: 768px) {
      .filters mat-form-field { min-width: 100%; }
    }
  `]
})
export class AuditComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  logs = signal<AuditLogEntry[]>([]);
  stats = signal<AuditStats | null>(null);
  loading = signal(false);
  totalElements = signal(0);
  expandedRow: number | null = null;

  filterUserId = '';
  filterAction = '';
  filterEntityType = '';
  filterFrom: Date | null = null;
  filterTo: Date | null = null;

  currentPage = 0;
  pageSize = 25;

  displayedColumns = ['createdAt', 'username', 'action', 'entityType', 'entityId', 'ipAddress', 'details'];

  actions = ['LOGIN', 'LOGOUT', 'CHAT_SEND', 'DOC_UPLOAD', 'DOC_DELETE', 'RAG_INDEX', 'SETTINGS_CHANGE'];
  entityTypes = ['USER', 'DOCUMENT', 'CHAT_SESSION', 'SETTINGS'];

  topActions = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return Object.entries(s.eventsByAction)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  });

  ngOnInit(): void {
    this.loadLogs();
    this.loadStats();
  }

  loadLogs(): void {
    this.loading.set(true);
    const params: Record<string, string | number> = {
      page: this.currentPage,
      size: this.pageSize
    };
    if (this.filterUserId) params['userId'] = this.filterUserId;
    if (this.filterAction) params['action'] = this.filterAction;
    if (this.filterEntityType) params['entityType'] = this.filterEntityType;
    if (this.filterFrom) params['from'] = this.formatDateParam(this.filterFrom);
    if (this.filterTo) params['to'] = this.formatDateParam(this.filterTo);

    this.api.getAuditLogs(params).subscribe({
      next: (res) => {
        this.logs.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar registros de auditoria', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);

    this.api.getAuditStats(this.formatDateParam(from), this.formatDateParam(to)).subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {}
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadLogs();
    this.loadStats();
  }

  clearFilters(): void {
    this.filterUserId = '';
    this.filterAction = '';
    this.filterEntityType = '';
    this.filterFrom = null;
    this.filterTo = null;
    this.currentPage = 0;
    this.loadLogs();
    this.loadStats();
  }

  onPage(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }

  toggleDetails(log: AuditLogEntry): void {
    this.expandedRow = this.expandedRow === log.id ? null : log.id;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  formatDetails(details: string): string {
    if (!details) return '';
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch {
      return details;
    }
  }

  exportCsv(): void {
    const headers = ['Fecha', 'Usuario', 'Accion', 'Entidad', 'ID Entidad', 'IP', 'Detalles'];
    const rows = this.logs().map(log => [
      this.formatDate(log.createdAt),
      log.username || '',
      log.action,
      log.entityType || '',
      log.entityId?.toString() || '',
      log.ipAddress || '',
      (log.details || '').replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  private formatDateParam(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
