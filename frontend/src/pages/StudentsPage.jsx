import { useState, useEffect } from 'react'
import { userService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import {
  Users, Trash2, Search, GraduationCap, BookOpen,
  ShieldCheck, Plus, X, Eye, EyeOff, UserCheck, UserX
} from 'lucide-react'
import toast from 'react-hot-toast'

const roleLabel = { admin: 'Admin', docente: 'Docente', estudiante: 'Estudiante' }
const roleBadge = {
  admin:      'bg-purple-100 text-purple-700',
  docente:    'bg-blue-100   text-blue-700',
  estudiante: 'bg-green-100  text-green-700',
}

// ── Modal crear usuario ─────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    full_name: '', username: '', email: '', password: '',
    role: 'estudiante', student_code: '', program: '', semester: 1,
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        full_name: form.full_name,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      }
      if (form.role === 'estudiante') {
        payload.student_code = form.student_code
        payload.program = form.program
        payload.semester = Number(form.semester)
      }
      const newUser = await userService.createUser(payload)
      toast.success(`Usuario ${newUser.full_name} creado`)
      onCreated(newUser)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-heading font-bold text-gray-900 text-lg">Nuevo usuario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input className="input-field" name="full_name" value={form.full_name} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input className="input-field" name="username" value={form.username} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select className="input-field" name="role" value={form.role} onChange={handleChange}>
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input className="input-field" name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                className="input-field pr-10"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {form.role === 'estudiante' && (
            <>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Datos del estudiante</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de estudiante</label>
                    <input className="input-field" name="student_code" placeholder="ej. UNI-2026-003"
                      value={form.student_code} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
                    <input className="input-field" name="program" placeholder="ej. Ingeniería de Sistemas"
                      value={form.program} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
                    <input className="input-field" name="semester" type="number" min="1" max="10"
                      value={form.semester} onChange={handleChange} required />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tabla de usuarios ───────────────────────────────────────────────────────
function UserTable({ title, icon: Icon, rows, me, onDelete, onToggle, deleting, toggling }) {
  if (rows.length === 0) return null
  return (
    <div className="card">
      <h3 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Icon size={18} className="text-unimayor-green-600" />
        {title} ({rows.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 text-gray-500 font-medium">Nombre</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">Usuario</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium hidden md:table-cell">Email</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">Rol</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">Estado</th>
              {me?.role === 'admin' && <th className="py-2 px-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                <td className="py-2.5 px-3 font-medium text-gray-900">{u.full_name}</td>
                <td className="py-2.5 px-3 text-gray-600">@{u.username}</td>
                <td className="py-2.5 px-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role]}`}>
                    {roleLabel[u.role]}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {me?.role === 'admin' && (
                  <td className="py-2.5 px-3 text-right">
                    {u.id !== me.id && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onToggle(u)}
                          disabled={toggling === u.id}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40"
                          title={u.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {toggling === u.id
                            ? <div className="animate-spin h-4 w-4 border-b-2 border-blue-500 rounded-full" />
                            : u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          onClick={() => onDelete(u)}
                          disabled={deleting === u.id}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Eliminar usuario"
                        >
                          {deleting === u.id
                            ? <div className="animate-spin h-4 w-4 border-b-2 border-red-500 rounded-full" />
                            : <Trash2 size={16} />}
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Página principal ────────────────────────────────────────────────────────
export default function StudentsPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await userService.listUsers()
      setUsers(data)
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (u) => {
    if (!window.confirm(`¿Eliminar a ${u.full_name}? Esta acción no se puede deshacer.`)) return
    setDeleting(u.id)
    try {
      await userService.deleteUser(u.id)
      toast.success(`${u.full_name} eliminado`)
      setUsers(prev => prev.filter(x => x.id !== u.id))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggle = async (u) => {
    setToggling(u.id)
    try {
      const updated = await userService.toggleUser(u.id)
      toast.success(`${u.full_name} ${updated.is_active ? 'activado' : 'desactivado'}`)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: updated.is_active } : x))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al cambiar estado')
    } finally {
      setToggling(null)
    }
  }

  const handleCreated = (newUser) => {
    setUsers(prev => [...prev, newUser])
  }

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const students = filtered.filter(u => u.role === 'estudiante')
  const docentes = filtered.filter(u => u.role === 'docente')
  const admins   = filtered.filter(u => u.role === 'admin')

  return (
    <div className="space-y-6 fade-in">
      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-500 text-sm mt-1">{users.length} usuarios registrados</p>
        </div>
        {me?.role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nuevo usuario
          </button>
        )}
      </div>

      <div className="card">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Buscar por nombre, usuario o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-unimayor-green-600" />
        </div>
      ) : (
        <>
          <UserTable title="Estudiantes" icon={GraduationCap} rows={students} me={me}
            onDelete={handleDelete} onToggle={handleToggle} deleting={deleting} toggling={toggling} />
          <UserTable title="Docentes" icon={BookOpen} rows={docentes} me={me}
            onDelete={handleDelete} onToggle={handleToggle} deleting={deleting} toggling={toggling} />
          {admins.length > 0 && (
            <UserTable title="Administradores" icon={ShieldCheck} rows={admins} me={me}
              onDelete={handleDelete} onToggle={handleToggle} deleting={deleting} toggling={toggling} />
          )}
          {filtered.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-40" />
              <p>No se encontraron usuarios</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}