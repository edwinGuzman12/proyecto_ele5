import { useState, useEffect } from 'react'
import { reportService, courseService } from '../services/api'
import { BarChart3, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = { presente: '#2E7D32', ausente: '#C62828', tardanza: '#F57F17', justificado: '#1565C0' }

export default function ReportsPage() {
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)

  useEffect(() => {
    courseService.listCourses()
      .then(data => {
        setCourses(data)
        if (data.length > 0) setCourseId(String(data[0].id))
      })
      .catch(() => toast.error('Error al cargar cursos'))
      .finally(() => setLoadingCourses(false))
  }, [])

  const loadSummary = async (e) => {
    e.preventDefault()
    if (!courseId) return
    setLoading(true)
    try {
      const data = await reportService.getCourseSummary(Number(courseId))
      setSummary(data)
    } catch {
      toast.error('Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const chartData = summary ? Object.entries(summary.stats).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    cantidad: count,
    status
  })) : []

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="font-heading text-2xl font-bold text-gray-900">Reportes</h2>
        <p className="text-gray-500 text-sm mt-1">Estadísticas y exportación de asistencia</p>
      </div>

      <div className="card">
        <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="text-unimayor-green-600" size={20} />
          Consultar curso
        </h3>
        <form onSubmit={loadSummary} className="flex gap-3">
          {loadingCourses ? (
            <div className="input-field flex-1 text-gray-400">Cargando cursos...</div>
          ) : (
            <select
              className="input-field flex-1"
              value={courseId}
              onChange={e => { setCourseId(e.target.value); setSummary(null) }}
            >
              {courses.length === 0 && (
                <option value="">Sin cursos disponibles</option>
              )}
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.code}</option>
              ))}
            </select>
          )}
          <button type="submit" disabled={loading || !courseId} className="btn-primary whitespace-nowrap">
            {loading ? 'Cargando...' : 'Ver reporte'}
          </button>
        </form>
      </div>

      {summary && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-gray-900">{summary.course.name}</h3>
              <p className="text-gray-500 text-sm">{summary.total_sessions} sesiones registradas</p>
            </div>
            <button
              onClick={() => reportService.downloadExcel(summary.course.id, summary.course.code)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={16} />
              Exportar Excel
            </button>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value) => [value, 'Registros']}
              />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.status] || '#9E9E9E'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}