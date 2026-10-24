from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


class PushTokenRegister(BaseModel):
    push_token: str
    platform: str


@router.post("/register")
async def register_push_token(
    req: PushTokenRegister,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.push_token = req.push_token
    await db.flush()
    return {"status": "registered"}
