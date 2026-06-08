import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dashboardService } from '../services/api'
import { ClipboardCheck, Users, BookOpen, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 fade-in">
      {/* Bienvenida */}
      <div className="bg-unimayor-gradient rounded-2xl p-6 text-white shadow-lg">
        <h2 className="font-heading text-2xl font-bold mb-1">
          Bienvenido, {user?.full_name?.split(' ')[0]} 👋
        </h2>
        <p className="text-white/75 text-sm">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-medium capitalize">
          <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
          {user?.role} · Colegio Mayor del Cauca
        </div>
      </div>

      {/* Stats según rol */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-xl mb-3" />
              <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : stats?.role === 'estudiante' ? (
        <EstudianteStats stats={stats} />
      ) : stats?.role === 'docente' ? (
        <DocenteStats stats={stats} />
      ) : stats?.role === 'admin' ? (
        <AdminStats stats={stats} />
      ) : null}

      {/* Acciones rápidas según rol */}
      <div className="card">
        <h3 className="font-heading font-bold text-gray-900 mb-4">Acciones rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <a href="/attendance" className="flex items-center gap-3 p-4 rounded-xl bg-unimayor-green-50 hover:bg-unimayor-green-100 transition-colors cursor-pointer">
            <ClipboardCheck className="text-unimayor-green-600" size={22} />
            <span className="font-medium text-unimayor-green-700 text-sm">
              {user?.role === 'estudiante' ? 'Mi asistencia' : 'Tomar asistencia'}
            </span>
          </a>
          {(user?.role === 'admin' || user?.role === 'docente') && (
            <a href="/reports" className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
              <TrendingUp className="text-blue-600" size={22} />
              <span className="font-medium text-blue-700 text-sm">Ver reportes</span>
            </a>
          )}
          {(user?.role === 'admin' || user?.role === 'docente') && (
            <a href="/students" className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
              <Users className="text-purple-600" size={22} />
              <span className="font-medium text-purple-700 text-sm">
                {user?.role === 'admin' ? 'Gestionar usuarios' : 'Ver estudiantes'}
              </span>
            </a>
          )}
          {user?.role === 'admin' && (
            <a href="/courses" className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer">
              <BookOpen className="text-yellow-600" size={22} />
              <span className="font-medium text-yellow-700 text-sm">Gestionar cursos</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Stats estudiante ────────────────────────────────────────────────────────
function EstudianteStats({ stats }) {
  const pct = stats.percentage ?? 0
  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-heading font-semibold text-gray-800 mb-4">Mi asistencia — Electiva V</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`font-bold text-xl w-14 text-right ${pct >= 80 ? 'text-green-700' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {pct}%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">{stats.total_sessions}</p>
            <p className="text-xs text-gray-500 mt-1">Clases</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.presente}</p>
            <p className="text-xs text-green-600 mt-1">Presentes</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.ausente}</p>
            <p className="text-xs text-red-600 mt-1">Ausentes</p>
          </div>
        </div>
        {pct < 80 && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
            <p className="text-orange-700 text-sm font-medium">⚠️ Estás por debajo del 80% requerido</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stats docente ────────────────────────────────────────────────────────────
function DocenteStats({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Mis cursos', value: stats.total_courses, icon: BookOpen, color: 'bg-blue-50 text-blue-700' },
        { label: 'Sesiones', value: stats.total_sessions, icon: ClipboardCheck, color: 'bg-green-50 text-green-700' },
        { label: 'Estudiantes', value: stats.total_students, icon: Users, color: 'bg-purple-50 text-purple-700' },
        { label: 'Asistencia', value: `${stats.attendance_percentage}%`, icon: TrendingUp, color: 'bg-yellow-50 text-yellow-700' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card">
          <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>
            <Icon size={20} />
          </div>
          <p className="text-2xl font-heading font-bold text-gray-900">{value}</p>
          <p className="text-gray-500 text-sm mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Stats admin ──────────────────────────────────────────────────────────────
function AdminStats({ stats }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Estudiantes activos', value: stats.total_students, icon: Users, color: 'bg-blue-50 text-blue-700' },
          { label: 'Docentes', value: stats.total_docentes, icon: BookOpen, color: 'bg-purple-50 text-purple-700' },
          { label: 'Sesiones totales', value: stats.total_sessions, icon: ClipboardCheck, color: 'bg-green-50 text-green-700' },
          { label: 'Asistencia promedio', value: `${stats.attendance_percentage}%`, icon: TrendingUp, color: 'bg-yellow-50 text-yellow-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-heading font-bold text-gray-900">{value}</p>
            <p className="text-gray-500 text-sm mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {stats.total_records > 0 && (
        <div className="card">
          <h3 className="font-heading font-semibold text-gray-800 mb-3">Resumen global de asistencia</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-4 bg-unimayor-gradient rounded-full transition-all duration-700"
                style={{ width: `${stats.attendance_percentage}%` }}
              />
            </div>
            <span className="text-sm font-bold text-unimayor-green-700 w-12 text-right">
              {stats.attendance_percentage}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {stats.present_records} presentes de {stats.total_records} registros totales
          </p>
        </div>
      )}
    </>
  )
}