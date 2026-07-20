import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RagQueryRequest { query: string; }
export interface RagQueryResponse { answer: string; sources: string; contextChunksUsed: number; }

export interface ChatRequest { sessionId?: string; message: string; webSearchEnabled?: boolean; }
export interface ChatResponse { messageId: string; sessionId: string; answer: string; sources: string; webSources: string; timestamp: string; }
export interface ChatSession { id: string; title: string; messageCount: number; createdAt: string; updatedAt: string; }
export interface ChatMessage { id: string; role: 'USER' | 'ASSISTANT'; content: string; createdAt: string; }

export interface MathRequest { operation: string; expression: string; variable?: string; point?: string; xMin?: number; xMax?: number; }
export interface MathResponse { success: boolean; result: string; error: string; }

export interface PlotRequest { expression: string; variable?: string; xMin?: number; xMax?: number; }
export interface PlotResponse { xValues: number[]; yValues: number[]; expression: string; latexExpression: string; }

export interface DocumentItem { id: string; filename: string; subject: string; unit: string; topic: string; indexed: boolean; createdAt: string; }
export interface DocumentResponse extends DocumentItem { type: string; mimeType: string; size: number; author: string; title: string; source: string; sourceUrl: string; pageCount: number; tags: string; chunkCount: number; errorMessage: string; }
export interface YouTubeRequest { url: string; }

export interface HistoryItem { sessionId: string; title: string; lastMessage: string; updatedAt: string; }

export interface AppSetting { key: string; value: string; description: string; }

export interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number; }

export interface AdminStats { totalDocuments: number; indexedDocuments: number; dailyQueries: number; totalChatSessions: number; avgResponseTime: number; totalTokensUsed: number; avgRagPrecision: number; }

export interface UsageStatsData { totalRequests: number; totalInputTokens: number; totalOutputTokens: number; totalTokens: number; totalEstimatedCost: number; avgTokensPerRequest: number; uniqueUsers: number; }
export interface DailyUsageData { date: string; requestCount: number; totalTokens: number; totalCost: number; }
export interface ModelUsageData { modelProvider: string; modelName: string; requestCount: number; totalTokens: number; totalCost: number; }
export interface TopUserData { userId: string; requestCount: number; totalTokens: number; totalCost: number; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // RAG
  ragQuery(req: RagQueryRequest): Observable<RagQueryResponse> {
    return this.http.post<RagQueryResponse>(`${this.baseUrl}/rag/query`, req);
  }

  // Chat
  sendMessage(req: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat/message`, req);
  }

  getSessions(page = 0, size = 20): Observable<PageResponse<ChatSession>> {
    return this.http.get<PageResponse<ChatSession>>(`${this.baseUrl}/chat/sessions?page=${page}&size=${size}`);
  }

  getMessages(sessionId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/chat/sessions/${sessionId}/messages`);
  }

  // Math
  evaluateMath(req: MathRequest): Observable<MathResponse> {
    return this.http.post<MathResponse>(`${this.baseUrl}/math/evaluate`, req);
  }

  plotMath(req: PlotRequest): Observable<PlotResponse> {
    return this.http.post<PlotResponse>(`${this.baseUrl}/math/plot`, req);
  }

  // Documents
  uploadDocument(formData: FormData): Observable<DocumentResponse> {
    return this.http.post<DocumentResponse>(`${this.baseUrl}/documents/upload`, formData);
  }

  addYouTubeVideo(req: YouTubeRequest): Observable<DocumentResponse> {
    return this.http.post<DocumentResponse>(`${this.baseUrl}/documents/youtube`, req);
  }

  getDocuments(params?: { [key: string]: string | number }): Observable<PageResponse<DocumentItem>> {
    return this.http.get<PageResponse<DocumentItem>>(`${this.baseUrl}/documents`, { params });
  }

  getDocument(id: string): Observable<DocumentResponse> {
    return this.http.get<DocumentResponse>(`${this.baseUrl}/documents/${id}`);
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documents/${id}`);
  }

  // Admin
  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.baseUrl}/stats/admin`);
  }

  reindexAll(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/indexer/reindex`, {});
  }

  // History
  getHistory(page = 0, size = 50): Observable<PageResponse<HistoryItem>> {
    return this.http.get<PageResponse<HistoryItem>>(`${this.baseUrl}/history?page=${page}&size=${size}`);
  }

  // Settings
  getSettings(): Observable<AppSetting[]> {
    return this.http.get<AppSetting[]>(`${this.baseUrl}/settings`);
  }

  updateSetting(key: string, value: string, description?: string): Observable<AppSetting> {
    return this.http.put<AppSetting>(`${this.baseUrl}/settings/${key}`, { key, value, description });
  }

  // Audit
  getAuditLogs(params: { [key: string]: string | number }): Observable<PageResponse<any>> {
    return this.http.get<PageResponse<any>>(`${this.baseUrl}/audit/logs`, { params });
  }

  getAuditStats(from: string, to: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/audit/stats`, { params: { from, to } });
  }

  // Analytics
  logUsage(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/analytics/log`, data);
  }

  getUsageOverview(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics/overview`);
  }

  getUsageStats(from: string, to: string): Observable<UsageStatsData> {
    return this.http.get<UsageStatsData>(`${this.baseUrl}/analytics/stats`, { params: { from, to } });
  }

  getUsageDaily(from: string, to: string): Observable<DailyUsageData[]> {
    return this.http.get<DailyUsageData[]>(`${this.baseUrl}/analytics/daily`, { params: { from, to } });
  }

  getUsageModels(from: string, to: string): Observable<ModelUsageData[]> {
    return this.http.get<ModelUsageData[]>(`${this.baseUrl}/analytics/models`, { params: { from, to } });
  }

  getUsageTopUsers(from: string, to: string): Observable<TopUserData[]> {
    return this.http.get<TopUserData[]>(`${this.baseUrl}/analytics/top-users`, { params: { from, to } });
  }
}
