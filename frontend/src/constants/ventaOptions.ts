import type { EmpresaOption, TipoOption } from '../types/venta'

export const EMPRESA_OPTIONS: Array<{ value: EmpresaOption; label: string }> = [
  { value: 'latas_sas', label: 'LATAS SAS' },
  { value: 'tomas_gomez', label: 'Tomas Gomez' },
  { value: 'generico', label: 'GENERICO' },
]

export const TIPO_OPTIONS: Array<{ value: TipoOption; label: string }> = [
  { value: 'formal', label: 'Formal' },
  { value: 'informal', label: 'Informal' },
]
