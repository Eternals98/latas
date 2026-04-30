import { httpClient } from './httpClient'
import type { MedioPagoResponse } from '../types/venta'

export async function listMediosPago(): Promise<MedioPagoResponse[]> {
  return httpClient.get<MedioPagoResponse[]>('/api/medios-pago')
}