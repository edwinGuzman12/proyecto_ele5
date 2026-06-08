from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.course import Course
from app.models.attendance import AttendanceSession, Attendance, AttendanceStatus
from app.routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estadísticas del dashboard según rol."""

    # ── Estudiante: solo su propio resumen ────────────────────────────────
    if current_user.role == UserRole.ESTUDIANTE:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            return {
                "role": "estudiante",
                "total_sessions": 0,
                "presente": 0,
                "ausente": 0,
                "percentage": 0,
            }

        records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        total = len(records)
        present = sum(1 for r in records if r.status == AttendanceStatus.PRESENTE)
        return {
            "role": "estudiante",
            "total_sessions": total,
            "presente": present,
            "ausente": total - present,
            "percentage": round(present / total * 100) if total > 0 else 0,
        }

    # ── Docente: stats de sus cursos ──────────────────────────────────────
    if current_user.role == UserRole.DOCENTE:
        courses = db.query(Course).filter(
            Course.teacher_id == current_user.id,
            Course.is_active == True
        ).all()
        course_ids = [c.id for c in courses]

        total_sessions = db.query(AttendanceSession).filter(
            AttendanceSession.course_id.in_(course_ids)
        ).count() if course_ids else 0

        session_ids = [
            s.id for s in db.query(AttendanceSession).filter(
                AttendanceSession.course_id.in_(course_ids)
            ).all()
        ] if course_ids else []

        total_records = db.query(Attendance).filter(
            Attendance.session_id.in_(session_ids)
        ).count() if session_ids else 0

        present_records = db.query(Attendance).filter(
            Attendance.session_id.in_(session_ids),
            Attendance.status == AttendanceStatus.PRESENTE
        ).count() if session_ids else 0

        total_students = sum(len(c.students) for c in courses)

        return {
            "role": "docente",
            "total_courses": len(courses),
            "total_sessions": total_sessions,
            "total_students": total_students,
            "attendance_percentage": round(present_records / total_records * 100) if total_records > 0 else 0,
            "total_records": total_records,
            "present_records": present_records,
        }

    # ── Admin: stats globales ─────────────────────────────────────────────
    total_students = db.query(User).filter(
        User.role == UserRole.ESTUDIANTE, User.is_active == True
    ).count()

    total_docentes = db.query(User).filter(
        User.role == UserRole.DOCENTE, User.is_active == True
    ).count()

    total_sessions = db.query(AttendanceSession).count()
    total_records = db.query(Attendance).count()

    present_records = db.query(Attendance).filter(
        Attendance.status == AttendanceStatus.PRESENTE
    ).count()

    return {
        "role": "admin",
        "total_students": total_students,
        "total_docentes": total_docentes,
        "total_sessions": total_sessions,
        "attendance_percentage": round(present_records / total_records * 100) if total_records > 0 else 0,
        "total_records": total_records,
        "present_records": present_records,
    }