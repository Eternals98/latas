import { formatMoney } from '../../utils/money'

interface PaymentBalanceIndicatorProps {
  total: number
  paymentTotal: number
  isBalanced: boolean
}

export function PaymentBalanceIndicator({ total, paymentTotal, isBalanced }: PaymentBalanceIndicatorProps) {
  const diff = total - paymentTotal
  const hasInput = total > 0 || paymentTotal > 0

  if (!hasInput) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Ingresa total y pagos para validar cuadre.
      </div>
    )
  }

  if (isBalanced) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Cuadre OK. Total y pagos coinciden: {formatMoney(total)}.
      </div>
    )
  }

  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      Descuadre detectado. Diferencia: {formatMoney(diff)}. Ajusta total o montos antes de guardar.
    </div>
  )
}
