export type EmpresaOption = 'latas_sas' | 'tomas_gomez'
export type TipoOption = 'formal' | 'informal'

export type FormValidationState = 'neutral' | 'ok' | 'error'

export interface ClienteSummary {
  id: number
  nombre: string
  telefono: string | null
}

export interface ClienteResponse extends ClienteSummary {
  creado_en: string
  modificado_en: string
  estado: string
}

export interface MedioPagoResponse {
  id: number
  codigo: string
  nombre: string
  activo: boolean
  creado_en: string
  modificado_en: string
}

export interface PagoDraft {
  rowId: string
  medio: string
  monto: string
}

export interface RegistroVentaFormValues {
  empresa: EmpresaOption | ''
  tipo: TipoOption | ''
  numeroReferencia: string
  descripcion: string
  valorTotal: string
  telefono: string
  clienteQuery: string
  cliente: ClienteSummary | null
}

export interface CreatePagoRequest {
  medio: string
  monto: string
}

export interface CreateVentaRequest {
  empresa: EmpresaOption
  tipo: TipoOption
  numero_referencia: string
  descripcion: string
  valor_total: string
  cliente_id: number | null
  pagos: CreatePagoRequest[]
}

export interface PagoResponse {
  id: number
  venta_id: number
  medio: string
  monto: string
}

export interface VentaResponse {
  id: number
  empresa: string
  tipo: string
  numero_referencia: string
  descripcion: string
  valor_total: string
  cliente_id: number | null
  estado: string
  creado_en: string
  modificado_en: string
  pagos: PagoResponse[]
}

export interface ApiErrorPayload {
  detail: string
}