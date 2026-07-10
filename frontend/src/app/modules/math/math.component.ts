import { Component, signal, computed, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService, MathResponse, PlotResponse } from '../../core/services/api.service';
import * as katex from 'katex';

interface Operation {
  id: string;
  label: string;
  example: string;
  category: string;
  needsPoint?: boolean;
  pointLabel?: string;
  needsRange?: boolean;
  needsTwoNumbers?: boolean;
  isPlot?: boolean;
}

interface HistoryEntry {
  operation: string;
  operationLabel: string;
  expression: string;
  result: string;
  timestamp: number;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  expanded: boolean;
}

@Component({
  selector: 'app-math',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatExpansionModule, MatTooltipModule,
    MatDividerModule
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
          <div class="categories-section">
            <mat-accordion>
              <mat-expansion-panel *ngFor="let cat of categories" [expanded]="cat.expanded" (opened)="setCategory(cat.id)">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon class="cat-icon">{{ cat.icon }}</mat-icon>
                    {{ cat.label }}
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <div class="operations-grid">
                  <button mat-stroked-button *ngFor="let op of getOpsForCategory(cat.id)"
                    [class.selected]="selectedOp()?.id === op.id"
                    (click)="selectOp(op)">
                    {{ op.label }}
                  </button>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </div>

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
          <div class="result-section" *ngIf="result() as res">
            <mat-card appearance="outlined" class="result-card">
              <mat-card-header>
                <mat-icon mat-card-avatar [class]="res.success ? 'result-icon-success' : 'result-icon-error'">
                  {{ res.success ? 'check_circle' : 'error' }}
                </mat-icon>
                <mat-card-title>Resultado</mat-card-title>
                <mat-card-subtitle>{{ getOperationLabel() }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="result-label">Entrada:</div>
                <div #inputLatexEl class="result-latex"></div>

                <div class="result-label">Operación:</div>
                <div class="result-operation">{{ getOperationLabel() }}</div>

                <mat-divider></mat-divider>

                <div class="result-label">Resultado:</div>
                <div *ngIf="res.success" #resultLatexEl class="result-latex result-success"></div>
                <div *ngIf="!res.success" class="result-error">{{ res.error }}</div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Plot Section -->
          <div class="plot-section" *ngIf="plotData() as plot">
            <mat-card appearance="outlined" class="plot-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="result-icon-success">show_chart</mat-icon>
                <mat-card-title>Gráfica</mat-card-title>
                <mat-card-subtitle>{{ plot.expression }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div #plotLatexEl class="plot-latex"></div>
                <div class="svg-container">
                  <svg [attr.viewBox]="'0 0 600 400'" class="plot-svg" xmlns="http://www.w3.org/2000/svg">
                    <!-- Background -->
                    <rect width="600" height="400" fill="#fafafa" rx="8"/>

                    <!-- Grid -->
                    <g class="grid" stroke="#e0e0e0" stroke-width="0.5">
                      <line *ngFor="let gi of gridLinesH" [attr.x1]="gi.x1" [attr.y1]="gi.y1" [attr.x2]="gi.x2" [attr.y2]="gi.y2"/>
                      <line *ngFor="let gi of gridLinesV" [attr.x1]="gi.x1" [attr.y1]="gi.y1" [attr.x2]="gi.x2" [attr.y2]="gi.y2"/>
                    </g>

                    <!-- Axes -->
                    <line [attr.x1]="axisX(0)" y1="30" [attr.x2]="axisX(0)" y2="370" stroke="#333" stroke-width="1.5"/>
                    <line x1="20" [attr.y1]="axisY(0)" x2="580" [attr.y2]="axisY(0)" stroke="#333" stroke-width="1.5"/>

                    <!-- Axis labels -->
                    <text *ngFor="let lbl of xLabels" [attr.x]="lbl.x" [attr.y]="lbl.y" class="axis-label">{{ lbl.text }}</text>
                    <text *ngFor="let lbl of yLabels" [attr.x]="lbl.x" [attr.y]="lbl.y" class="axis-label">{{ lbl.text }}</text>

                    <!-- Function line -->
                    <polyline [attr.points]="plotPoints()" fill="none" stroke="#3f51b5" stroke-width="2" stroke-linejoin="round"/>
                  </svg>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
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

    .categories-section { margin-bottom: 1.5rem; }
    .cat-icon { margin-right: 0.5rem; color: #3f51b5; }
    .operations-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem 0; }
    .operations-grid button { transition: all 0.15s ease; }
    .operations-grid button.selected {
      background-color: #3f51b5; color: white; border-color: #3f51b5;
    }

    .input-section { margin-bottom: 1rem; }
    .input-card mat-card-content { display: flex; flex-direction: column; gap: 1rem; padding-top: 0.5rem; }
    .extra-fields, .range-fields { display: flex; gap: 1rem; flex-wrap: wrap; }
    .extra-fields mat-form-field, .range-fields mat-form-field { flex: 1; min-width: 150px; }
    .calc-btn { align-self: flex-start; }
    .calc-btn mat-icon { margin-right: 0.25rem; }

    .result-section { margin-bottom: 1rem; }
    .result-card mat-card-content { padding-top: 0.5rem; }
    .result-icon-success { color: #4caf50; font-size: 2rem; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; }
    .result-icon-error { color: #f44336; font-size: 2rem; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; }
    .result-label { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.75rem; margin-bottom: 0.25rem; }
    .result-latex { text-align: center; padding: 0.75rem; background: #f5f5f5; border-radius: 6px; margin-bottom: 0.5rem; overflow-x: auto; }
    .result-success { background: linear-gradient(135deg, #e8f5e9, #f5f5f5); }
    .result-operation { font-weight: 500; color: #333; }
    .result-error { color: #f44336; font-weight: 500; padding: 1rem; background: #ffebee; border-radius: 6px; }
    mat-divider { margin: 0.5rem 0; }

    .plot-section { }
    .plot-card mat-card-content { padding-top: 0.5rem; }
    .plot-latex { text-align: center; margin-bottom: 1rem; }
    .svg-container { width: 100%; overflow-x: auto; }
    .plot-svg { width: 100%; max-width: 600px; display: block; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; }
    .axis-label { font-size: 10px; fill: #666; text-anchor: middle; }

    .history-card mat-card-content { padding-top: 0.5rem; }
    .history-chips mat-chip { cursor: pointer; }

    @media (max-width: 768px) {
      .math-container { gap: 1rem; }
      .latex-preview { padding: 0.75rem; margin-bottom: 1rem; }
      .operations-grid button { flex: 1 1 calc(50% - 0.25rem); min-width: 0; font-size: 0.8rem; }
      .extra-fields, .range-fields { flex-direction: column; gap: 0.5rem; }
      .extra-fields mat-form-field, .range-fields mat-form-field { min-width: 0; }
      .result-latex { padding: 0.5rem; font-size: 0.9rem; }
    }

    @media (max-width: 480px) {
      .math-container { gap: 0.75rem; }
      .operations-grid button { flex: 1 1 100%; }
    }
  `]
})
export class MathComponent implements OnInit, AfterViewInit {
  @ViewChildren('latexPreviewEl') latexPreviewEls!: QueryList<ElementRef>;
  @ViewChildren('resultLatexEl') resultLatexEls!: QueryList<ElementRef>;
  @ViewChildren('inputLatexEl') inputLatexEls!: QueryList<ElementRef>;
  @ViewChildren('plotLatexEl') plotLatexEls!: QueryList<ElementRef>;

  categories: Category[] = [
    { id: 'calculo', label: 'Cálculo', icon: 'show_chart', expanded: false },
    { id: 'algebra', label: 'Álgebra', icon: 'functions', expanded: false },
    { id: 'algebra-lineal', label: 'Álgebra Lineal', icon: 'grid_on', expanded: false },
    { id: 'numeros', label: 'Números', icon: 'tag', expanded: false },
    { id: 'edo', label: 'EDO', icon: 'timeline', expanded: false },
    { id: 'graficas', label: 'Gráficas', icon: 'insights', expanded: false },
  ];

  operations: Operation[] = [
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

  private latexRenderers: (() => void)[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('math_history') : null;
    if (stored) {
      try { this.history.set(JSON.parse(stored)); } catch {}
    }
  }

  ngAfterViewInit(): void {
    this.resultLatexEls.changes.subscribe(() => this.renderLatex());
    this.inputLatexEls.changes.subscribe(() => this.renderLatex());
    this.latexPreviewEls.changes.subscribe(() => this.renderPreviewLatex());
    this.plotLatexEls.changes.subscribe(() => this.renderPlotLatex());
  }

  getOpsForCategory(catId: string): Operation[] {
    return this.operations.filter(o => o.category === catId);
  }

  setCategory(catId: string): void {
    this.categories.forEach(c => c.expanded = c.id === catId);
  }

  selectOp(op: Operation): void {
    this.selectedOp.set(op);
    this.inputExpr.set('');
    this.point.set('');
    this.secondExpr.set('');
    this.xMin.set(null);
    this.xMax.set(null);
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

    this.loading.set(true);
    this.result.set(null);
    this.plotData.set(null);

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
        setTimeout(() => this.renderLatex(), 50);
      },
      error: () => {
        this.result.set({ success: false, result: '', error: 'Error al conectar con el servidor' });
        this.loading.set(false);
      }
    });
  }

  private computePlot(): void {
    this.loading.set(true);
    this.result.set(null);
    this.plotData.set(null);

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
        setTimeout(() => {
          this.renderLatex();
          this.renderPlotLatex();
        }, 50);
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

  // SVG plot helpers
  plotPoints(): string {
    const plot = this.plotData();
    if (!plot || !plot.xValues.length) return '';
    const padL = 40, padR = 20, padT = 30, padB = 30;
    const w = 600 - padL - padR, h = 400 - padT - padB;
    const xVals = plot.xValues, yVals = plot.yValues;

    const xMinVal = xVals[0], xMaxVal = xVals[xVals.length - 1];
    let yMinVal = Infinity, yMaxVal = -Infinity;
    for (const y of yVals) {
      if (isFinite(y)) {
        if (y < yMinVal) yMinVal = y;
        if (y > yMaxVal) yMaxVal = y;
      }
    }
    if (!isFinite(yMinVal)) yMinVal = -10;
    if (!isFinite(yMaxVal)) yMaxVal = 10;
    if (yMinVal === yMaxVal) { yMinVal -= 1; yMaxVal += 1; }
    const yRange = yMaxVal - yMinVal;

    return xVals.map((x, i) => {
      const px = padL + ((x - xMinVal) / (xMaxVal - xMinVal)) * w;
      const py = padT + h - ((yVals[i] - yMinVal) / yRange) * h;
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    }).join(' ');
  }

  axisX(x: number): number {
    const plot = this.plotData();
    if (!plot || !plot.xValues.length) return 300;
    const padL = 40, padR = 20;
    const w = 600 - padL - padR;
    const xMinVal = plot.xValues[0], xMaxVal = plot.xValues[plot.xValues.length - 1];
    if (xMaxVal === xMinVal) return padL + w / 2;
    const clamped = Math.max(xMinVal, Math.min(xMaxVal, x));
    return padL + ((clamped - xMinVal) / (xMaxVal - xMinVal)) * w;
  }

  axisY(y: number): number {
    const plot = this.plotData();
    if (!plot || !plot.yValues.length) return 200;
    const padT = 30, padB = 30;
    const h = 400 - padT - padB;
    let yMinVal = Infinity, yMaxVal = -Infinity;
    for (const val of plot.yValues) {
      if (isFinite(val)) { if (val < yMinVal) yMinVal = val; if (val > yMaxVal) yMaxVal = val; }
    }
    if (!isFinite(yMinVal)) { yMinVal = -10; yMaxVal = 10; }
    if (yMinVal === yMaxVal) { yMinVal -= 1; yMaxVal += 1; }
    return padT + h - ((y - yMinVal) / (yMaxVal - yMinVal)) * h;
  }

  get gridLinesH(): { x1: number; y1: number; x2: number; y2: number }[] {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i <= 4; i++) {
      const y = 30 + i * 85;
      lines.push({ x1: 40, y1: y, x2: 580, y2: y });
    }
    return lines;
  }

  get gridLinesV(): { x1: number; y1: number; x2: number; y2: number }[] {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i <= 6; i++) {
      const x = 40 + i * 90;
      lines.push({ x1: x, y1: 30, x2: x, y2: 370 });
    }
    return lines;
  }

  get xLabels(): { x: number; y: number; text: string }[] {
    const plot = this.plotData();
    if (!plot || !plot.xValues.length) return [];
    const labels: { x: number; y: number; text: string }[] = [];
    const xMinVal = plot.xValues[0], xMaxVal = plot.xValues[plot.xValues.length - 1];
    const step = (xMaxVal - xMinVal) / 6;
    for (let i = 0; i <= 6; i++) {
      const val = xMinVal + i * step;
      const px = this.axisX(val);
      const displayVal = Math.abs(val) < 0.001 ? '0' : val.toFixed(1);
      labels.push({ x: px, y: 385, text: displayVal });
    }
    return labels;
  }

  get yLabels(): { x: number; y: number; text: string }[] {
    const plot = this.plotData();
    if (!plot || !plot.yValues.length) return [];
    let yMinVal = Infinity, yMaxVal = -Infinity;
    for (const val of plot.yValues) {
      if (isFinite(val)) { if (val < yMinVal) yMinVal = val; if (val > yMaxVal) yMaxVal = val; }
    }
    if (!isFinite(yMinVal)) { yMinVal = -10; yMaxVal = 10; }
    if (yMinVal === yMaxVal) { yMinVal -= 1; yMaxVal += 1; }
    const labels: { x: number; y: number; text: string }[] = [];
    const step = (yMaxVal - yMinVal) / 4;
    for (let i = 0; i <= 4; i++) {
      const val = yMinVal + i * step;
      const py = this.axisY(val);
      const displayVal = Math.abs(val) < 0.001 ? '0' : val.toFixed(1);
      labels.push({ x: 25, y: py + 4, text: displayVal });
    }
    return labels;
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

  private renderLatex(): void {
    this.renderLatexInEls(this.resultLatexEls, () => this.result()?.result);
    this.renderLatexInEls(this.inputLatexEls, () => this.inputExpr());
  }

  private renderPreviewLatex(): void {
    this.renderLatexInEls(this.latexPreviewEls, () => this.inputExpr());
  }

  private renderPlotLatex(): void {
    this.renderLatexInEls(this.plotLatexEls, () => this.plotData()?.latexExpression);
  }

  private renderLatexInEls(els: QueryList<ElementRef>, getContent: () => string | undefined): void {
    const content = getContent();
    if (!content) return;
    els.forEach(elRef => {
      try {
        katex.render(content, elRef.nativeElement, { throwOnError: false, displayMode: true });
      } catch {
        elRef.nativeElement.textContent = content;
      }
    });
  }
}
