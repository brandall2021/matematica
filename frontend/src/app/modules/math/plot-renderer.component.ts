import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PlotResponse } from '../../core/services/api.service';

interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface AxisLabel {
  x: number;
  y: number;
  text: string;
}

const PAD = { left: 40, right: 20, top: 30, bottom: 30 };
const WIDTH = 600;
const HEIGHT = 400;
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

@Component({
  selector: 'app-plot-renderer',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="plot-section" *ngIf="plotData() as plot">
      <mat-card appearance="outlined" class="plot-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="result-icon-success">show_chart</mat-icon>
          <mat-card-title>Gráfica</mat-card-title>
          <mat-card-subtitle>{{ plot.expression }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="plot-latex"></div>
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
  `,
  styles: [`
    .plot-section { }
    .plot-card mat-card-content { padding-top: 0.5rem; }
    .plot-latex { text-align: center; margin-bottom: 1rem; }
    .svg-container { width: 100%; overflow-x: auto; }
    .plot-svg { width: 100%; max-width: 600px; display: block; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; }
    .axis-label { font-size: 10px; fill: #666; text-anchor: middle; }
    .result-icon-success { color: #4caf50; font-size: 2rem; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; }
  `]
})
export class PlotRendererComponent {
  plotData = input.required<PlotResponse | null>();

  private xRange = computed(() => {
    const plot = this.plotData();
    if (!plot || !plot.xValues.length) return null;
    return { min: plot.xValues[0], max: plot.xValues[plot.xValues.length - 1] };
  });

  private yRange = computed(() => {
    const plot = this.plotData();
    if (!plot || !plot.yValues.length) return null;
    let yMin = Infinity, yMax = -Infinity;
    for (const val of plot.yValues) {
      if (isFinite(val)) {
        if (val < yMin) yMin = val;
        if (val > yMax) yMax = val;
      }
    }
    if (!isFinite(yMin)) { yMin = -10; yMax = 10; }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    return { min: yMin, max: yMax };
  });

  axisX(x: number): number {
    const range = this.xRange();
    if (!range) return WIDTH / 2;
    if (range.max === range.min) return PAD.left + PLOT_W / 2;
    const clamped = Math.max(range.min, Math.min(range.max, x));
    return PAD.left + ((clamped - range.min) / (range.max - range.min)) * PLOT_W;
  }

  axisY(y: number): number {
    const range = this.yRange();
    if (!range) return HEIGHT / 2;
    return PAD.top + PLOT_H - ((y - range.min) / (range.max - range.min)) * PLOT_H;
  }

  plotPoints(): string {
    const plot = this.plotData();
    if (!plot || !plot.xValues.length) return '';
    const xRange = this.xRange()!;
    const yRange = this.yRange()!;
    return plot.xValues.map((x, i) => {
      const px = PAD.left + ((x - xRange.min) / (xRange.max - xRange.min)) * PLOT_W;
      const py = PAD.top + PLOT_H - ((plot.yValues[i] - yRange.min) / (yRange.max - yRange.min)) * PLOT_H;
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    }).join(' ');
  }

  get gridLinesH(): GridLine[] {
    const lines: GridLine[] = [];
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + i * 85;
      lines.push({ x1: PAD.left, y1: y, x2: WIDTH - PAD.right, y2: y });
    }
    return lines;
  }

  get gridLinesV(): GridLine[] {
    const lines: GridLine[] = [];
    for (let i = 0; i <= 6; i++) {
      const x = PAD.left + i * 90;
      lines.push({ x1: x, y1: PAD.top, x2: x, y2: HEIGHT - PAD.bottom });
    }
    return lines;
  }

  get xLabels(): AxisLabel[] {
    const range = this.xRange();
    if (!range) return [];
    const labels: AxisLabel[] = [];
    const step = (range.max - range.min) / 6;
    for (let i = 0; i <= 6; i++) {
      const val = range.min + i * step;
      const px = this.axisX(val);
      const displayVal = Math.abs(val) < 0.001 ? '0' : val.toFixed(1);
      labels.push({ x: px, y: HEIGHT - 15, text: displayVal });
    }
    return labels;
  }

  get yLabels(): AxisLabel[] {
    const range = this.yRange();
    if (!range) return [];
    const labels: AxisLabel[] = [];
    const step = (range.max - range.min) / 4;
    for (let i = 0; i <= 4; i++) {
      const val = range.min + i * step;
      const py = this.axisY(val);
      const displayVal = Math.abs(val) < 0.001 ? '0' : val.toFixed(1);
      labels.push({ x: 25, y: py + 4, text: displayVal });
    }
    return labels;
  }
}
