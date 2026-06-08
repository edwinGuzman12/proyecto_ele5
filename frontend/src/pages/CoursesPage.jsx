import { useState, useEffect } from 'react'
import { BookOpen, Plus, Users, X, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { courseService, userService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

function CourseModal({ course, onClose, onSave }) {
  const [form, setForm] = useState({
    name: course?.name || '',
    code: course?.code || '',
    program: course?.program || '',
    semester: course?.semester || 1,
    teacher_id: course?.teacher_id || '',
  })
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    userService.listUsers()
      .then(users => setTeachers(users.filter(u => u.role === 'docente')))
      .catch(() => toast.error('Error al cargar docentes'))
  }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.program || !form.teacher_id) {
      toast.error('Todos los campos son obligatorios')
      return
    }
    setLoading(true)
    try {
      if (course) {
        await courseService.updateCourse(course.id, form)
        toast.success('Materia actualizada')
      } else {
        await courseService.createCourse({
          ...form,
          semester: Number(form.semester),
          teacher_id: Number(form.teacher_id)
        })
        toast.success('Materia creada')
      }
      onSave()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold text-gray-900">
            {course ? 'Editar materia' : 'Nueva materia'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input className="input-field" placeholder="Ej: Electiva 5" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input className="input-field" placeholder="Ej: ELE5-2026" value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
            <input className="input-field" placeholder="Ej: Ingeniería de Sistemas" value={form.program}
              onChange={e => setForm(f => ({ ...f, program: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
            <input className="input-field" type="number" min={1} max={10} value={form.semester}
              onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Docente</label>
            <select className="input-field" value={form.teacher_id}
              onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}>
              <option value="">Selecciona un docente</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CourseStudents({ courseId, allStudents }) {
  const [enrolled, setEnrolled] = useState([])
  const [loading, setLoading] = useState(true)

  const loadStudents = async () => {
    try {
      const data = await courseService.getCourseStudents(courseId)
      setEnrolled(data)
    } catch {
      toast.error('Error al cargar estudiantes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStudents() }, [courseId])

  const enrolledIds = enrolled.map(s => s.id)
  const notEnrolled = allStudents.filter(s => !enrolledIds.includes(s.id))

  const handleEnroll = async (studentId) => {
    try {
      await courseService.enrollStudent(courseId, studentId)
      toast.success('Estudiante matriculado')
      loadStudents()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al matricular')
    }
  }

  const handleUnenroll = async (studentId) => {
    try {
      await courseService.unenrollStudent(courseId, studentId)
      toast.success('Estudiante desmatriculado')
      loadStudents()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al desmatricular')
    }
  }

  if (loading) return <p className="text-sm text-gray-400 py-2">Cargando...</p>

  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Estudiantes matriculados ({enrolled.length})</p>
        {enrolled.length === 0 ? (
          <p className="text-sm text-gray-400">Sin estudiantes matriculados</p>
        ) : (
          <div className="space-y-2">
            {enrolled.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.full_name}</p>
                  <p className="text-xs text-gray-500">{s.student_code}</p>
                </div>
                <button onClick={() => handleUnenroll(s.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {notEnrolled.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Agregar estudiantes</p>
          <div className="space-y-2">
            {notEnrolled.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.full_name}</p>
                  <p className="text-xs text-gray-500">{s.student_code}</p>
                </div>
                <button onClick={() => handleEnroll(s.id)} className="text-xs text-unimayor-green-600 hover:text-unimayor-green-800 font-medium">
                  Matricular
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CourseCard({ course, allStudents, onEdit, isAdmin }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-unimayor-green-100 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-unimayor-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{course.name}</h3>
            <p className="text-xs text-gray-500">{course.code} · {course.program} · Semestre {course.semester}</p>
            <p className="text-xs text-gray-400">Docente: {course.teacher_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => onEdit(course)} className="text-gray-400 hover:text-gray-600">
              <Pencil size={16} />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
            <Users size={16} />
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {expanded && <CourseStudents courseId={course.id} allStudents={allStudents} />}
    </div>
  )
}

export default function CoursesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCourse, setEditCourse] = useState(null)

  const loadData = async () => {
    try {
      const [coursesData, usersData] = await Promise.all([
        courseService.listCourses(),
        userService.listUsers(),
      ])
      setCourses(coursesData)
      setStudents(usersData.filter(u => u.role === 'estudiante'))
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleEdit = (course) => {
    setEditCourse(course)
    setShowModal(true)
  }

  const handleSave = () => {
    setShowModal(false)
    setEditCourse(null)
    loadData()
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-gray-900">Materias</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión de cursos y asignaciones</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditCourse(null); setShowModal(true) }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Agregar materia
          </button>
        )}
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-400">Cargando...</div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">No hay materias registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} allStudents={students} onEdit={handleEdit} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {showModal && (
        <CourseModal
          course={editCourse}
          onClose={() => { setShowModal(false); setEditCourse(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}