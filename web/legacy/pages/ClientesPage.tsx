import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { ApiError } from '../services/httpClient'
import { createCliente, listClientes, searchClientes, updateCliente } from '../services/clientesApi'
import type { ClienteResponse, CreateClienteRequest } from '../types/venta'

function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10)
}

export function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteResponse[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editing, setEditing] = useState<ClienteResponse | null>(null)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function loadClientes(query: string) {
    setIsLoading(true)
    try {
      const items = query.trim().length > 0 ? await searchClientes(query) : await listClientes()
      setClientes(items)
    } catch {
      setMessage({ type: 'error', text: 'No fue posible cargar clientes.' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadClientes(search)
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  const isPhoneValid = useMemo(() => telefono.length === 0 || telefono.length === 10, [telefono])
  const canSave = nombre.trim().length > 0 && isPhoneValid && !isSaving

  function startCreate() {
    setEditing(null)
    setNombre('')
    setTelefono('')
    setMessage(null)
  }

  function startEdit(cliente: ClienteResponse) {
    setEditing(cliente)
    setNombre(cliente.nombre)
    setTelefono(sanitizePhone(cliente.telefono ?? ''))
    setMessage(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) {
      return
    }

    const payload: CreateClienteRequest = {
      nombre: nombre.trim(),
      telefono: telefono ? telefono : null,
    }

    setIsSaving(true)
    setMessage(null)
    try {
      if (editing) {
        await updateCliente(editing.id, payload)
        setMessage({ type: 'success', text: 'Cliente actualizado correctamente.' })
      } else {
        await createCliente(payload)
        setMessage({ type: 'success', text: 'Cliente creado correctamente.' })
      }
      startCreate()
      await loadClientes(search)
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'error', text: 'No fue posible guardar el cliente.' })
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-7 md:px-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clientes</h1>
        <p className="mt-1 text-sm text-slate-600">Administra clientes para mantener el registro de ventas bajo control.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <input
              className="h-11 w-full max-w-md rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Buscar cliente por nombre..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="button" onClick={startCreate} className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
              Nuevo
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Nombre</th>
                  <th className="px-3 py-3 font-semibold">Teléfono</th>
                  <th className="px-3 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="px-3 py-2 text-sm text-slate-800">{cliente.nombre}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{cliente.telefono ?? '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(cliente)}
                        className="rounded-md px-2 py-1 text-sm text-blue-700 hover:bg-blue-50"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && clientes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-500">
                      No hay clientes para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {isLoading && <p className="mt-2 text-sm text-slate-500">Cargando clientes...</p>}
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>

          <div className="space-y-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Nombre
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Teléfono
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={telefono}
                onChange={(event) => setTelefono(sanitizePhone(event.target.value))}
                placeholder="3001234567"
                inputMode="numeric"
                maxLength={10}
              />
              {telefono.length > 0 && telefono.length < 10 && (
                <span className="text-xs text-rose-600">Debe tener exactamente 10 dígitos.</span>
              )}
            </label>
          </div>

          {message && (
            <div
              className={`mt-4 rounded-md px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={startCreate} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
              Limpiar
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? 'Guardando...' : editing ? 'Actualizar cliente' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
