/**
 * Translation utility for the application.
 * Maps backend keys to localized strings for English and Spanish.
 */

type Language = "en" | "es";
let currentLang: Language = "es"; // Default language

const translations: Record<Language, Record<string, string>> = {
  en: {
    "transactions.sale": "Sale",
    "transactions.movement": "Movement",
    "transactions.pay": "Payment",
    "transactions.return": "Return",
    "terms.Contado": "Cash",
    "terms.Credito": "Credit",
    "status.confirmed": "Confirmed",
    "status.pending": "Pending",
    "status.cancelled": "Cancelled",
    "cash.open": "OPEN",
    "cash.closed": "CLOSED",
    "cash.opening": "Opening",
    "cash.closing": "Closing",
    "cash.delivery": "Vault Delivery",
    "cash.adjustment": "Adjustment",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.search": "Search",
  },
  es: {
    "transactions.sale": "Venta",
    "transactions.movement": "Movimiento",
    "transactions.pay": "Pago",
    "transactions.return": "Devolución",
    "terms.Contado": "Contado",
    "terms.Credito": "Crédito",
    "status.confirmed": "Confirmado",
    "status.pending": "Pendiente",
    "status.cancelled": "Anulado",
    "cash.open": "ABIERTA",
    "cash.closed": "CERRADA",
    "cash.opening": "Apertura",
    "cash.closing": "Cierre",
    "cash.delivery": "Entrega a Bóveda",
    "cash.adjustment": "Ajuste",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.search": "Buscar",
  },
};

export function setLanguage(lang: Language) {
  currentLang = lang;
}

export function t(key: string): string {
  const keys = key.split(".");
  let current: any = translations[currentLang];

  for (const k of keys) {
    if (current[k]) {
      current = current[k];
    } else {
      return key; // Fallback to key if not found
    }
  }

  return typeof current === "string" ? current : key;
}
