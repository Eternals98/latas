import { httpClient } from './httpClient'
import type { ClienteResponse, CreateClienteRequest } from '../types/venta'

export async function searchClientes(search: string): Promise<ClienteResponse[]> {
  const query = new URLSearchParams()
  if (search.trim()) {
    query.set('search', search.trim())
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpClient.get<ClienteResponse[]>(`/api/clientes${suffix}`)
}

export async function listClientes(limit = 200): Promise<ClienteResponse[]> {
  return httpClient.get<ClienteResponse[]>(`/api/clientes/all?limit=${limit}`)
}

export async function createCliente(payload: CreateClienteRequest): Promise<ClienteResponse> {
  return httpClient.post<ClienteResponse, CreateClienteRequest>('/api/clientes', payload)
}

export async function updateCliente(clienteId: number, payload: CreateClienteRequest): Promise<ClienteResponse> {
  return httpClient.put<ClienteResponse, CreateClienteRequest>(`/api/clientes/${clienteId}`, payload)
}
