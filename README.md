# 🎓 Sistema de Asistencia — Unimayor
### Colegio Mayor del Cauca · Electiva 5

> Sistema web institucional para la gestión de asistencia académica, desarrollado con **React + FastAPI + PostgreSQL + Docker** y coordinado por un equipo de agentes IA.

---

## ✨ Características

- **Autenticación JWT** con roles: Administrador, Docente y Estudiante
- **Toma de asistencia** mediante código único de sesión (6 caracteres)
- **Dashboard** con estadísticas en tiempo real
- **Reportes exportables** en Excel (con formato institucional Unimayor)
- **Interfaz** con paleta verde institucional del Colegio Mayor del Cauca
- **Todo dockerizado** — levanta con un solo comando

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI 0.111 + Python 3.11 |
| Base de Datos | PostgreSQL 15 |
| ORM | SQLAlchemy 2.0 + Alembic |
| Autenticación | JWT (python-jose + passlib/bcrypt) |
| Contenedores | Docker + Docker Compose |
| Gestión de tareas | Jira (proyecto ELE5) |

---

## 🚀 Inicio Rápido

### Prerequisitos
- Docker 24+
- Docker Compose v2+
- Git

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/dokiromboide/proyecto_ele5.git
cd proyecto_ele5

# 2. Configurar variables de entorno
cp .env.example .env
# (Editar .env si es necesario)

# 3. Levantar todos los servicios
docker-compose up -d --build

# 4. Verificar que todo esté corriendo
docker-compose ps
```

### Acceder a la aplicación

| Servicio | URL |
|---------|-----|
| 🌐 Frontend (UI) | http://localhost:3000 |
| ⚡ Backend API | http://localhost:8000 |
| 📖 Swagger Docs | http://localhost:8000/docs |
| 🗄️ PostgreSQL | localhost:5432 |

### Usuarios de prueba (desarrollo)

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `unimayor2024` | Administrador |
| `docente1` | `unimayor2024` | Docente |
| `estudiante1` | `unimayor2024` | Estudiante |

---

## 🤖 Equipo de Agentes IA

Este proyecto usa 6 agentes IA especializados (Claude Code agents):

| Agente | Responsabilidad |
|--------|----------------|
| `jira-agent` | Gestión de tareas Jira, backlog, sprints |
| `backend-agent` | API FastAPI, lógica de negocio, auth |
| `frontend-agent` | UI React, componentes, integración API |
| `database-agent` | Esquema PostgreSQL, migraciones, queries |
| `devops-agent` | Docker, CI/CD, infraestructura |
| `qa-agent` | Testing, revisión de código, QA |

### Crear los agentes en Claude Code

```bash
# Desde la raíz del proyecto
claude agent create --from .claude/agents/jira-agent.md
claude agent create --from .claude/agents/backend-agent.md
claude agent create --from .claude/agents/frontend-agent.md
claude agent create --from .claude/agents/database-agent.md
claude agent create --from .claude/agents/devops-agent.md
claude agent create --from .claude/agents/qa-agent.md
```

### Usar un agente

```bash
# Pedir al jira-agent que cree tickets
claude --agent jira-agent "Crea las épicas para el sprint 1"

# Pedir al backend-agent que implemente un endpoint
claude --agent backend-agent "Implementa el CRUD completo de estudiantes"

# Pedir al frontend-agent que complete una página
claude --agent frontend-agent "Completa la página StudentsPage con tabla y formulario"
```

---

## 📁 Estructura del Proyecto

```
proyecto_ele5/
├── .claude/
│   └── agents/              # Definición de los 6 agentes IA
│       ├── jira-agent.md
│       ├── backend-agent.md
│       ├── frontend-agent.md
│       ├── database-agent.md
│       ├── devops-agent.md
│       └── qa-agent.md
├── backend/                  # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── core/            # Configuración, DB, seguridad
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── routers/         # Endpoints API
│   │   └── schemas/         # Schemas Pydantic
│   ├── alembic/             # Migraciones
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Estado global (Auth)
│   │   ├── pages/           # Páginas de la app
│   │   └── services/        # Servicios API (Axios)
│   ├── package.json
│   └── Dockerfile
├── database/
│   └── init.sql             # Schema + datos semilla
├── docs/                    # Documentación adicional
├── docker-compose.yml       # Orquestación producción
├── docker-compose.dev.yml   # Overrides desarrollo (hot-reload)
├── .env.example             # Variables de entorno template
├── CLAUDE.md                # Guía para agentes IA
└── ARCHITECTURE.md          # Arquitectura detallada del sistema
```

---

## 🔧 Comandos Útiles

```bash
# Desarrollo con hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Ver logs en tiempo real
docker-compose logs -f backend
docker-compose logs -f frontend

# Aplicar migraciones de DB
docker exec unimayor_backend alembic upgrade head

# Acceder a la DB
docker exec -it unimayor_db psql -U unimayor_user -d unimayor_asistencia

# Ejecutar tests del backend
docker exec unimayor_backend pytest tests/ -v

# Reconstruir imágenes
docker-compose build --no-cache

# Detener todo (sin borrar datos)
docker-compose down

# Detener y borrar volúmenes (¡borra la BD!)
docker-compose down -v
```

---

## 📋 Flujo de Trabajo Jira

1. `jira-agent` crea ticket en proyecto **ELE5**
2. `backend-agent` implementa el endpoint/lógica
3. `database-agent` crea migración si se modifica el esquema
4. `frontend-agent` implementa la UI que consume el endpoint
5. `qa-agent` revisa y escribe tests
6. `devops-agent` verifica que Docker compile correctamente
7. `jira-agent` mueve el ticket a **Done**

---

## 🏛️ Institución

**Colegio Mayor del Cauca — Unimayor**
Popayán, Cauca, Colombia
Sitio web: https://www.unimayor.edu.co

---

*Proyecto académico — Electiva 5 · 2024*
