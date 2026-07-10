import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RagQueryRequest { query: string; }
export interface RagQueryResponse { answer: string; sources: string; contextChunksUsed: number; }

export interface ChatRequest { sessionId?: string; message: string; }
export interface ChatResponse { messageId: string; sessionId: string; answer: string; sources: string; timestamp: string; }
export interface ChatSessionResponse { id: string; title: string; messageCount: number; createdAt: string; updatedAt: string; }

export interface MathRequest { operation: string; expression: string; variable?: string; point?: string; xMin?: number; xMax?: number; }
export interface MathResponse { success: boolean; result: string; error: string; }

export interface PlotRequest { expression: string; variable?: string; xMin?: number; xMax?: number; }
export interface PlotResponse { xValues: number[]; yValues: number[]; expression: string; latexExpression: string; }

export interface DocumentResponse { id: string; filename: string; type: string; mimeType: string; size: number; author: string; title: string; subject: string; unit: string; topic: string; source: string; sourceUrl: string; pageCount: number; tags: string; chunkCount: number; indexed: boolean; errorMessage: string; createdAt: string; }

export interface AdminStats { totalDocuments: number; indexedDocuments: number; dailyQueries: number; totalChatSessions: number; avgResponseTime: number; totalTokensUsed: number; avgRagPrecision: number; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // RAG
  ragQuery(req: RagQueryRequest): Observable<RagQueryResponse> {
    return this.http.post<RagQueryResponse>(`${environment.apiUrl}/rag/query`, req);
  }

  // Chat
  sendMessage(req: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${environment.apiUrl}/chat/message`, req);
  }

  getSessions(page = 0, size = 20): Observable<any> {
    return this.http.get(`${environment.apiUrl}/chat/sessions?page=${page}&size=${size}`);
  }

  getMessages(sessionId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/chat/sessions/${sessionId}/messages`);
  }

  // Math
  evaluateMath(req: MathRequest): Observable<MathResponse> {
    return this.http.post<MathResponse>(`${environment.apiUrl}/math/evaluate`, req);
  }

  plotMath(req: PlotRequest): Observable<PlotResponse> {
    return this.http.post<PlotResponse>(`${environment.apiUrl}/math/plot`, req);
  }

  // Documents
  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/documents/upload`, formData);
  }

  addYouTubeVideo(req: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/documents/youtube`, req);
  }

  getDocuments(params?: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/documents`, { params });
  }

  getDocument(id: string): Observable<DocumentResponse> {
    return this.http.get<DocumentResponse>(`${environment.apiUrl}/documents/${id}`);
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/documents/${id}`);
  }

  // Admin
  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${environment.apiUrl}/stats/admin`);
  }

  reindexAll(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/indexer/reindex`, {});
  }

  // History
  getHistory(page = 0, size = 50): Observable<any> {
    return this.http.get(`${environment.apiUrl}/history?page=${page}&size=${size}`);
  }

  // Settings
  getSettings(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/settings`);
  }

  updateSetting(key: string, value: string, description?: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/settings/${key}`, { key, value, description });
  }
}
