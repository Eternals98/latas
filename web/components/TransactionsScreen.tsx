'use client';

import React, { useState } from 'react';
import { Card, Badge, Avatar, Button, Icon, Input, cn } from './Primitives';

const TXS = [
  { id: "TX-9942", date: "2026-05-08", time: "14:32", entity: "Latas S.A.S.", type: "Empresa", amount: 12450, method: "Transferencia", status: "Completado" },
  { id: "TX-9941", date: "2026-05-08", time: "12:15", entity: "Tomás Gómez", type: "Cliente", amount: 8920, method: "Efectivo", status: "Completado" },
  { id: "TX-9940", date: "2026-05-08", time: "10:04", entity: "Inversiones Beta", type: "Empresa", amount: 45000, method: "Tarjeta", status: "Pendiente" },
  { id: "TX-9939", date: "2026-05-07", time: "18:45", entity: "Maria Lopez", type: "Cliente", amount: 3200, method: "Efectivo", status: "Completado" },
  { id: "TX-9938", date: "2026-05-07", time: "16:20", entity: "Constructora Sol", type: "Empresa", amount: 128000, method: "Transferencia", status: "Completado" },
];

export const TransactionsScreen = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Buscar por ID, entidad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            prefix={<Icon name="search" size={16}/>}
            className="w-[320px]"
          />
          <Button variant="ghost" icon="filter">Filtros</Button>
        </div>
        <div className="flex gap-2.5">
          <Button variant="ghost" icon="download">Exportar CSV</Button>
          <Button variant="ghost" icon="print">Imprimir Listado</Button>
        </div>
      </div>

      <Card padding={0} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="bg-paper-200 border-b border-slate-200">
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500 w-[120px]">ID Transacción</th>
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500">Fecha y Hora</th>
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500">Entidad / Cliente</th>
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500">Medio</th>
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500 text-right">Monto</th>
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500">Estado</th>
                <th className="p-3.5 px-4 w-[100px]"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TXS.map(tx => (
                <tr key={tx.id} className="hover:bg-paper-50 transition-colors">
                  <td className="p-3.5 px-4">
                    <span className="font-mono font-bold text-brass-600 tabular-nums">{tx.id}</span>
                  </td>
                  <td className="p-3.5 px-4">
                    <div className="font-semibold text-ink-900">{tx.date}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{tx.time}</div>
                  </td>
                  <td className="p-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={tx.entity} size={28} tone={tx.type === "Empresa" ? "ink" : "brass"}/>
                      <div>
                        <div className="font-semibold text-ink-900 leading-tight">{tx.entity}</div>
                        <div className="text-[11px] text-slate-500">{tx.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Icon name={tx.method === "Efectivo" ? "cash" : "creditCard"} size={14} className="text-slate-400" />
                      {tx.method}
                    </div>
                  </td>
                  <td className="p-3.5 px-4 text-right">
                    <div className="font-mono font-extrabold text-base tabular-nums">$ {tx.amount.toLocaleString("es-CL")}</div>
                  </td>
                  <td className="p-3.5 px-4">
                    <Badge tone={tx.status === "Completado" ? "success" : "warn"}>{tx.status}</Badge>
                  </td>
                  <td className="p-3.5 px-4">
                    <div className="flex gap-1.5 justify-end">
                      <button title="Ver detalle" className="w-8 h-8 rounded-md border border-slate-200 bg-white grid place-items-center cursor-pointer text-slate-600 hover:text-ink-900 hover:border-slate-300 transition-all shadow-sm">
                        <Icon name="eye" size={14}/>
                      </button>
                      <button title="Más opciones" className="w-8 h-8 rounded-md border border-slate-200 bg-white grid place-items-center cursor-pointer text-slate-600 hover:text-ink-900 hover:border-slate-300 transition-all shadow-sm">
                        <Icon name="moreH" size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-paper-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-500">Mostrando 5 de 1,024 transacciones</div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled icon="chevronLeft">Anterior</Button>
            <Button variant="ghost" size="sm" icon="chevronRight">Siguiente</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
