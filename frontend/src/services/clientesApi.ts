import { httpClient } from './httpClient'
import type { ClienteResponse } from '../types/venta'

export async function searchClientes(search: string): Promise<ClienteResponse[]> {
  const query = new URLSearchParams()
  if (search.trim()) {
    query.set('search', search.trim())
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpClient.get<ClienteResponse[]>(`/api/clientes${suffix}`)
}