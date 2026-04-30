export type EmpresaOption = 'latas_sas' | 'tomas_gomez' | 'generico'
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

export interface CreateClienteRequest {
  nombre: string
  telefono: string | null
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
  fechaVenta: string
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
  fecha_venta: string
  numero_referencia: string
  descripcion: string
  valor_total: string
  cliente_id: number | null
  pagos: CreatePagoRequest[]
}

export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminTokenResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  expires_at: string
}

export type UpdatePagoRequest = CreatePagoRequest

export type UpdateVentaRequest = CreateVentaRequest

export interface PagoResponse {
  id: number
  venta_id: number
  medio: string
  monto: string
}

export interface VentaResponse {
  id: number
  codigo_venta: string
  empresa: string
  tipo: string
  fecha_venta: string
  numero_referencia: string
  descripcion: string
  valor_total: string
  cliente_id: number | null
  estado: string
  creado_en: string
  modificado_en: string
  pagos: PagoResponse[]
}

export interface ClienteReporte {
  id: number
  nombre: string
  telefono: string | null
}

export interface PagoReporteItem {
  id: number
  medio: string
  monto: string
}

export interface VentaReporteItem {
  id: number
  codigo_venta: string
  fecha: string
  empresa: string
  tipo: TipoOption
  numero_referencia: string
  descripcion: string
  cliente: ClienteReporte | null
  valor_total: string
  estado: string
  pagos: PagoReporteItem[]
}

export interface ResumenMensualVentas {
  mes: number
  anio: number
  cantidad_ventas: number
  valor_total: string
}

export interface VentasMensualesResponse {
  mes: number
  anio: number
  items: VentaReporteItem[]
  resumen_mensual: ResumenMensualVentas
}

export interface VentasMensualesParams {
  mes: number
  anio: number
}

export interface ExportVentasParams {
  tipo: TipoOption
  mes?: number
  anio?: number
}

export interface ImportVentasExcelResponse {
  creadas: number
  omitidas: number
  hojas_procesadas: number
  hojas_omitidas: string[]
  errores: string[]
}

export interface ApiErrorPayload {
  detail: string
}
