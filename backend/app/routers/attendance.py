from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import random, string
from datetime import datetime
from app.core.database import get_db
from app.models.attendance import AttendanceSession, Attendance, AttendanceStatus
from app.models.student import Student
from app.models.user import User, UserRole
from app.models.course import Course
from app.schemas.attendance import (
    AttendanceSessionCreate, AttendanceSessionResponse,
    AttendanceCreate, AttendanceResponse, AttendanceMarkByCode
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/attendance", tags=["Asistencia"])


def generate_session_code(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


# ── Endpoints originales (ahora con autenticación) ─────────────────────────

@router.post("/sessions", response_model=AttendanceSessionResponse, status_code=201)
def create_session(
    data: AttendanceSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Docente/admin crea una sesión de clase."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCENTE]:
        raise HTTPException(status_code=403, detail="Sin permisos para crear sesiones")

    code = generate_session_code()
    while db.query(AttendanceSession).filter(AttendanceSession.session_code == code).first():
        code = generate_session_code()

    session = AttendanceSession(
        course_id=data.course_id,
        topic=data.topic,
        date=data.date or datetime.utcnow(),
        session_code=code
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=List[AttendanceSessionResponse])
def list_sessions(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista sesiones de un curso."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCENTE]:
        raise HTTPException(status_code=403, detail="Sin permisos")
    return (
        db.query(AttendanceSession)
        .filter(AttendanceSession.course_id == course_id)
        .order_by(AttendanceSession.date.desc())
        .all()
    )


@router.post("/mark", status_code=200)
def mark_attendance(
    data: AttendanceMarkByCode,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estudiante marca asistencia usando el código de sesión."""
    if current_user.role != UserRole.ESTUDIANTE:
        raise HTTPException(status_code=403, detail="Solo estudiantes pueden marcar asistencia con código")

    session = db.query(AttendanceSession).filter(
        AttendanceSession.session_code == data.session_code,
        AttendanceSession.is_open == True
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada o cerrada")

    student = db.query(Student).filter(Student.student_code == data.student_code).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    if student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes marcar asistencia por otro estudiante")

    existing = db.query(Attendance).filter(
        Attendance.session_id == session.id,
        Attendance.student_id == student.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya registraste tu asistencia en esta sesión")

    record = Attendance(session_id=session.id, student_id=student.id, status=AttendanceStatus.PRESENTE)
    db.add(record)
    db.commit()
    return {"message": "Asistencia registrada correctamente", "status": "presente"}


@router.get("/sessions/{session_id}/records", response_model=List[AttendanceResponse])
def get_session_records(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ver registros de asistencia de una sesión. Solo docente/admin."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCENTE]:
        raise HTTPException(status_code=403, detail="Sin permisos")
    return db.query(Attendance).filter(Attendance.session_id == session_id).all()


@router.patch("/sessions/{session_id}/close")
def close_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cerrar sesión de asistencia. Solo docente/admin."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCENTE]:
        raise HTTPException(status_code=403, detail="Sin permisos")
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    session.is_open = False
    session.closed_at = datetime.utcnow()
    db.commit()
    return {"message": "Sesión cerrada correctamente"}


# ── Electiva 5 ─────────────────────────────────────────────────────────────

class MarkStudentRequest(BaseModel):
    student_id: int
    status: str


def _get_open_electiva5_session(db: Session) -> tuple[Course, AttendanceSession]:
    """Devuelve el curso Electiva 5 y la sesión abierta más reciente. NO crea sesión automáticamente."""
    course = db.query(Course).filter(Course.code == "ELE5-2026").first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso Electiva 5 no encontrado en la BD")

    session = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.course_id == course.id, AttendanceSession.is_open == True)
        .order_by(AttendanceSession.created_at.desc())
        .first()
    )
    return course, session


@router.post("/electiva5/session", response_model=AttendanceSessionResponse, status_code=201)
def create_electiva5_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Docente/admin crea manualmente una sesión de Electiva 5."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCENTE]:
        raise HTTPException(status_code=403, detail="Sin permisos")

    course = db.query(Course).filter(Course.code == "ELE5-2026").first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso Electiva 5 no encontrado")

    # Cerrar sesiones abiertas anteriores
    open_sessions = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.course_id == course.id, AttendanceSession.is_open == True)
        .all()
    )
    for s in open_sessions:
        s.is_open = False
        s.closed_at = datetime.utcnow()

    code = generate_session_code()
    while db.query(AttendanceSession).filter(AttendanceSession.session_code == code).first():
        code = generate_session_code()

    session = AttendanceSession(
        course_id=course.id,
        topic="Electiva 5 - Asistencia",
        date=datetime.utcnow(),
        session_code=code,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/electiva5")
def get_electiva5(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Vista de asistencia Electiva 5 según rol."""

    if current_user.role in [UserRole.ADMIN, UserRole.DOCENTE]:
        course, session = _get_open_electiva5_session(db)

        students = (
            db.query(Student)
            .join(User, Student.user_id == User.id)
            .filter(User.is_active == True)
            .all()
        )
        student_list = []
        for s in students:
            u = db.query(User).filter(User.id == s.user_id).first()
            att = None
            if session:
                att = db.query(Attendance).filter(
                    Attendance.session_id == session.id,
                    Attendance.student_id == s.id,
                ).first()
            student_list.append({
                "student_id": s.id,
                "user_id": s.user_id,
                "name": u.full_name if u else "Desconocido",
                "student_code": s.student_code,
                "status": att.status.value if att else None,
                "attendance_id": att.id if att else None,
            })

        return {
            "course": {"id": course.id, "name": course.name, "code": course.code},
            "session": {
                "id": session.id,
                "session_code": session.session_code,
                "date": session.date.isoformat(),
                "is_open": session.is_open,
            } if session else None,
            "students": student_list,
        }

    # Estudiante
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="No tienes perfil de estudiante registrado")

    course = db.query(Course).filter(Course.code == "ELE5-2026").first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso Electiva 5 no encontrado")

    sessions = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.course_id == course.id)
        .order_by(AttendanceSession.date.desc())
        .all()
    )
    records = []
    for s in sessions:
        att = db.query(Attendance).filter(
            Attendance.session_id == s.id,
            Attendance.student_id == student.id,
        ).first()
        records.append({
            "session_id": s.id,
            "date": s.date.isoformat(),
            "status": att.status.value if att else "ausente",
            "is_open": s.is_open,
        })

    total = len(records)
    present = sum(1 for r in records if r["status"] == "presente")
    return {
        "course": {"id": course.id, "name": course.name},
        "student_name": current_user.full_name,
        "sessions": records,
        "summary": {
            "total": total,
            "presente": present,
            "ausente": total - present,
            "percentage": round(present / total * 100) if total > 0 else 0,
        },
    }


@router.post("/electiva5/mark")
def mark_electiva5(
    body: MarkStudentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Docente/admin marca asistencia de un estudiante en Electiva 5."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCENTE]:
        raise HTTPException(status_code=403, detail="Sin permisos para marcar asistencia")

    try:
        att_status = AttendanceStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Estado inválido. Use: presente, ausente")

    _, session = _get_open_electiva5_session(db)
    if not session:
        raise HTTPException(status_code=404, detail="No hay sesión abierta. Crea una sesión primero.")

    record = db.query(Attendance).filter(
        Attendance.session_id == session.id,
        Attendance.student_id == body.student_id,
    ).first()

    if record:
        record.status = att_status
    else:
        record = Attendance(
            session_id=session.id,
            student_id=body.student_id,
            status=att_status,
        )
        db.add(record)

    db.commit()
    return {"message": "Asistencia actualizada", "status": body.status}