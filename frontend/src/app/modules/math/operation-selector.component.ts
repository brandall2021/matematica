import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Category, Operation } from './math.types';

@Component({
  selector: 'app-operation-selector',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatIconModule, MatButtonModule],
  template: `
    <div class="categories-section">
      <mat-accordion>
        <mat-expansion-panel *ngFor="let cat of categories()" [expanded]="cat.expanded" (opened)="setCategory(cat.id)">
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
  `,
  styles: [`
    .categories-section { margin-bottom: 1.5rem; }
    .cat-icon { margin-right: 0.5rem; color: #3f51b5; }
    .operations-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem 0; }
    .operations-grid button { transition: all 0.15s ease; }
    .operations-grid button.selected {
      background-color: #3f51b5; color: white; border-color: #3f51b5;
    }

    @media (max-width: 768px) {
      .operations-grid button { flex: 1 1 calc(50% - 0.25rem); min-width: 0; font-size: 0.8rem; }
    }

    @media (max-width: 480px) {
      .operations-grid button { flex: 1 1 100%; }
    }
  `]
})
export class OperationSelectorComponent {
  categories = input.required<Category[]>();
  operations = input.required<Operation[]>();
  operationSelected = output<Operation>();

  selectedOp = signal<Operation | null>(null);

  getOpsForCategory(catId: string): Operation[] {
    return this.operations().filter(o => o.category === catId);
  }

  setCategory(catId: string): void {
    const cats = this.categories();
    cats.forEach(c => c.expanded = c.id === catId);
  }

  selectOp(op: Operation): void {
    this.selectedOp.set(op);
    this.operationSelected.emit(op);
  }
}
