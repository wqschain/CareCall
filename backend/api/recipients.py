from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from models.models import Recipient, User
from schemas.schemas import RecipientCreate, RecipientUpdate, Recipient as RecipientSchema, RecipientWithCheckIns
from .email_auth import get_current_user, get_db

router = APIRouter()

@router.get("/recipients", response_model=List[RecipientSchema])
async def get_recipients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all recipients for the current user"""
    query = select(Recipient).where(Recipient.caregiver_id == current_user.id)
    result = await db.execute(query)
    recipients = result.scalars().all()
    return recipients

@router.get("/recipients/{recipient_id}", response_model=RecipientWithCheckIns)
async def get_recipient(
    recipient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific recipient with their check-ins"""
    query = select(Recipient).where(
        Recipient.id == recipient_id,
        Recipient.caregiver_id == current_user.id
    )
    result = await db.execute(query)
    recipient = result.scalar_one_or_none()
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    return recipient

@router.post("/recipients", response_model=RecipientSchema, status_code=status.HTTP_201_CREATED)
async def create_recipient(
    recipient: RecipientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new recipient"""
    db_recipient = Recipient(**recipient.dict(), caregiver_id=current_user.id)
    db.add(db_recipient)
    await db.commit()
    await db.refresh(db_recipient)
    return db_recipient

@router.put("/recipients/{recipient_id}", response_model=RecipientSchema)
async def update_recipient(
    recipient_id: int,
    recipient_update: RecipientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a recipient"""
    query = select(Recipient).where(
        Recipient.id == recipient_id,
        Recipient.caregiver_id == current_user.id
    )
    result = await db.execute(query)
    db_recipient = result.scalar_one_or_none()
    
    if not db_recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    update_data = recipient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_recipient, field, value)
    
    await db.commit()
    await db.refresh(db_recipient)
    return db_recipient

@router.delete("/recipients/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipient(
    recipient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a recipient"""
    query = select(Recipient).where(
        Recipient.id == recipient_id,
        Recipient.caregiver_id == current_user.id
    )
    result = await db.execute(query)
    recipient = result.scalar_one_or_none()
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    await db.delete(recipient)
    await db.commit()

@router.post("/recipients/{recipient_id}/call-now")
async def trigger_call(
    recipient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trigger an immediate check-in call for a recipient"""
    # Import here to avoid circular imports
    from services.call_pipeline import trigger_checkin
    
    query = select(Recipient).where(
        Recipient.id == recipient_id,
        Recipient.caregiver_id == current_user.id
    )
    result = await db.execute(query)
    recipient = result.scalar_one_or_none()
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    try:
        check_in = await trigger_checkin(recipient_id)
        return {"status": "success", "check_in_id": check_in.id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) 