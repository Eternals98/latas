import { httpClient } from './httpClient'
import type { CreateVentaRequest, VentaResponse } from '../types/venta'

export async function createVenta(payload: CreateVentaRequest): Promise<VentaResponse> {
  return httpClient.post<VentaResponse, CreateVentaRequest>('/api/ventas', payload)
}