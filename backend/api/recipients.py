from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import logging

from models.models import Recipient, User
from schemas.schemas import RecipientCreate, RecipientUpdate, Recipient as RecipientSchema, RecipientWithCheckIns
from .email_auth import get_current_user, get_db

router = APIRouter()

@router.get("/", response_model=List[RecipientWithCheckIns])
async def get_recipients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all recipients for the current user"""
    query = (
        select(Recipient)
        .options(selectinload(Recipient.check_ins))
        .where(Recipient.user_id == current_user.id)
    )
    result = await db.execute(query)
    recipients = result.scalars().all()

    # Sort check_ins for each recipient by created_at DESC
    for recipient in recipients:
        if hasattr(recipient, 'check_ins') and recipient.check_ins:
            recipient.check_ins.sort(key=lambda c: c.created_at or 0, reverse=True)
    return recipients

@router.get("/{recipient_id}", response_model=RecipientWithCheckIns)
async def get_recipient(
    recipient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific recipient with their check-ins"""
    query = (
        select(Recipient)
        .options(selectinload(Recipient.check_ins))
        .where(
            Recipient.id == recipient_id,
            Recipient.user_id == current_user.id
        )
    )
    result = await db.execute(query)
    recipient = result.scalar_one_or_none()
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    return recipient

@router.post("/", response_model=RecipientSchema, status_code=status.HTTP_201_CREATED)
async def create_recipient(
    recipient: RecipientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new recipient"""
    db_recipient = Recipient(**recipient.dict(), user_id=current_user.id)
    db.add(db_recipient)
    await db.commit()
    await db.refresh(db_recipient)
    return db_recipient

@router.put("/{recipient_id}", response_model=RecipientSchema)
async def update_recipient(
    recipient_id: int,
    recipient_update: RecipientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a recipient"""
    logger = logging.getLogger("carecall")
    
    logger.info(f"Updating recipient {recipient_id} for user {current_user.id}")
    logger.debug(f"Update data: {recipient_update.dict(exclude_unset=True)}")
    
    query = select(Recipient).where(
        Recipient.id == recipient_id,
        Recipient.user_id == current_user.id
    )
    result = await db.execute(query)
    db_recipient = result.scalar_one_or_none()
    
    if not db_recipient:
        logger.warning(f"Recipient {recipient_id} not found for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    update_data = recipient_update.dict(exclude_unset=True)
    logger.debug(f"Fields to update: {list(update_data.keys())}")
    
    for field, value in update_data.items():
        old_value = getattr(db_recipient, field)
        setattr(db_recipient, field, value)
        logger.debug(f"Updated {field}: {old_value} -> {value}")
    
    try:
        await db.commit()
        await db.refresh(db_recipient)
        logger.info(f"Successfully updated recipient {recipient_id}")
        return db_recipient
    except Exception as e:
        logger.error(f"Failed to update recipient {recipient_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update recipient: {str(e)}"
        )

@router.delete("/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipient(
    recipient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a recipient"""
    query = select(Recipient).where(
        Recipient.id == recipient_id,
        Recipient.user_id == current_user.id
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

@router.post("/{recipient_id}/call-now")
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
        Recipient.user_id == current_user.id
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