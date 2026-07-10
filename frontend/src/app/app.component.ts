import { Component, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatButtonModule,
    MatIconModule, MatListModule, MatTooltipModule
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="drawer.toggle()" *ngIf="auth.isLoggedIn()">
        <mat-icon>menu</mat-icon>
      </button>
      <span>Matematica</span>
      <span class="spacer"></span>
      <span class="mat-caption" *ngIf="auth.currentUser() as user">
        {{ user.name }}
      </span>
      <button mat-icon-button *ngIf="auth.isLoggedIn()" (click)="auth.logout()" matTooltip="Cerrar sesión">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <mat-drawer-container *ngIf="auth.isLoggedIn()">
      <mat-drawer mode="side" opened>
        <mat-nav-list>
          <a mat-list-item routerLink="/chat" routerLinkActive="active-link">
            <mat-icon matListItemIcon>chat</mat-icon>
            <span matListItemTitle>Chat</span>
          </a>
          <a mat-list-item routerLink="/math" routerLinkActive="active-link">
            <mat-icon matListItemIcon>calculate</mat-icon>
            <span matListItemTitle>Matemáticas</span>
          </a>
          <a mat-list-item routerLink="/documents" routerLinkActive="active-link">
            <mat-icon matListItemIcon>description</mat-icon>
            <span matListItemTitle>Documentos</span>
          </a>
          <a mat-list-item routerLink="/history" routerLinkActive="active-link">
            <mat-icon matListItemIcon>history</mat-icon>
            <span matListItemTitle>Historial</span>
          </a>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link" *ngIf="auth.hasRole('ADMIN','TEACHER')">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/admin" routerLinkActive="active-link" *ngIf="auth.hasRole('ADMIN')">
            <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
            <span matListItemTitle>Administración</span>
          </a>
          <a mat-list-item routerLink="/settings" routerLinkActive="active-link">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>Configuración</span>
          </a>
        </mat-nav-list>
      </mat-drawer>

      <mat-drawer-content>
        <div class="content">
          <router-outlet />
        </div>
      </mat-drawer-content>
    </mat-drawer-container>

    <router-outlet *ngIf="!auth.isLoggedIn()" />
  `,
  styles: [`
    mat-toolbar { position: sticky; top: 0; z-index: 100; }
    mat-drawer-container { height: calc(100vh - 64px); }
    mat-drawer { width: 240px; }
    .content { padding: 1.5rem; }
    .active-link { background: rgba(63, 81, 181, 0.1); }
    .mat-caption { font-size: 0.875rem; margin-right: 1rem; }
  `]
})
export class AppComponent {
  @ViewChild('drawer') drawer!: MatDrawer;
  constructor(public auth: AuthService) {}
}
