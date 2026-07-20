import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

interface UsageStatsData {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalEstimatedCost: number;
  avgTokensPerRequest: number;
  uniqueUsers: number;
}

interface DailyUsageData {
  date: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
}

interface ModelUsageData {
  modelProvider: string;
  modelName: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
}

interface TopUserData {
  userId: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule,
    MatPaginatorModule, MatChipsModule, MatTooltipModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="analytics-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Usage Analytics</mat-card-title>
          <mat-card-subtitle>Token usage, costs, and activity metrics</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>From</mat-label>
              <input matInput [matDatepicker]="fromPicker" [(ngModel)]="fromDate">
              <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
              <mat-datepicker #fromPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>To</mat-label>
              <input matInput [matDatepicker]="toPicker" [(ngModel)]="toDate">
              <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
              <mat-datepicker #toPicker></mat-datepicker>
            </mat-form-field>
            <div class="filter-actions">
              <button mat-raised-button color="primary" (click)="loadData()">
                <mat-icon>refresh</mat-icon> Load
              </button>
              <button mat-stroked-button (click)="setLast7Days()">Last 7 Days</button>
              <button mat-stroked-button (click)="setLast30Days()">Last 30 Days</button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      @if (loading()) {
        <div class="spinner-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

      @if (stats()) {
        <div class="summary-cards">
          <mat-card class="summary-card">
            <mat-card-content>
              <mat-icon class="summary-icon">token</mat-icon>
              <div class="summary-value">{{ formatNumber(stats()!.totalTokens) }}</div>
              <div class="summary-label">Total Tokens</div>
              <div class="summary-sub">Input: {{ formatNumber(stats()!.totalInputTokens) }} | Output: {{ formatNumber(stats()!.totalOutputTokens) }}</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <mat-icon class="summary-icon cost">attach_money</mat-icon>
              <div class="summary-value">{{ '$' + stats()!.totalEstimatedCost.toFixed(2) }}</div>
              <div class="summary-label">Estimated Cost</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <mat-icon class="summary-icon requests">http</mat-icon>
              <div class="summary-value">{{ formatNumber(stats()!.totalRequests) }}</div>
              <div class="summary-label">Total Requests</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <mat-icon class="summary-icon users">people</mat-icon>
              <div class="summary-value">{{ stats()!.uniqueUsers }}</div>
              <div class="summary-label">Unique Users</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <mat-icon class="summary-icon avg">speed</mat-icon>
              <div class="summary-value">{{ formatNumber(Math.round(stats()!.avgTokensPerRequest)) }}</div>
              <div class="summary-label">Avg Tokens/Request</div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="charts-row">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Daily Usage</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="bar-chart">
                @for (day of dailyUsage(); track day.date) {
                  <div class="bar-item">
                    <div class="bar-label">{{ day.date.substring(5) }}</div>
                    <div class="bar-track">
                      <div class="bar-fill tokens" [style.width.%]="getBarWidth(day.totalTokens, maxDailyTokens())"></div>
                    </div>
                    <div class="bar-value">{{ formatNumber(day.totalTokens) }}</div>
                  </div>
                }
                @if (dailyUsage().length === 0) {
                  <div class="no-data">No daily data available</div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Model Breakdown</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="bar-chart">
                @for (model of modelBreakdown(); track model.modelProvider + model.modelName) {
                  <div class="bar-item">
                    <div class="bar-label">{{ model.modelProvider }}@if (model.modelName) { <span class="sub">/ {{ model.modelName }}</span> }</div>
                    <div class="bar-track">
                      <div class="bar-fill model" [style.width.%]="getBarWidth(model.totalTokens, maxModelTokens())"></div>
                    </div>
                    <div class="bar-value">{{ formatNumber(model.totalTokens) }} tokens</div>
                  </div>
                }
                @if (modelBreakdown().length === 0) {
                  <div class="no-data">No model data available</div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Top Users</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="topUsers()" class="full-width-table">
              <ng-container matColumnDef="userId">
                <th mat-header-cell *matHeaderCellDef>User ID</th>
                <td mat-cell *matCellDef="let user">{{ user.userId }}</td>
              </ng-container>
              <ng-container matColumnDef="requestCount">
                <th mat-header-cell *matHeaderCellDef>Requests</th>
                <td mat-cell *matCellDef="let user">{{ user.requestCount }}</td>
              </ng-container>
              <ng-container matColumnDef="totalTokens">
                <th mat-header-cell *matHeaderCellDef>Total Tokens</th>
                <td mat-cell *matCellDef="let user">{{ formatNumber(user.totalTokens) }}</td>
              </ng-container>
              <ng-container matColumnDef="totalCost">
                <th mat-header-cell *matHeaderCellDef>Cost</th>
                <td mat-cell *matCellDef="let user">{{ '$' + user.totalCost.toFixed(4) }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="topUserColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: topUserColumns;"></tr>
            </table>
            @if (topUsers().length === 0) {
              <div class="no-data">No user data available</div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: flex-start;
    }
    .filters mat-form-field {
      flex: 0 1 180px;
    }
    .filter-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .spinner-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    .summary-card {
      text-align: center;
    }
    .summary-card mat-card-content {
      padding: 1.5rem 1rem !important;
    }
    .summary-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #3f51b5;
    }
    .summary-icon.cost { color: #4caf50; }
    .summary-icon.requests { color: #ff9800; }
    .summary-icon.users { color: #9c27b0; }
    .summary-icon.avg { color: #00bcd4; }
    .summary-value {
      font-size: 1.75rem;
      font-weight: 600;
      margin: 0.5rem 0 0.25rem;
    }
    .summary-label {
      font-size: 0.85rem;
      color: rgba(0,0,0,0.6);
    }
    .summary-sub {
      font-size: 0.75rem;
      color: rgba(0,0,0,0.4);
      margin-top: 0.25rem;
    }
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
    }
    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .bar-item {
      display: grid;
      grid-template-columns: 120px 1fr 80px;
      gap: 0.5rem;
      align-items: center;
    }
    .bar-label {
      font-size: 0.8rem;
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bar-label .sub {
      color: rgba(0,0,0,0.5);
      font-size: 0.75rem;
    }
    .bar-track {
      height: 20px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
      min-width: 2px;
    }
    .bar-fill.tokens { background: #3f51b5; }
    .bar-fill.model { background: #ff9800; }
    .bar-value {
      font-size: 0.75rem;
      color: rgba(0,0,0,0.6);
      text-align: right;
    }
    .no-data {
      text-align: center;
      padding: 2rem;
      color: rgba(0,0,0,0.4);
    }
    .full-width-table {
      width: 100%;
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  Math = Math;
  topUserColumns = ['userId', 'requestCount', 'totalTokens', 'totalCost'];

  loading = signal(false);
  fromDate = new Date(new Date().setDate(new Date().getDate() - 30));
  toDate = new Date();
  stats = signal<UsageStatsData | null>(null);
  dailyUsage = signal<DailyUsageData[]>([]);
  modelBreakdown = signal<ModelUsageData[]>([]);
  topUsers = signal<TopUserData[]>([]);

  maxDailyTokens = computed(() => {
    const daily = this.dailyUsage();
    return daily.length > 0 ? Math.max(...daily.map(d => d.totalTokens), 1) : 1;
  });

  maxModelTokens = computed(() => {
    const models = this.modelBreakdown();
    return models.length > 0 ? Math.max(...models.map(m => m.totalTokens), 1) : 1;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const from = this.formatDateParam(this.fromDate);
    const to = this.formatDateParam(this.toDate);

    this.api.getUsageStats(from, to).subscribe({
      next: (data) => { this.stats.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Failed to load stats', 'Dismiss', { duration: 3000 }); }
    });

    this.api.getUsageDaily(from, to).subscribe({
      next: (data) => this.dailyUsage.set(data),
      error: () => {}
    });

    this.api.getUsageModels(from, to).subscribe({
      next: (data) => this.modelBreakdown.set(data),
      error: () => {}
    });

    this.api.getUsageTopUsers(from, to).subscribe({
      next: (data) => this.topUsers.set(data),
      error: () => {}
    });
  }

  setLast7Days(): void {
    this.toDate = new Date();
    this.fromDate = new Date(new Date().setDate(new Date().getDate() - 7));
    this.loadData();
  }

  setLast30Days(): void {
    this.toDate = new Date();
    this.fromDate = new Date(new Date().setDate(new Date().getDate() - 30));
    this.loadData();
  }

  getBarWidth(value: number, max: number): number {
    return max > 0 ? Math.max((value / max) * 100, 1) : 1;
  }

  formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  }

  private formatDateParam(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
