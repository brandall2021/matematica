import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Registrarse</mat-card-title>
          <mat-card-subtitle>Tutor Inteligente de Matematica</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form #registerForm="ngForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre</mat-label>
              <input matInput [(ngModel)]="name" name="name" required>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Apellido</mat-label>
              <input matInput [(ngModel)]="lastName" name="lastName">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required email>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contrasena</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required minlength="6">
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="loading">
              {{ loading ? 'Registrando...' : 'Registrarse' }}
            </button>
          </form>
          <p class="error" *ngIf="error">{{ error }}</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Ya tengo cuenta</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }
    .auth-card { max-width: 400px; width: 100%; }
    .error { color: #f44336; margin-top: 1rem; text-align: center; }

    @media (max-width: 480px) {
      .auth-container { padding: 0.5rem; align-items: flex-start; padding-top: 5vh; }
    }
  `]
})
export class RegisterComponent {
  name = '';
  lastName = '';
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.auth.register(this.email, this.password, this.name, this.lastName).subscribe({
      next: () => this.router.navigate(['/chat']),
      error: (err) => { this.error = 'No pudimos crear tu cuenta. Verifica los datos e intenta de nuevo.'; this.loading = false; }
    });
  }
}
