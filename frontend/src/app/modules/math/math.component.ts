import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService, MathResponse } from '../../core/services/api.service';

@Component({
  selector: 'app-math',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatIconModule, MatChipsModule],
  template: `
    <div class="math-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Motor Matemático</mat-card-title>
          <mat-card-subtitle>Cálculo simbólico paso a paso</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="operations">
            <button mat-chip *ngFor="let op of operations" (click)="selectedOp = op; inputExpr = ''; result.set(null)">
              {{ op.label }}
            </button>
          </div>

          <div class="input-section">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ selectedOp.example }}</mat-label>
              <input matInput [(ngModel)]="inputExpr" placeholder="Ej: x^2 + 3*x + 2">
            </mat-form-field>

            <div class="extra-inputs" *ngIf="selectedOp.id === 'limit'">
              <mat-form-field appearance="outline">
                <mat-label>Punto</mat-label>
                <input matInput [(ngModel)]="point">
              </mat-form-field>
            </div>

            <button mat-raised-button color="primary" (click)="compute()" [disabled]="!inputExpr || loading()">
              {{ loading() ? 'Calculando...' : 'Calcular' }}
            </button>
          </div>

          <div class="result" *ngIf="result() as res">
            <mat-card appearance="outlined">
              <mat-card-header>
                <mat-card-title>Resultado</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div [class.error]="!res.success">
                  {{ res.success ? res.result : res.error }}
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .math-container { max-width: 800px; margin: 0 auto; }
    .operations { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
    .input-section { display: flex; flex-direction: column; gap: 1rem; }
    .extra-inputs { display: flex; gap: 1rem; }
    .result { margin-top: 1.5rem; }
    .error { color: #f44336; }
  `]
})
export class MathComponent {
  operations = [
    { id: 'derive', label: 'Derivar', example: 'f(x) = x^2 + 3x' },
    { id: 'integrate', label: 'Integrar', example: '∫ (x^2 + 3x) dx' },
    { id: 'limit', label: 'Límite', example: 'lim (x^2 - 1)/(x - 1)' },
    { id: 'simplify', label: 'Simplificar', example: '(x^2 - 1)/(x - 1)' },
    { id: 'factor', label: 'Factorizar', example: 'x^2 - 5x + 6' },
    { id: 'solve', label: 'Resolver', example: 'x^2 - 5x + 6 = 0' },
  ];

  selectedOp = this.operations[0];
  inputExpr = '';
  point = '';
  loading = signal(false);
  result = signal<MathResponse | null>(null);

  constructor(private api: ApiService) {}

  compute(): void {
    this.loading.set(true);
    this.api.evaluateMath({
      operation: this.selectedOp.id,
      expression: this.inputExpr,
      point: this.point || undefined
    }).subscribe({
      next: (res) => { this.result.set(res); this.loading.set(false); },
      error: () => { this.result.set({ success: false, result: '', error: 'Error al calcular' }); this.loading.set(false); }
    });
  }
}
