import uuid
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.device import Device
from app.models.activity import ActivityLog, ActivityType
from app.schemas.activity import ActivityBatchSubmit, ActivityLogOut, DailySummary
from app.services.auth import get_current_user, get_user_family_id

router = APIRouter(prefix="/activity", tags=["activity"])


@router.post("/submit/{device_id}", status_code=status.HTTP_201_CREATED)
async def submit_activity(
    device_id: uuid.UUID,
    req: ActivityBatchSubmit,
    x_device_token: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.device_token == x_device_token)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid device token")

    logs = []
    for entry in req.entries:
        log = ActivityLog(
            device_id=device_id,
            child_profile_id=device.child_profile_id,
            activity_type=entry.activity_type,
            target=entry.target,
            title=entry.title,
            duration_seconds=entry.duration_seconds,
            timestamp=entry.timestamp,
        )
        db.add(log)
        logs.append(log)
    await db.flush()
    return {"count": len(logs)}


@router.get("/logs", response_model=list[ActivityLogOut])
async def get_activity_logs(
    device_id: uuid.UUID | None = None,
    child_profile_id: uuid.UUID | None = None,
    activity_type: ActivityType | None = None,
    limit: int = Query(100, le=1000),
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    family_devices = await db.execute(
        select(Device.id).where(Device.family_id == family_id)
    )
    device_ids = [r[0] for r in family_devices.all()]
    if not device_ids:
        return []

    q = select(ActivityLog).where(ActivityLog.device_id.in_(device_ids))
    if device_id:
        q = q.where(ActivityLog.device_id == device_id)
    if child_profile_id:
        q = q.where(ActivityLog.child_profile_id == child_profile_id)
    if activity_type:
        q = q.where(ActivityLog.activity_type == activity_type)
    q = q.order_by(ActivityLog.timestamp.desc()).offset(offset).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/summary/{device_id}", response_model=DailySummary)
async def daily_summary(
    device_id: uuid.UUID,
    day: date = Query(default_factory=lambda: date.today()),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.family_id == family_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
    day_end = day_start.replace(hour=23, minute=59, second=59)

    logs_q = select(ActivityLog).where(
        ActivityLog.device_id == device_id,
        ActivityLog.timestamp >= day_start,
        ActivityLog.timestamp <= day_end,
    )
    result = await db.execute(logs_q)
    logs = result.scalars().all()

    total_time = sum(l.duration_seconds for l in logs)
    sites: dict[str, int] = {}
    apps: dict[str, int] = {}
    for l in logs:
        bucket = sites if l.activity_type == ActivityType.site_visit else apps
        bucket[l.target] = bucket.get(l.target, 0) + l.duration_seconds

    top_sites = sorted(
        [{"target": k, "duration_seconds": v} for k, v in sites.items()],
        key=lambda x: x["duration_seconds"], reverse=True,
    )[:10]
    top_apps = sorted(
        [{"target": k, "duration_seconds": v} for k, v in apps.items()],
        key=lambda x: x["duration_seconds"], reverse=True,
    )[:10]

    return DailySummary(
        date=day.isoformat(),
        total_screen_time_seconds=total_time,
        top_sites=top_sites,
        top_apps=top_apps,
    )
