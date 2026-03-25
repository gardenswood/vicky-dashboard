'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  SlidersHorizontal,
  Save,
  CheckCircle2,
  AlertCircle,
  Bot,
  Clock,
  Power,
  Info,
  Phone,
} from 'lucide-react'

interface ConfigGeneral {
  delayMinSeg: number
  delayMaxSeg: number
  modeloGemini: string
  frecuenciaAudioFidelizacion: number
  tiempoSilencioHumanoHoras: number
  botActivo: boolean
  adminPhone: string
  horaAtencionDesde: string
  horaAtencionHasta: string
}

const DEFAULT_CONFIG: ConfigGeneral = {
  delayMinSeg: 10,
  delayMaxSeg: 15,
  modeloGemini: 'gemini-2.5-flash',
  frecuenciaAudioFidelizacion: 4,
  tiempoSilencioHumanoHoras: 24,
  botActivo: true,
  adminPhone: '',
  horaAtencionDesde: '08:00',
  horaAtencionHasta: '17:00',
}

const MODELOS_GEMINI = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (recomendado, rápido)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (más inteligente, más lento)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (estable)' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (legacy)' },
]

export default function ConfigGeneralPage() {
  const [config, setConfig] = useState<ConfigGeneral>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const snap = await getDoc(doc(db, 'config', 'general'))
      if (snap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...snap.data() })
      }
    } catch {
      setError('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  async function saveConfig() {
    setSaving(true)
    setError('')
    try {
      await setDoc(doc(db, 'config', 'general'), {
        ...config,
        ultimaActualizacion: serverTimestamp(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  function update(changes: Partial<ConfigGeneral>) {
    setConfig((prev) => ({ ...prev, ...changes }))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Configuración general</h1>
            <p className="text-slate-500 text-sm">Ajustes de comportamiento del bot</p>
          </div>
        </div>
        <button onClick={saveConfig} disabled={saving} className="btn-primary flex items-center gap-1.5">
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Bot status */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Power className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Estado del bot</h2>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900">Bot activo</p>
              <p className="text-xs text-slate-500">Cuando está inactivo, el bot no responde mensajes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.botActivo}
                onChange={(e) => update({ botActivo: e.target.checked })}
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${config.botActivo ? 'bg-brand-600' : 'bg-slate-300'} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full`} />
            </label>
          </div>
        </div>

        {/* Response delay */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Delay de respuesta</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Tiempo de espera antes de responder (simula escritura humana)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Mínimo (segundos)</label>
              <input
                type="number"
                className="input"
                min={1}
                max={60}
                value={config.delayMinSeg}
                onChange={(e) => update({ delayMinSeg: parseInt(e.target.value) || 5 })}
              />
              <input
                type="range"
                min={1}
                max={60}
                value={config.delayMinSeg}
                onChange={(e) => update({ delayMinSeg: parseInt(e.target.value) })}
                className="w-full mt-2 accent-brand-600"
              />
            </div>
            <div>
              <label className="label">Máximo (segundos)</label>
              <input
                type="number"
                className="input"
                min={1}
                max={120}
                value={config.delayMaxSeg}
                onChange={(e) => update({ delayMaxSeg: parseInt(e.target.value) || 15 })}
              />
              <input
                type="range"
                min={1}
                max={120}
                value={config.delayMaxSeg}
                onChange={(e) => update({ delayMaxSeg: parseInt(e.target.value) })}
                className="w-full mt-2 accent-brand-600"
              />
            </div>
          </div>
          <div className="mt-3 bg-blue-50 rounded-lg p-3 flex gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              El bot espera entre {config.delayMinSeg}s y {config.delayMaxSeg}s antes de responder. 
              Recomendado: 8-15 segundos para parecer natural.
            </p>
          </div>
        </div>

        {/* AI Model */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Modelo de IA</h2>
          </div>
          <div>
            <label className="label">Modelo Gemini</label>
            <select
              className="input"
              value={config.modeloGemini}
              onChange={(e) => update({ modeloGemini: e.target.value })}
            >
              {MODELOS_GEMINI.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Human takeover */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Control humano</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Silencio cuando humano atiende (horas)</label>
              <input
                type="number"
                className="input"
                min={1}
                max={168}
                value={config.tiempoSilencioHumanoHoras}
                onChange={(e) => update({ tiempoSilencioHumanoHoras: parseInt(e.target.value) || 24 })}
              />
              <p className="text-xs text-slate-500 mt-1">
                El bot se silencia {config.tiempoSilencioHumanoHoras}h cuando el dueño responde desde el teléfono
              </p>
            </div>
            <div>
              <label className="label">Frecuencia audio fidelización</label>
              <input
                type="number"
                className="input"
                min={1}
                max={20}
                value={config.frecuenciaAudioFidelizacion}
                onChange={(e) => update({ frecuenciaAudioFidelizacion: parseInt(e.target.value) || 4 })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Envía audio de fidelización cada {config.frecuenciaAudioFidelizacion} mensajes de texto
              </p>
            </div>
          </div>
        </div>

        {/* Contact & schedule */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Contacto y horarios</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Teléfono del admin (solo números, sin +)</label>
              <input
                type="text"
                className="input"
                placeholder="5493514000000"
                value={config.adminPhone}
                onChange={(e) => update({ adminPhone: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Número que recibe notificaciones de la cola de leña y puede usar comandos admin
              </p>
            </div>
            <div>
              <label className="label">Horario de atención — desde</label>
              <input
                type="time"
                className="input"
                value={config.horaAtencionDesde}
                onChange={(e) => update({ horaAtencionDesde: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Horario de atención — hasta</label>
              <input
                type="time"
                className="input"
                value={config.horaAtencionHasta}
                onChange={(e) => update({ horaAtencionHasta: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
