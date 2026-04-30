import { httpClient } from './httpClient'
import type { DashboardResponse } from '../types/dashboard'

export function getDashboard(): Promise<DashboardResponse> {
  return httpClient.get<DashboardResponse>('/api/dashboard')
}
