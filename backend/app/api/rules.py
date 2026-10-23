import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.device import Device
from app.models.rule import BlockingRule
from app.schemas.rule import RuleCreate, RuleUpdate, RuleOut
from app.services.auth import get_current_user, get_user_family_id

router = APIRouter(prefix="/rules", tags=["rules"])


@router.post("", response_model=RuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule(
    req: RuleCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    rule = BlockingRule(family_id=family_id, **req.model_dump())
    db.add(rule)
    await db.flush()
    return rule


@router.get("", response_model=list[RuleOut])
async def list_rules(
    device_id: uuid.UUID | None = None,
    child_profile_id: uuid.UUID | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    q = select(BlockingRule).where(BlockingRule.family_id == family_id)
    if device_id:
        q = q.where(BlockingRule.device_id == device_id)
    if child_profile_id:
        q = q.where(BlockingRule.child_profile_id == child_profile_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.put("/{rule_id}", response_model=RuleOut)
async def update_rule(
    rule_id: uuid.UUID,
    req: RuleUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(BlockingRule).where(BlockingRule.id == rule_id, BlockingRule.family_id == family_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    await db.flush()
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(BlockingRule).where(BlockingRule.id == rule_id, BlockingRule.family_id == family_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    await db.delete(rule)


@router.get("/sync/{device_id}", response_model=list[RuleOut])
async def sync_rules(
    device_id: uuid.UUID,
    x_device_token: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.device_token == x_device_token)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid device token")

    q = select(BlockingRule).where(
        BlockingRule.family_id == device.family_id,
        BlockingRule.enabled == True,
    ).where(
        (BlockingRule.device_id == device_id) | (BlockingRule.device_id.is_(None))
    )
    if device.child_profile_id:
        q = q.where(
            (BlockingRule.child_profile_id == device.child_profile_id)
            | (BlockingRule.child_profile_id.is_(None))
        )
    result = await db.execute(q)
    return result.scalars().all()
