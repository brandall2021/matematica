import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/services/api.service';
import * as katex from 'katex';
import DOMPurify from 'dompurify';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string;
  webSources?: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <div class="chat-container">
      <mat-card class="chat-card">
        <mat-card-header>
          <mat-card-title>Chat con el Tutor</mat-card-title>
          <mat-card-subtitle>Pregunta cualquier tema de matematica</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="messages-container" #scrollContainer>
          <div *ngIf="messages().length === 0" class="empty-state">
            <mat-icon class="empty-icon">chat</mat-icon>
            <p>Bienvenido! Preguntame sobre cualquier tema matematico.</p>
            <div class="examples">
              <button mat-stroked-button (click)="askExample('Que es una derivada?')">Derivada</button>
              <button mat-stroked-button (click)="askExample('Resuelve la integral de x^2')">Integral de x2</button>
              <button mat-stroked-button (click)="askExample('Explica el teorema fundamental del calculo')">Teorema fundamental</button>
            </div>
          </div>

          <div *ngFor="let msg of messages()" class="message" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
            <div class="message-content">
              <strong>{{ msg.role === 'user' ? 'Tu' : 'Tutor' }}</strong>
              <div [innerHTML]="renderContent(msg.content)"></div>
              <div class="sources" *ngIf="msg.sources">
                <strong>Fuentes:</strong><br>
                <span [innerHTML]="msg.sources"></span>
              </div>
              <div class="sources web-sources" *ngIf="msg.webSources">
                <strong>Fuentes Web:</strong><br>
                <span *ngFor="let ws of parseWebSources(msg.webSources)" class="web-source-item">
                  <mat-icon class="web-icon">language</mat-icon>
                  <a [href]="ws.url" target="_blank" rel="noopener">{{ ws.title }}</a>
                </span>
              </div>
            </div>
          </div>

          <div *ngIf="loading()" class="message assistant">
            <div class="message-content">
              <strong>Tutor</strong>
              <p><em>Escribiendo...</em></p>
            </div>
          </div>
        </mat-card-content>

        <div class="search-toggle">
          <mat-slide-toggle [checked]="webSearchEnabled()" (change)="webSearchEnabled.set(!webSearchEnabled())">
            Buscar en la web
          </mat-slide-toggle>
        </div>

        <mat-card-actions class="input-area">
          <mat-form-field appearance="outline" class="input-field">
            <mat-label>Escribe tu pregunta...</mat-label>
            <input matInput [(ngModel)]="inputMessage" (keyup.enter)="sendMessage()" [disabled]="loading()">
          </mat-form-field>
          <button mat-mini-fab color="primary" (click)="sendMessage()" [disabled]="!inputMessage.trim() || loading()">
            <mat-icon>send</mat-icon>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .chat-container { max-width: 900px; margin: 0 auto; }
    .chat-card { min-height: calc(100vh - 120px); display: flex; flex-direction: column; }
    .messages-container { flex: 1; overflow-y: auto; padding: 1rem; max-height: calc(100vh - 320px); }
    .empty-state { text-align: center; padding: 3rem 1rem; color: #666; }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; }
    .examples { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin-top: 1rem; }
    .message {
      margin-bottom: 1rem;
      display: flex;
      opacity: 1;
      transform: translateY(0);
      transition: opacity 250ms cubic-bezier(0, 0, 0.2, 1), transform 250ms cubic-bezier(0, 0, 0.2, 1);

      @starting-style {
        opacity: 0;
        transform: translateY(8px);
      }
    }
    .message.user { justify-content: flex-end; }
    .message-content { max-width: 80%; padding: 0.75rem 1rem; border-radius: 12px; word-break: break-word; }
    .user .message-content { background: #e3f2fd; }
    .assistant .message-content { background: #f5f5f5; }
    .input-area { padding: 1rem; display: flex; gap: 0.5rem; align-items: center; }
    .input-field { flex: 1; }
    .search-toggle { padding: 0 1rem 0.5rem; display: flex; align-items: center; }
    .web-sources { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e0e0e0; }
    .web-source-item { display: flex; align-items: center; gap: 0.25rem; margin: 0.25rem 0; }
    .web-icon { font-size: 16px; width: 16px; height: 16px; color: #1976d2; }
    .web-source-item a { color: #1976d2; text-decoration: none; font-size: 0.875rem; }
    .web-source-item a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .chat-card { min-height: calc(100vh - 80px); }
      .messages-container { padding: 0.5rem; max-height: calc(100vh - 240px); }
      .message-content { max-width: 90%; padding: 0.625rem 0.75rem; font-size: 0.9rem; }
      .input-area { padding: 0.5rem; gap: 0.25rem; }
      .examples { flex-direction: column; align-items: center; }
      .examples button { width: 100%; max-width: 280px; }
    }

    @media (max-width: 480px) {
      .message-content { max-width: 95%; }
    }
  `]
})
export class ChatComponent implements AfterViewChecked {
  messages = signal<Message[]>([]);
  inputMessage = '';
  loading = signal(false);
  sessionId: string | null = null;
  webSearchEnabled = signal(false);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor(private api: ApiService) {}

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    if (!this.inputMessage.trim() || this.loading()) return;
    const text = this.inputMessage;
    this.messages.update(m => [...m, { role: 'user', content: text }]);
    this.inputMessage = '';
    this.loading.set(true);

    this.api.sendMessage({
      sessionId: this.sessionId ?? undefined,
      message: text,
      webSearchEnabled: this.webSearchEnabled()
    })
      .subscribe({
        next: (res) => {
          this.sessionId = res.sessionId;
          this.messages.update(m => [...m, {
            role: 'assistant',
            content: res.answer,
            sources: res.sources,
            webSources: res.webSources
          }]);
          this.loading.set(false);
        },
        error: () => {
          this.messages.update(m => [...m, { role: 'assistant', content: 'No pude procesar tu pregunta. Intenta reformularla o pregunta algo diferente.' }]);
          this.loading.set(false);
        }
      });
  }

  askExample(text: string): void {
    this.inputMessage = text;
    this.sendMessage();
  }

  parseWebSources(webSources: string): { title: string; url: string }[] {
    if (!webSources) return [];
    return webSources.split('\n').filter(l => l.trim()).map(line => {
      const match = line.match(/\[Web \d+\]\s+(.+?)\s+-\s+(.+)/);
      return match ? { title: match[1], url: match[2] } : { title: line, url: '' };
    });
  }

  renderContent(content: string): string {
    const withKaTeX = content.replace(/\$\$(.+?)\$\$/gs, (_, expr) => {
      try {
        return katex.renderToString(expr, { displayMode: true });
      } catch (e) { 
        console.error('KaTeX rendering error:', e);
        return expr; 
      }
    }).replace(/\$(.+?)\$/g, (_, expr) => {
      try {
        return katex.renderToString(expr, { displayMode: false });
      } catch (e) { 
        console.error('KaTeX rendering error:', e);
        return expr; 
      }
    });
    return DOMPurify.sanitize(withKaTeX, { ALLOWED_TAGS: ['span', 'div', 'p', 'strong', 'em', 'br', 'svg', 'math', 'msqrt', 'mfrac', 'mi', 'mo', 'mn', 'msup', 'msub', 'mrow', 'merror', 'mglyph', 'semantics', 'annotation'] });
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (e) {
      console.error('Scroll error:', e);
    }
  }
}
