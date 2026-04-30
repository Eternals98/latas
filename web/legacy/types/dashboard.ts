export interface VentasPorMesItem {
  anio: number
  mes: number
  periodo: string
  cantidad_ventas: number
  valor_total: string
}

export interface VentasPorEmpresaItem {
  empresa: string
  cantidad_ventas: number
  valor_total: string
}

export interface MetodoPagoDashboardItem {
  medio: string
  cantidad_pagos: number
  valor_total: string
  porcentaje: string
}

export interface DashboardResponse {
  ventas_por_mes: VentasPorMesItem[]
  ventas_por_empresa: VentasPorEmpresaItem[]
  metodos_pago: MetodoPagoDashboardItem[]
  ticket_promedio: string
  total_ventas: string
  total_mes_actual: string
  cantidad_ventas: number
  generado_en: string
}
