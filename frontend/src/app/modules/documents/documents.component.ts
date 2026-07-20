import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService, DocumentResponse } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatProgressBarModule],
  template: `
    <div class="documents-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Gestion Documental</mat-card-title>
          <mat-card-subtitle>Sube y administra el material de estudio</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <mat-tab-group>
            <mat-tab label="Subir Archivo" *ngIf="auth.hasRole('ADMIN','TEACHER','ASSISTANT')">
              <div class="tab-content">
                <input type="file" (change)="onFileSelected($event)" accept=".pdf,.docx,.pptx,.txt,.md" #fileInput>
                <div class="meta-fields">
                  <mat-form-field appearance="outline">
                    <mat-label>Materia</mat-label>
                    <input matInput [(ngModel)]="uploadMetadata.subject">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Unidad</mat-label>
                    <input matInput [(ngModel)]="uploadMetadata.unit">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Tema</mat-label>
                    <input matInput [(ngModel)]="uploadMetadata.topic">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Etiquetas</mat-label>
                    <input matInput [(ngModel)]="uploadMetadata.tags">
                  </mat-form-field>
                </div>
                <button mat-raised-button color="primary" (click)="uploadFile()" [disabled]="!selectedFile || uploading()">
                  {{ uploading() ? 'Subiendo...' : 'Subir Archivo' }}
                </button>
                <mat-progress-bar mode="indeterminate" *ngIf="uploading()"></mat-progress-bar>
              </div>
            </mat-tab>

            <mat-tab label="Agregar Video" *ngIf="auth.hasRole('ADMIN','TEACHER','ASSISTANT')">
              <div class="tab-content">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>URL de YouTube</mat-label>
                  <input matInput [(ngModel)]="youtubeUrl" placeholder="https://youtube.com/watch?v=...">
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="addYouTube()" [disabled]="!youtubeUrl">
                  Agregar Video
                </button>
              </div>
            </mat-tab>

            <mat-tab label="Documentos">
              <div class="tab-content">
                <div *ngIf="documents().length === 0" class="empty-state">
                  <mat-icon class="empty-icon">folder_open</mat-icon>
                  <h3>Aún no hay documentos</h3>
                  <p>Sube tu primer archivo para que el tutor pueda usarlo como referencia.</p>
                </div>
                <div class="table-wrapper" *ngIf="documents().length > 0">
                  <table mat-table [dataSource]="documents()" class="full-width">
                    <ng-container matColumnDef="filename">
                      <th mat-header-cell *matHeaderCellDef>Archivo</th>
                      <td mat-cell *matCellDef="let doc">{{ doc.filename }}</td>
                    </ng-container>
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Tipo</th>
                      <td mat-cell *matCellDef="let doc">{{ doc.type }}</td>
                    </ng-container>
                    <ng-container matColumnDef="unit">
                      <th mat-header-cell *matHeaderCellDef>Unidad</th>
                      <td mat-cell *matCellDef="let doc">{{ doc.unit || '-' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="indexed">
                      <th mat-header-cell *matHeaderCellDef>Indexado</th>
                      <td mat-cell *matCellDef="let doc">{{ doc.indexed ? 'Si' : 'No' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let doc">
                        <button mat-icon-button color="warn" (click)="deleteDoc(doc.id)" *ngIf="auth.hasRole('ADMIN','TEACHER')">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="columns"></tr>
                    <tr mat-row *matRowDef="let row; columns: columns;"></tr>
                  </table>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .documents-container { max-width: 1000px; margin: 0 auto; }
    .tab-content { padding: 1.5rem 0; display: flex; flex-direction: column; gap: 1rem; }
    .meta-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    table { width: 100%; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .empty-state { text-align: center; padding: 3rem 1rem; color: #666; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #bdbdbd; }
    .empty-state h3 { margin: 1rem 0 0.5rem; color: #424242; }
    .empty-state p { margin: 0; max-width: 360px; margin-left: auto; margin-right: auto; }

    @media (max-width: 768px) {
      .tab-content { padding: 1rem 0; }
      .meta-fields { grid-template-columns: 1fr; gap: 0.5rem; }
    }
  `]
})
export class DocumentsComponent {
  selectedFile: File | null = null;
  uploading = signal(false);
  youtubeUrl = '';
  documents = signal<DocumentResponse[]>([]);
  columns = ['filename', 'type', 'unit', 'indexed', 'actions'];
  uploadMetadata = { subject: '', unit: '', topic: '', tags: '' };

  constructor(private api: ApiService, public auth: AuthService) {
    this.loadDocuments();
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  uploadFile(): void {
    if (!this.selectedFile) return;
    this.uploading.set(true);
    const fd = new FormData();
    fd.append('file', this.selectedFile);
    fd.append('subject', this.uploadMetadata.subject);
    fd.append('unit', this.uploadMetadata.unit);
    fd.append('topic', this.uploadMetadata.topic);
    fd.append('tags', this.uploadMetadata.tags);
    this.api.uploadDocument(fd).subscribe({
      next: () => { this.uploading.set(false); this.selectedFile = null; this.loadDocuments(); },
      error: () => this.uploading.set(false)
    });
  }

  addYouTube(): void {
    this.api.addYouTubeVideo({ url: this.youtubeUrl }).subscribe({
      next: () => { this.youtubeUrl = ''; this.loadDocuments(); }
    });
  }

  deleteDoc(id: string): void {
    this.api.deleteDocument(id).subscribe(() => this.loadDocuments());
  }

  private loadDocuments(): void {
    this.api.getDocuments().subscribe({
      next: (res) => this.documents.set(res.content || [])
    });
  }
}
