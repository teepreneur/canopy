import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.device import Device
from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertOut, AlertAction
from app.services.auth import get_current_user, get_user_family_id
from app.ws.manager import manager

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/submit/{device_id}", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
async def submit_alert(
    device_id: uuid.UUID,
    req: AlertCreate,
    x_device_token: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.device_token == x_device_token)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid device token")

    alert = Alert(
        family_id=device.family_id,
        device_id=device_id,
        child_profile_id=device.child_profile_id,
        alert_type=req.alert_type,
        title=req.title,
        detail=req.detail,
        target=req.target,
    )
    db.add(alert)
    await db.flush()

    await manager.send_to_family(str(device.family_id), {
        "type": "new_alert",
        "alert_id": str(alert.id),
        "alert_type": alert.alert_type.value,
        "title": alert.title,
        "device_id": str(device_id),
    })
    return alert


@router.get("", response_model=list[AlertOut])
async def list_alerts(
    acknowledged: bool | None = None,
    limit: int = Query(50, le=500),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    q = select(Alert).where(Alert.family_id == family_id)
    if acknowledged is not None:
        q = q.where(Alert.acknowledged == acknowledged)
    q = q.order_by(Alert.created_at.desc()).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.put("/{alert_id}", response_model=AlertOut)
async def update_alert(
    alert_id: uuid.UUID,
    req: AlertAction,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family_id = await get_user_family_id(user, db)
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.family_id == family_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert.status = req.status
    alert.acknowledged = True
    await db.flush()

    if alert.alert_type.value == "access_request":
        await manager.send_to_device(str(alert.device_id), {
            "type": "access_request_response",
            "alert_id": str(alert.id),
            "status": req.status.value,
            "target": alert.target,
        })
    return alert
