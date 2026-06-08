import { useState, useEffect, useCallback } from 'react'
import { attendanceService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, XCircle, ClipboardCheck, RefreshCw, CalendarDays, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Vista Docente / Admin ────────────────────────────────────────────────────
function TeacherView() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await attendanceService.getElectiva5()
      setData(res)
    } catch {
      toast.error('Error al cargar asistencia')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleNewSession = async () => {
    setCreating(true)
    try {
      await attendanceService.createElectiva5Session()
      toast.success('Nueva sesión creada')
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al crear sesión')
    } finally {
      setCreating(false)
    }
  }

  const handleMark = async (studentId, status) => {
    setMarking(studentId)
    try {
      await attendanceService.markElectiva5(studentId, status)
      setData(prev => ({
        ...prev,
        students: prev.students.map(s =>
          s.student_id === studentId ? { ...s, status } : s
        )
      }))
      toast.success(status === 'presente' ? '✓ Presente' : '✗ Ausente')
    } catch {
      toast.error('Error al marcar asistencia')
    } finally {
      setMarking(null)
    }
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-unimayor-green-600" />
      </div>
    )
  }

  if (!data) return null

  const present = data.students.filter(s => s.status === 'presente').length
  const absent  = data.students.filter(s => s.status === 'ausente').length
  const pending = data.students.filter(s => !s.status).length
  const total   = data.students.length

  return (
    <div className="space-y-4">
      {/* Info sesión */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading font-bold text-gray-900 text-lg">{data.course.name}</h3>
            {data.session && (
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                <CalendarDays size={14} />
                {format(new Date(data.session.date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                &nbsp;·&nbsp; Código: <span className="font-mono font-bold text-unimayor-green-700">{data.session.session_code}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewSession}
              disabled={creating}
              className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
              <Plus size={16} />
              {creating ? 'Creando...' : 'Nueva sesión'}
            </button>
            <button onClick={load} className="p-2 text-gray-400 hover:text-unimayor-green-600 transition-colors" title="Recargar">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{present}</p>
            <p className="text-xs text-green-600 mt-0.5">Presentes</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{absent}</p>
            <p className="text-xs text-red-600 mt-0.5">Ausentes</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-600">{pending}</p>
            <p className="text-xs text-gray-500 mt-0.5">Sin marcar</p>
          </div>
        </div>
      </div>

      {/* Lista de estudiantes */}
      <div className="card">
        <h3 className="font-heading font-semibold text-gray-800 mb-4">
          Estudiantes ({total})
        </h3>
        {total === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay estudiantes registrados</p>
        ) : (
          <div className="space-y-2">
            {data.students.map(s => (
              <div
                key={s.student_id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  s.status === 'presente' ? 'bg-green-50 border-green-200' :
                  s.status === 'ausente'  ? 'bg-red-50   border-red-200'   :
                                            'bg-gray-50  border-gray-200'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.student_code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMark(s.student_id, 'presente')}
                    disabled={marking === s.student_id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      s.status === 'presente'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <CheckCircle size={14} />
                    Asistió
                  </button>
                  <button
                    onClick={() => handleMark(s.student_id, 'ausente')}
                    disabled={marking === s.student_id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      s.status === 'ausente'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-white text-red-700 border border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <XCircle size={14} />
                    No asistió
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Vista Estudiante ─────────────────────────────────────────────────────────
function StudentView() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    attendanceService.getElectiva5()
      .then(setData)
      .catch(() => toast.error('Error al cargar tu asistencia'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-unimayor-green-600" />
      </div>
    )
  }

  if (!data) return null

  const { summary, sessions, course } = data
  const pct = summary?.percentage ?? 0

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-heading font-bold text-gray-900 text-lg">{course?.name}</h3>
        <p className="text-gray-500 text-sm mt-1">Mi asistencia — {data.student_name}</p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${pct >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`font-bold text-lg ${pct >= 70 ? 'text-green-700' : 'text-red-600'}`}>{pct}%</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">{summary?.total ?? 0}</p>
            <p className="text-xs text-gray-500">Clases</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{summary?.presente ?? 0}</p>
            <p className="text-xs text-green-600">Presentes</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{summary?.ausente ?? 0}</p>
            <p className="text-xs text-red-600">Ausentes</p>
          </div>
        </div>
      </div>

      {sessions?.length > 0 && (
        <div className="card">
          <h3 className="font-heading font-semibold text-gray-800 mb-3">Historial de clases</h3>
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.session_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-700">
                  {format(new Date(s.date), "d MMM yyyy · HH:mm", { locale: es })}
                </p>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  s.status === 'presente' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {s.status === 'presente' ? '✓ Presente' : '✗ Ausente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { user } = useAuth()
  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="text-unimayor-green-600" size={28} />
        <div>
          <h2 className="font-heading text-2xl font-bold text-gray-900">Asistencia · Electiva 5</h2>
          <p className="text-gray-500 text-sm">Electiva 5 — Colegio Mayor del Cauca</p>
        </div>
      </div>

      {user?.role === 'estudiante' ? <StudentView /> : <TeacherView />}
    </div>
  )
}