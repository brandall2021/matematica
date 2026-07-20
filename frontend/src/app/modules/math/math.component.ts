import { Component, signal, computed, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService, MathResponse, PlotResponse } from '../../core/services/api.service';
import { Operation, HistoryEntry, Category } from './math.types';
import { OperationSelectorComponent } from './operation-selector.component';
import { PlotRendererComponent } from './plot-renderer.component';
import { MathResultComponent } from './math-result.component';
import * as katex from 'katex';

@Component({
  selector: 'app-math',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule,
    OperationSelectorComponent, PlotRendererComponent, MathResultComponent
  ],
  template: `
    <div class="math-container">
      <mat-card class="main-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">functions</mat-icon>
          <mat-card-title>Motor Matemático</mat-card-title>
          <mat-card-subtitle>Cálculo simbólico y visualización</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- LaTeX Preview -->
          <div class="latex-preview" *ngIf="inputExpr()">
            <span class="latex-label">Vista previa:</span>
            <div #latexPreviewEl class="latex-output"></div>
          </div>

          <!-- Category-based Operation Selector -->
          <app-operation-selector
            [categories]="categories"
            [operations]="operations"
            (operationSelected)="onOperationSelected($event)">
          </app-operation-selector>

          <!-- Input Section -->
          <div class="input-section" *ngIf="selectedOp() as op">
            <mat-card appearance="outlined" class="input-card">
              <mat-card-header>
                <mat-card-subtitle>{{ op.label }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ op.example }}</mat-label>
                  <input matInput [ngModel]="inputExpr()" (ngModelChange)="inputExpr.set($event)"
                    (keyup.enter)="compute()" [placeholder]="op.example">
                </mat-form-field>

                <div class="extra-fields" *ngIf="op.needsPoint">
                  <mat-form-field appearance="outline">
                    <mat-label>{{ op.pointLabel || 'Punto' }}</mat-label>
                    <input matInput [ngModel]="point()" (ngModelChange)="point.set($event)"
                      [placeholder]="op.pointLabel || 'Ej: 0'">
                  </mat-form-field>
                </div>

                <div class="extra-fields" *ngIf="op.needsTwoNumbers">
                  <mat-form-field appearance="outline">
                    <mat-label>Segundo número / expresión</mat-label>
                    <input matInput [ngModel]="secondExpr()" (ngModelChange)="secondExpr.set($event)"
                      placeholder="Ej: 12">
                  </mat-form-field>
                </div>

                <div class="range-fields" *ngIf="op.needsRange || op.isPlot">
                  <mat-form-field appearance="outline">
                    <mat-label>x Mínimo</mat-label>
                    <input matInput type="number" [ngModel]="xMin()" (ngModelChange)="xMin.set($event)">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>x Máximo</mat-label>
                    <input matInput type="number" [ngModel]="xMax()" (ngModelChange)="xMax.set($event)">
                  </mat-form-field>
                </div>

                <button mat-raised-button color="primary" class="calc-btn" (click)="compute()"
                  [disabled]="!inputExpr() || loading()">
                  <mat-icon *ngIf="!loading()">calculate</mat-icon>
                  {{ loading() ? 'Calculando...' : 'Calcular' }}
                </button>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Result Section -->
          <app-math-result
            *ngIf="result()"
            [result]="result()"
            [operationLabel]="getOperationLabel()"
            [inputExpression]="inputExpr()">
          </app-math-result>

          <!-- Plot Section -->
          <app-plot-renderer [plotData]="plotData()"></app-plot-renderer>
        </mat-card-content>
      </mat-card>

      <!-- History Section -->
      <mat-card class="history-card" *ngIf="history().length > 0">
        <mat-card-header>
          <mat-icon mat-card-avatar>history</mat-icon>
          <mat-card-title>Cálculos Recientes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="history-chips">
            <mat-chip-set>
              <mat-chip *ngFor="let entry of history(); let i = index" (click)="replayHistory(entry)" [matTooltip]="entry.expression">
                {{ entry.operationLabel }}: {{ truncate(entry.expression, 20) }}
              </mat-chip>
            </mat-chip-set>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .math-container { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

    .main-card { overflow: visible; }

    .header-icon { font-size: 2rem; width: 2.5rem; height: 2.5rem; color: #3f51b5; display: flex; align-items: center; justify-content: center; }

    .latex-preview {
      background: linear-gradient(135deg, #e8eaf6, #f5f5f5);
      border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;
    }
    .latex-label { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.5rem; }
    .latex-output { font-size: 1.1rem; overflow-x: auto; }

    .input-section { margin-bottom: 1rem; }
    .input-card mat-card-content { display: flex; flex-direction: column; gap: 1rem; padding-top: 0.5rem; }
    .extra-fields, .range-fields { display: flex; gap: 1rem; flex-wrap: wrap; }
    .extra-fields mat-form-field, .range-fields mat-form-field { flex: 1; min-width: 150px; }
    .calc-btn { align-self: flex-start; }
    .calc-btn mat-icon { margin-right: 0.25rem; }

    .history-card mat-card-content { padding-top: 0.5rem; }
    .history-chips mat-chip {
      cursor: pointer;
      opacity: 0;
      animation: chipFadeIn 250ms ease-out forwards;
    }
    .history-chips mat-chip:nth-child(1) { animation-delay: 50ms; }
    .history-chips mat-chip:nth-child(2) { animation-delay: 100ms; }
    .history-chips mat-chip:nth-child(3) { animation-delay: 150ms; }
    .history-chips mat-chip:nth-child(4) { animation-delay: 200ms; }
    .history-chips mat-chip:nth-child(5) { animation-delay: 250ms; }
    .history-chips mat-chip:nth-child(6) { animation-delay: 300ms; }
    .history-chips mat-chip:nth-child(7) { animation-delay: 350ms; }
    .history-chips mat-chip:nth-child(8) { animation-delay: 400ms; }
    .history-chips mat-chip:nth-child(9) { animation-delay: 450ms; }
    .history-chips mat-chip:nth-child(10) { animation-delay: 500ms; }

    @keyframes chipFadeIn {
      from { opacity: 0; transform: translateY(4px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (max-width: 768px) {
      .math-container { gap: 1rem; }
      .latex-preview { padding: 0.75rem; margin-bottom: 1rem; }
      .extra-fields, .range-fields { flex-direction: column; gap: 0.5rem; }
      .extra-fields mat-form-field, .range-fields mat-form-field { min-width: 0; }
    }

    @media (max-width: 480px) {
      .math-container { gap: 0.75rem; }
    }
  `]
})
export class MathComponent implements OnInit, AfterViewInit {
  @ViewChildren('latexPreviewEl') latexPreviewEls!: QueryList<ElementRef>;

  readonly categories: Category[] = [
    { id: 'calculo', label: 'Cálculo', icon: 'show_chart', expanded: false },
    { id: 'algebra', label: 'Álgebra', icon: 'functions', expanded: false },
    { id: 'algebra-lineal', label: 'Álgebra Lineal', icon: 'grid_on', expanded: false },
    { id: 'numeros', label: 'Números', icon: 'tag', expanded: false },
    { id: 'edo', label: 'EDO', icon: 'timeline', expanded: false },
    { id: 'graficas', label: 'Gráficas', icon: 'insights', expanded: false },
  ];

  readonly operations: Operation[] = [
    { id: 'derive', label: 'Derivar', example: 'x^2 + 3*x + 2', category: 'calculo' },
    { id: 'integrate', label: 'Integrar', example: 'x^2 + 3*x', category: 'calculo' },
    { id: 'limit', label: 'Límites', example: '(x^2 - 1)/(x - 1)', category: 'calculo', needsPoint: true, pointLabel: 'Punto (ej: 1)' },
    { id: 'taylor', label: 'Series de Taylor', example: 'sin(x)', category: 'calculo', needsPoint: true, pointLabel: 'Punto,orden (ej: 0,4)' },
    { id: 'simplify', label: 'Simplificar', example: '(x^2 - 1)/(x - 1)', category: 'algebra' },
    { id: 'factor', label: 'Factorizar', example: 'x^2 - 5*x + 6', category: 'algebra' },
    { id: 'expand', label: 'Expandir', example: '(x + 1)*(x - 2)', category: 'algebra' },
    { id: 'solve', label: 'Resolver ecuaciones', example: 'x^2 - 5*x + 6 = 0', category: 'algebra' },
    { id: 'roots', label: 'Raíces', example: 'x^2 - 4', category: 'algebra' },
    { id: 'matrix-rank', label: 'Rango', example: '{{1,2,3},{4,5,6},{7,8,9}}', category: 'algebra-lineal' },
    { id: 'matrix-echelon', label: 'Escalonamiento', example: '{{1,2,3},{4,5,6},{7,8,9}}', category: 'algebra-lineal' },
    { id: 'summation', label: 'Sumatoria', example: 'i^2', category: 'numeros', needsPoint: true, pointLabel: 'Inicio,Fin (ej: 1,10)' },
    { id: 'product', label: 'Productoria', example: 'i', category: 'numeros', needsPoint: true, pointLabel: 'Inicio,Fin (ej: 1,5)' },
    { id: 'nsum', label: 'Suma Numérica', example: '1/n^2', category: 'numeros', needsPoint: true, pointLabel: 'Inicio,Fin (ej: 1,100)' },
    { id: 'gcd', label: 'MCD', example: '12', category: 'numeros', needsTwoNumbers: true },
    { id: 'lcm', label: 'MCM', example: '12', category: 'numeros', needsTwoNumbers: true },
    { id: 'dsolve', label: 'Resolver Ecuaciones Diferenciales', example: "f''(x) + f(x) = 0", category: 'edo' },
    { id: 'plot', label: 'Graficar función', example: 'sin(x)/x', category: 'graficas', isPlot: true },
  ];

  selectedOp = signal<Operation | null>(null);
  inputExpr = signal('');
  point = signal('');
  secondExpr = signal('');
  xMin = signal<number | null>(null);
  xMax = signal<number | null>(null);
  loading = signal(false);
  result = signal<MathResponse | null>(null);
  plotData = signal<PlotResponse | null>(null);
  history = signal<HistoryEntry[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('math_history') : null;
    if (stored) {
      try { this.history.set(JSON.parse(stored)); } catch {}
    }
  }

  ngAfterViewInit(): void {
    this.latexPreviewEls.changes.subscribe(() => this.renderPreviewLatex());
  }

  onOperationSelected(op: Operation): void {
    this.selectedOp.set(op);
    this.resetState();
  }

  private resetState(): void {
    this.inputExpr.set('');
    this.point.set('');
    this.secondExpr.set('');
    this.xMin.set(null);
    this.xMax.set(null);
    this.result.set(null);
    this.plotData.set(null);
  }

  private beginCompute(): void {
    this.loading.set(true);
    this.result.set(null);
    this.plotData.set(null);
  }

  compute(): void {
    const op = this.selectedOp();
    if (!op || !this.inputExpr()) return;

    if (op.isPlot) {
      this.computePlot();
      return;
    }

    this.beginCompute();

    this.api.evaluateMath({
      operation: op.id,
      expression: this.inputExpr(),
      variable: (op.needsTwoNumbers ? this.secondExpr() : undefined),
      point: (op.needsPoint ? this.point() : undefined),
      xMin: (op.needsRange || op.isPlot ? (this.xMin() ?? undefined) : undefined),
      xMax: (op.needsRange || op.isPlot ? (this.xMax() ?? undefined) : undefined),
    }).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
        this.addToHistory(op, this.inputExpr(), res.success ? res.result : res.error);
      },
      error: () => {
        this.result.set({ success: false, result: '', error: 'Error al conectar con el servidor' });
        this.loading.set(false);
      }
    });
  }

  private computePlot(): void {
    this.beginCompute();

    this.api.plotMath({
      expression: this.inputExpr(),
      xMin: this.xMin() ?? undefined,
      xMax: this.xMax() ?? undefined,
    }).subscribe({
      next: (res) => {
        this.plotData.set(res);
        this.result.set({ success: true, result: '', error: '' });
        this.loading.set(false);
        this.addToHistory(this.selectedOp()!, this.inputExpr(), 'Gráfica generada');
      },
      error: () => {
        this.result.set({ success: false, result: '', error: 'Error al generar la gráfica' });
        this.loading.set(false);
      }
    });
  }

  replayHistory(entry: HistoryEntry): void {
    const op = this.operations.find(o => o.id === entry.operation);
    if (op) {
      this.selectedOp.set(op);
      this.inputExpr.set(entry.expression);
    }
  }

  getOperationLabel(): string {
    return this.selectedOp()?.label ?? '';
  }

  truncate(str: string, len: number): string {
    return str.length > len ? str.substring(0, len) + '…' : str;
  }

  private addToHistory(op: Operation, expression: string, resultStr: string): void {
    const entry: HistoryEntry = {
      operation: op.id,
      operationLabel: op.label,
      expression,
      result: resultStr,
      timestamp: Date.now(),
    };
    const current = this.history();
    const updated = [entry, ...current.filter(e => !(e.operation === op.id && e.expression === expression))].slice(0, 10);
    this.history.set(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('math_history', JSON.stringify(updated));
    }
  }

  private renderPreviewLatex(): void {
    const content = this.inputExpr();
    if (!content) return;
    this.latexPreviewEls.forEach(elRef => {
      try {
        katex.render(content, elRef.nativeElement, { throwOnError: false, displayMode: true });
      } catch {
        elRef.nativeElement.textContent = content;
      }
    });
  }
}
