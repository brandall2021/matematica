import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatListModule],
  template: `
    <div class="settings-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Configuracion</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-list>
            <mat-list-item *ngFor="let setting of settings()">
              <div class="setting-item">
                <div class="setting-info">
                  <strong>{{ setting.key }}</strong>
                  <p>{{ setting.description }}</p>
                </div>
                <mat-form-field appearance="outline">
                  <input matInput [(ngModel)]="setting.value" (blur)="updateSetting(setting)">
                </mat-form-field>
              </div>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container { max-width: 700px; margin: 0 auto; }
    .setting-item { display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 1rem; }
    .setting-info { flex: 1; }
    .setting-info p { color: #666; margin: 0; font-size: 0.875rem; }

    @media (max-width: 600px) {
      .setting-item { flex-direction: column; align-items: stretch; gap: 0.5rem; }
      .setting-info { text-align: center; }
    }
  `]
})
export class SettingsComponent {
  settings = signal<any[]>([]);

  constructor(private api: ApiService) {
    this.api.getSettings().subscribe({
      next: (res) => this.settings.set(res)
    });
  }

  updateSetting(setting: any): void {
    this.api.updateSetting(setting.key, setting.value, setting.description).subscribe();
  }
}
