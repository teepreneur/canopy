from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.family import Family, FamilyMember, FamilyRole
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserOut
from app.schemas.family import FamilyCreate, FamilyOut, ChildProfileCreate, ChildProfileOut
from app.models.child import ChildProfile
from app.services.auth import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user, get_user_family_id,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(email=req.email, hashed_password=hash_password(req.password), full_name=req.full_name)
    db.add(user)
    await db.flush()
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    user_id = decode_token(req.refresh_token, expected_type="refresh")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user


@router.post("/family", response_model=FamilyOut, status_code=status.HTTP_201_CREATED)
async def create_family(
    req: FamilyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family = Family(name=req.name)
    db.add(family)
    await db.flush()
    member = FamilyMember(family_id=family.id, user_id=user.id, role=FamilyRole.owner)
    db.add(member)
    await db.flush()
    return family


@router.get("/family", response_model=FamilyOut)
async def get_family(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(select(Family).where(Family.id == family_id))
    return result.scalar_one()


@router.post("/family/children", response_model=ChildProfileOut, status_code=status.HTTP_201_CREATED)
async def create_child(
    req: ChildProfileCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    child = ChildProfile(family_id=family_id, name=req.name, age=req.age, avatar_url=req.avatar_url)
    db.add(child)
    await db.flush()
    return child


@router.get("/family/children", response_model=list[ChildProfileOut])
async def list_children(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(select(ChildProfile).where(ChildProfile.family_id == family_id))
    return result.scalars().all()
