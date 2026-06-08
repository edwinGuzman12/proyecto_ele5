from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.student import Student, enrollment
from app.routers.auth import get_current_user

router = APIRouter(prefix="/courses", tags=["Cursos"])


def require_admin_or_docente(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCENTE]:
        raise HTTPException(status_code=403, detail="Sin permisos")
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")
    return current_user


# ── Schemas locales ────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    name: str
    code: str
    program: str
    semester: int
    teacher_id: int

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    program: Optional[str] = None
    semester: Optional[int] = None
    teacher_id: Optional[int] = None
    is_active: Optional[bool] = None

class CourseResponse(BaseModel):
    id: int
    name: str
    code: str
    program: str
    semester: int
    teacher_id: int
    is_active: bool
    teacher_name: Optional[str] = None
    student_count: Optional[int] = None

    class Config:
        from_attributes = True

class EnrollRequest(BaseModel):
    student_id: int


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.get("", response_model=List[CourseResponse])
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista cursos. Docente ve solo los suyos. Admin ve todos."""
    if current_user.role == UserRole.DOCENTE:
        courses = db.query(Course).filter(
            Course.teacher_id == current_user.id,
            Course.is_active == True
        ).all()
    elif current_user.role == UserRole.ADMIN:
        courses = db.query(Course).order_by(Course.name).all()
    else:
        raise HTTPException(status_code=403, detail="Sin permisos")

    result = []
    for c in courses:
        teacher = db.query(User).filter(User.id == c.teacher_id).first()
        result.append(CourseResponse(
            id=c.id,
            name=c.name,
            code=c.code,
            program=c.program,
            semester=c.semester,
            teacher_id=c.teacher_id,
            is_active=c.is_active,
            teacher_name=teacher.full_name if teacher else None,
            student_count=len(c.students),
        ))
    return result


@router.post("", response_model=CourseResponse, status_code=201)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Crea un curso. Solo admin."""
    existing = db.query(Course).filter(Course.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un curso con ese código")

    teacher = db.query(User).filter(User.id == data.teacher_id).first()
    if not teacher or teacher.role not in [UserRole.DOCENTE, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Docente no válido")

    course = Course(
        name=data.name,
        code=data.code,
        program=data.program,
        semester=data.semester,
        teacher_id=data.teacher_id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseResponse(
        id=course.id,
        name=course.name,
        code=course.code,
        program=course.program,
        semester=course.semester,
        teacher_id=course.teacher_id,
        is_active=course.is_active,
        teacher_name=teacher.full_name,
        student_count=0,
    )


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Edita un curso. Solo admin."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    if data.name is not None:
        course.name = data.name
    if data.program is not None:
        course.program = data.program
    if data.semester is not None:
        course.semester = data.semester
    if data.teacher_id is not None:
        course.teacher_id = data.teacher_id
    if data.is_active is not None:
        course.is_active = data.is_active

    db.commit()
    db.refresh(course)
    teacher = db.query(User).filter(User.id == course.teacher_id).first()
    return CourseResponse(
        id=course.id,
        name=course.name,
        code=course.code,
        program=course.program,
        semester=course.semester,
        teacher_id=course.teacher_id,
        is_active=course.is_active,
        teacher_name=teacher.full_name if teacher else None,
        student_count=len(course.students),
    )


@router.post("/{course_id}/enroll")
def enroll_student(
    course_id: int,
    body: EnrollRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Matricula un estudiante en un curso. Solo admin."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    student = db.query(Student).filter(Student.id == body.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    if student in course.students:
        raise HTTPException(status_code=400, detail="El estudiante ya está matriculado")

    course.students.append(student)
    db.commit()
    return {"message": "Estudiante matriculado correctamente"}


@router.delete("/{course_id}/enroll/{student_id}")
def unenroll_student(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Desmatricula un estudiante de un curso. Solo admin."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    if student not in course.students:
        raise HTTPException(status_code=400, detail="El estudiante no está matriculado")

    course.students.remove(student)
    db.commit()
    return {"message": "Estudiante desmatriculado correctamente"}


@router.get("/{course_id}/students")
def get_course_students(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    """Lista estudiantes de un curso."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    result = []
    for s in course.students:
        u = db.query(User).filter(User.id == s.user_id).first()
        result.append({
            "student_id": s.id,
            "user_id": s.user_id,
            "full_name": u.full_name if u else "Desconocido",
            "username": u.username if u else "",
            "email": u.email if u else "",
            "student_code": s.student_code,
            "program": s.program,
            "semester": s.semester,
        })
    return result