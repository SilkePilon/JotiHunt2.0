/**
 * Centralized API client for JotiHunt Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_VERSION = 'v1'

// Types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  cached?: boolean
  timestamp: string
  error?: string
  message?: string
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  filters?: {
    type?: string
    search?: string
  }
  meta?: any
  counts?: {
    articles?: number
    subscriptions?: number
    areas?: number
    total?: number
  }
}

export interface Article {
  id: number
  title: string
  type: string
  publish_at: string
  content?: string
  points?: number
  max_points?: number
  pointsDisplay?: string
  assignments?: Assignment[]
  progress?: {
    completed: number
    total: number
  }
  message?: {
    content: string
  }
  // Properties used by the table
  status?: string
  reviewer?: string
}

export interface Assignment {
  id?: number
  article_id?: number
  user_name?: string
  userName?: string
  title?: string
  type?: string
  publish_at?: string
  status: string
  reviewer?: string
  points_earned?: number
  pointsEarned?: number
  max_points?: number
  progress?: {
    completed: number
    total: number
  }
  pointsDisplay?: string | null
  notes?: string
  assigned_at?: string
  completed_at?: string
}

export interface Subscription {
  id: number
  name: string
  color: string
  area?: string
}

export interface Area {
  id: number
  name: string
  color: string
  status?: string
  updated_at?: string
}

export interface ResponseTime {
  endpoint: string
  response_time: number
  status_code?: number
  success: boolean
  error_message?: string
  timestamp: string
}

export interface ResponseTimeStats {
  endpoint: string
  total_requests: number
  avg_response_time: number
  min_response_time: number
  max_response_time: number
  successful_requests: number
  failed_requests: number
  success_rate: number
  last_request: string
}

export interface SystemStatus {
  status: string
  uptime: number
  version: string
  memory: any
  lastUpdate?: string
  articlesCount?: number
  subscriptionsCount?: number
  areasCount?: number
  assignmentsCount?: number
  cache?: {
    keys: number
    hits: number
    misses: number
    hitRate: number
  }
}

export interface SearchResults {
  articles: Article[]
  subscriptions: Subscription[]
  areas: Area[]
}

export interface DataSummary {
  counts: {
    articles: number
    subscriptions: number
    areas: number
    articleTypes: number
  }
  articleStats: {
    totalPoints: number
    averagePoints: number
    types: string[]
    latestPublishDate?: string
  }
  subscriptionStats: {
    withColor: number
    withArea: number
  }
  areaStats: {
    withStatus: number
    withColor: number
  }
}

// Error handling
export class ApiError extends Error {
  public status: number
  public data?: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// HTTP client with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data
      )
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Network or parsing errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0
    )
  }
}

// API Functions

/**
 * Get all articles with pagination and filtering
 */
export async function getArticles(options: {
  page?: number
  limit?: number
  type?: string
  search?: string
} = {}): Promise<{
  articles: Article[]
  pagination?: ApiResponse<Article[]>['pagination']
  filters?: ApiResponse<Article[]>['filters']
}> {
  const params = new URLSearchParams()
  if (options.page) params.set('page', options.page.toString())
  if (options.limit) params.set('limit', options.limit.toString())
  if (options.type) params.set('type', options.type)
  if (options.search) params.set('search', options.search)
  
  const queryString = params.toString()
  const endpoint = `/api/${API_VERSION}/articles${queryString ? `?${queryString}` : ''}`
  
  const response = await apiRequest<Article[]>(endpoint)
  return {
    articles: response.data || [],
    pagination: response.pagination,
    filters: response.filters
  }
}

/**
 * Get article types with statistics
 */
export async function getArticleTypes(): Promise<Array<{
  type: string
  count: number
  latestPublishDate: number
  averagePoints: number
}>> {
  const response = await apiRequest<Array<{
    type: string
    count: number
    latestPublishDate: number
    averagePoints: number
  }>>(`/api/${API_VERSION}/articles/types`)
  return response.data || []
}

/**
 * Get a specific article by ID
 */
export async function getArticle(id: number): Promise<Article | null> {
  try {
    const response = await apiRequest<Article>(`/api/${API_VERSION}/articles/${id}`)
    return response.data
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Get all subscriptions
 */
export async function getSubscriptions(): Promise<Subscription[]> {
  const response = await apiRequest<Subscription[]>(`/api/${API_VERSION}/subscriptions`)
  return response.data || []
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<{
  total: number
  withColor: number
  withArea: number
  colors: string[]
  areas: string[]
}> {
  const response = await apiRequest<{
    total: number
    withColor: number
    withArea: number
    colors: string[]
    areas: string[]
  }>(`/api/${API_VERSION}/subscriptions/stats`)
  return response.data
}

/**
 * Get a specific subscription by ID
 */
export async function getSubscription(id: number): Promise<Subscription | null> {
  try {
    const response = await apiRequest<Subscription>(`/api/${API_VERSION}/subscriptions/${id}`)
    return response.data
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Get all areas
 */
export async function getAreas(): Promise<Area[]> {
  const response = await apiRequest<Area[]>(`/api/${API_VERSION}/areas`)
  return response.data || []
}

/**
 * Get area statistics
 */
export async function getAreaStats(): Promise<{
  total: number
  statusDistribution: Record<string, number>
  colorDistribution: Record<string, number>
  withStatus: number
  withColor: number
}> {
  const response = await apiRequest<{
    total: number
    statusDistribution: Record<string, number>
    colorDistribution: Record<string, number>
    withStatus: number
    withColor: number
  }>(`/api/${API_VERSION}/areas/stats`)
  return response.data
}

/**
 * Get a specific area by ID
 */
export async function getArea(id: number): Promise<Area | null> {
  try {
    const response = await apiRequest<Area>(`/api/${API_VERSION}/areas/${id}`)
    return response.data
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Get all data at once
 */
export async function getAllData(): Promise<{
  articles: Article[]
  subscriptions: Subscription[]
  areas: Area[]
  counts: {
    articles: number
    subscriptions: number
    areas: number
    total: number
  }
}> {
  const response = await apiRequest<{
    articles: Article[]
    subscriptions: Subscription[]
    areas: Area[]
    counts: {
      articles: number
      subscriptions: number
      areas: number
      total: number
    }
  }>(`/api/${API_VERSION}/data/all`)
  
  return response.data || {
    articles: [],
    subscriptions: [],
    areas: [],
    counts: { articles: 0, subscriptions: 0, areas: 0, total: 0 }
  }
}

/**
 * Get data summary with statistics
 */
export async function getDataSummary(): Promise<DataSummary> {
  const response = await apiRequest<DataSummary>(`/api/${API_VERSION}/data/summary`)
  return response.data
}

/**
 * Search across all data types
 */
export async function searchData(query: string, options: {
  type?: 'articles' | 'subscriptions' | 'areas'
  limit?: number
} = {}): Promise<{
  results: SearchResults
  meta: {
    query: string
    type: string
    totalResults: number
    counts: {
      articles: number
      subscriptions: number
      areas: number
    }
  }
}> {
  const params = new URLSearchParams({ q: query })
  if (options.type) params.set('type', options.type)
  if (options.limit) params.set('limit', options.limit.toString())
  
  const response = await apiRequest<SearchResults>(`/api/${API_VERSION}/data/search?${params}`)
  return {
    results: response.data,
    meta: response.meta
  }
}

/**
 * Force refresh backend data
 */
export async function refreshData(): Promise<void> {
  await apiRequest(`/api/${API_VERSION}/admin/refresh`, {
    method: 'POST'
  })
}

/**
 * Get system status
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  const response = await apiRequest<SystemStatus>(`/api/${API_VERSION}/admin/status`)
  return response.data
}

/**
 * Get API response times
 */
export async function getResponseTimes(limit: number = 100): Promise<ResponseTime[]> {
  const response = await apiRequest<ResponseTime[]>(`/api/${API_VERSION}/admin/response-times?limit=${limit}`)
  return response.data || []
}

/**
 * Get API response time statistics
 */
export async function getResponseTimeStats(): Promise<ResponseTimeStats[]> {
  const response = await apiRequest<ResponseTimeStats[]>(`/api/${API_VERSION}/admin/response-stats`)
  return response.data || []
}

/**
 * Clear cache
 */
export async function clearCache(pattern?: string): Promise<void> {
  await apiRequest(`/api/${API_VERSION}/admin/cache/clear`, {
    method: 'POST',
    body: JSON.stringify({ pattern })
  })
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  keys: number
  hits: number
  misses: number
  hitRate: number
}> {
  const response = await apiRequest<{
    keys: number
    hits: number
    misses: number
    hitRate: number
  }>(`/api/${API_VERSION}/admin/cache/stats`)
  return response.data
}

/**
 * Assign article to user
 */
export async function assignArticle(articleId: number, userName: string, status: string = 'Assigned'): Promise<void> {
  await apiRequest(`/api/${API_VERSION}/assignments`, {
    method: 'POST',
    body: JSON.stringify({ articleId, userName, status })
  })
}

/**
 * Update assignment status and points
 */
export async function updateAssignment(
  articleId: number, 
  userName: string, 
  status: string, 
  pointsEarned?: number, 
  notes?: string
): Promise<void> {
  await apiRequest(`/api/${API_VERSION}/assignments/${articleId}/${userName}`, {
    method: 'PUT',
    body: JSON.stringify({ status, pointsEarned, notes })
  })
}

/**
 * Get assignments for a specific user
 */
export async function getUserAssignments(userName: string): Promise<{
  assignments: Assignment[]
  stats: {
    total: number
    completed: number
    inProgress: number
    assigned: number
    totalPoints: number
  }
}> {
  const response = await apiRequest<{
    assignments: Assignment[]
    stats: {
      total: number
      completed: number
      inProgress: number
      assigned: number
      totalPoints: number
    }
  }>(`/api/${API_VERSION}/assignments/user/${userName}`)
  return response.data
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{
  status: string
  timestamp: string
  uptime: number
  version: string
  environment: string
  services?: {
    database: any
    cache: any
  }
  system?: any
}> {
  const response = await apiRequest<{
    status: string
    timestamp: string
    uptime: number
    version: string
    environment: string
    services?: {
      database: any
      cache: any
    }
    system?: any
  }>('/health')
  
  return response.data || response
}

/**
 * Transform article data for table display
 */
export function transformArticlesForTable(
  articles: Article[],
  assignments: Record<number, { status: string; reviewer: string }> = {}
): Assignment[] {
  return articles.map(article => {
    // Set pointsDisplay on the article itself
    if (!article.pointsDisplay && (article.type === 'hint' || article.type === 'opdracht')) {
      article.pointsDisplay = getPointsDisplay(article)
    }
    
    return {
      id: article.id,
      title: article.title,
      type: article.type,
      publish_at: article.publish_at,
      status: assignments[article.id]?.status || article.assignments?.[0]?.status || "Not Started",
      reviewer: assignments[article.id]?.reviewer || article.assignments?.[0]?.userName || "",
      points_earned: article.assignments?.[0]?.points_earned || 0,
      max_points: article.max_points,
      progress: article.progress,
      pointsDisplay: article.pointsDisplay || getPointsDisplay(article)
    }
  })
}

/**
 * Get points display string for an article
 */
export function getPointsDisplay(article: Article): string | undefined {
  if (article.type === 'hint' || article.type === 'opdracht') {
    const earned = article.assignments?.reduce((sum, a) => sum + (a.points_earned || 0), 0) || 0
    const max = article.max_points || (article.type === 'hint' ? 3 : 5)
    return `${earned}/${max}`
  }
  return undefined
}

/**
 * Error handler helper for React components
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return 'Network error. Please check your connection.'
      case 404:
        return 'Data not found.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return error.message
    }
  }
  
  return 'An unexpected error occurred.'
}
