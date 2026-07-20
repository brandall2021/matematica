import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  name: string;
  role: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);
  private refreshInProgress = false;
  private pendingRequests: Array<{resolve: (value: boolean) => void}> = [];

  currentUser = this.currentUserSignal.asReadonly();
  isLoggedIn = computed(() => this.currentUserSignal() !== null);
  role = computed(() => this.currentUserSignal()?.role ?? '');

  constructor() {
    this.loadFromStorage();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.handleAuth(res)));
  }

  register(email: string, password: string, name: string, lastName?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, {
      email, password, name, lastName
    }).pipe(tap(res => this.handleAuth(res)));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.role());
  }

  refreshToken(): Observable<AuthResponse | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.logout();
      return new Observable(sub => { sub.next(null); sub.complete(); });
    }
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(tap({
        next: (res) => this.handleAuth(res),
        error: () => this.logout()
      }));
  }

  async refreshTokenAsync(): Promise<boolean> {
    if (this.refreshInProgress) {
      return new Promise(resolve => {
        this.pendingRequests.push({resolve});
      });
    }

    this.refreshInProgress = true;
    try {
      const refreshToken = this.refreshTokenValue();
      if (!refreshToken) {
        this.logout();
        return false;
      }
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      );
      this.handleAuth(response);
      this.pendingRequests.forEach(p => p.resolve(true));
      this.pendingRequests = [];
      return true;
    } catch {
      this.logout();
      this.pendingRequests.forEach(p => p.resolve(false));
      this.pendingRequests = [];
      return false;
    } finally {
      this.refreshInProgress = false;
    }
  }

  private refreshTokenValue(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private handleAuth(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('user', JSON.stringify({
      id: res.userId, email: res.email, name: res.name, role: res.role
    }));
    this.tokenSignal.set(res.token);
    this.currentUserSignal.set({ id: res.userId, email: res.email, name: res.name, role: res.role });
  }

  private loadFromStorage() {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        this.currentUserSignal.set(JSON.parse(user));
      }
    } catch {
      localStorage.removeItem('user');
    }
  }
}
