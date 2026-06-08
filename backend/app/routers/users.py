from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.student import Student
from app.routers.auth import get_current_user
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Usuarios"])

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo administradores pueden realizar esta acción")
    return current_user

# ── Schemas locales ────────────────────────────────────────────────────────
class UserCreateFull(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str
    role: UserRole = UserRole.ESTUDIANTE
    # Campos extra si es estudiante
    student_code: Optional[str] = None
    program: Optional[str] = None
    semester: Optional[int] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None

# ── Endpoints existentes ───────────────────────────────────────────────────
@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista usuarios. Docente solo ve estudiantes. Admin ve todos."""
    if current_user.role == UserRole.DOCENTE:
        return (
            db.query(User)
            .filter(User.is_active == True, User.role == UserRole.ESTUDIANTE)
            .order_by(User.full_name)
            .all()
        )
    if current_user.role == UserRole.ADMIN:
        return (
            db.query(User)
            .filter(User.is_active == True)
            .order_by(User.role, User.full_name)
            .all()
        )
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")

@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Elimina un usuario permanentemente. Solo admin."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()

# ── Endpoints nuevos ───────────────────────────────────────────────────────
@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    data: UserCreateFull,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Crea un nuevo usuario. Solo admin."""
    existing = db.query(User).filter(
        (User.email == data.email) | (User.username == data.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email o username ya existe")

    new_user = User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        role=data.role,
        hashed_password=get_password_hash(data.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Si es estudiante, crear perfil en tabla students
    if data.role == UserRole.ESTUDIANTE:
        if not data.student_code or not data.program or not data.semester:
            raise HTTPException(status_code=400, detail="Estudiantes requieren student_code, program y semester")
        existing_code = db.query(Student).filter(Student.student_code == data.student_code).first()
        if existing_code:
            raise HTTPException(status_code=400, detail="El código de estudiante ya existe")
        student = Student(
            user_id=new_user.id,
            student_code=data.student_code,
            program=data.program,
            semester=data.semester,
        )
        db.add(student)
        db.commit()

    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Edita un usuario. Solo admin."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.email is not None:
        user.email = data.email
    if data.role is not None:
        user.role = data.role
    if data.password is not None:
        user.hashed_password = get_password_hash(data.password)
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/toggle", response_model=UserResponse)
def toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Activa o desactiva un usuario. Solo admin."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user