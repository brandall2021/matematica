import { Component, input, effect, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MathResponse } from '../../core/services/api.service';
import * as katex from 'katex';

@Component({
  selector: 'app-math-result',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule],
  template: `
    <div class="result-section" *ngIf="result() as res">
      <mat-card appearance="outlined" class="result-card">
        <mat-card-header>
          <mat-icon mat-card-avatar [class]="res.success ? 'result-icon-success' : 'result-icon-error'">
            {{ res.success ? 'check_circle' : 'error' }}
          </mat-icon>
          <mat-card-title>Resultado</mat-card-title>
          <mat-card-subtitle>{{ operationLabel() }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="result-label">Entrada:</div>
          <div #inputLatexEl class="result-latex"></div>

          <div class="result-label">Operación:</div>
          <div class="result-operation">{{ operationLabel() }}</div>

          <mat-divider></mat-divider>

          <div class="result-label">Resultado:</div>
          <div *ngIf="res.success" #resultLatexEl class="result-latex result-success"></div>
          <div *ngIf="!res.success" class="result-error">{{ res.error }}</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
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

    @media (max-width: 768px) {
      .result-latex { padding: 0.5rem; font-size: 0.9rem; }
    }
  `]
})
export class MathResultComponent implements AfterViewInit {
  @ViewChildren('resultLatexEl') resultLatexEls!: QueryList<ElementRef>;
  @ViewChildren('inputLatexEl') inputLatexEls!: QueryList<ElementRef>;

  result = input.required<MathResponse | null>();
  operationLabel = input.required<string>();
  inputExpression = input.required<string>();

  constructor() {
    effect(() => {
      this.result();
      this.inputExpression();
      setTimeout(() => this.renderLatex(), 50);
    });
  }

  ngAfterViewInit(): void {
    this.resultLatexEls.changes.subscribe(() => this.renderLatex());
    this.inputLatexEls.changes.subscribe(() => this.renderLatex());
  }

  private renderLatex(): void {
    this.renderLatexInEls(this.resultLatexEls, () => this.result()?.result);
    this.renderLatexInEls(this.inputLatexEls, () => this.inputExpression());
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
