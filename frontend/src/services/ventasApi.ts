import { API_URL, httpClient } from './httpClient'
import type {
  AdminLoginRequest,
  AdminTokenResponse,
  CreateVentaRequest,
  ExportVentasParams,
  ImportVentasExcelResponse,
  TipoOption,
  UpdateVentaRequest,
  VentaResponse,
  VentasMensualesParams,
  VentasMensualesResponse,
} from '../types/venta'

function adminAuthHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

export async function adminLogin(payload: AdminLoginRequest): Promise<AdminTokenResponse> {
  return httpClient.post<AdminTokenResponse, AdminLoginRequest>('/api/admin/login', payload)
}

export async function createVenta(payload: CreateVentaRequest): Promise<VentaResponse> {
  return httpClient.post<VentaResponse, CreateVentaRequest>('/api/ventas', payload)
}

export async function updateVenta(
  ventaId: number,
  payload: UpdateVentaRequest,
  token: string,
): Promise<VentaResponse> {
  return httpClient.put<VentaResponse, UpdateVentaRequest>(`/api/ventas/${ventaId}`, payload, {
    headers: adminAuthHeaders(token),
  })
}

export async function annulVenta(ventaId: number, token: string): Promise<VentaResponse> {
  return httpClient.delete<VentaResponse>(`/api/ventas/${ventaId}`, {
    headers: adminAuthHeaders(token),
  })
}

export async function listVentasByMonth(
  params: VentasMensualesParams,
): Promise<VentasMensualesResponse> {
  const search = new URLSearchParams({
    mes: String(params.mes),
    anio: String(params.anio),
  })
  return httpClient.get<VentasMensualesResponse>(`/api/ventas?${search.toString()}`)
}

export async function exportVentas(params: ExportVentasParams): Promise<Blob> {
  const search = new URLSearchParams({ tipo: params.tipo })
  if (params.mes !== undefined) {
    search.set('mes', String(params.mes))
  }
  if (params.anio !== undefined) {
    search.set('anio', String(params.anio))
  }

  const response = await fetch(`${API_URL}/api/ventas/export?${search.toString()}`)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.blob()
}

export async function importVentasExcel(
  params: {
    archivo: File
    mes: number
    anio: number
    tipo_default: TipoOption
  },
  token: string,
): Promise<ImportVentasExcelResponse> {
  const formData = new FormData()
  formData.append('archivo', params.archivo)
  formData.append('mes', String(params.mes))
  formData.append('anio', String(params.anio))
  formData.append('tipo_default', params.tipo_default)

  const response = await fetch(`${API_URL}/api/ventas/import-excel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const payload = (await response.json()) as ImportVentasExcelResponse | { detail?: string }
  if (!response.ok) {
    throw new Error((payload as { detail?: string }).detail || `Request failed with status ${response.status}`)
  }
  return payload as ImportVentasExcelResponse
}
