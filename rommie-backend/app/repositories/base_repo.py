from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get(self, entity_id: UUID) -> ModelT | None:
        return await self.session.get(self.model, entity_id)

    async def list_all(self, limit: int = 100, offset: int = 0) -> list[ModelT]:
        result = await self.session.execute(
            select(self.model).limit(limit).offset(offset)
        )
        return list(result.unique().scalars().all())

    async def add(self, entity: ModelT, *, commit: bool = True) -> ModelT:
        self.session.add(entity)
        if commit:
            await self.session.commit()
            await self.session.refresh(entity)
        else:
            await self.session.flush()
        return entity

    async def update(self, entity: ModelT, data: dict[str, Any]) -> ModelT:
        for field, value in data.items():
            setattr(entity, field, value)
        await self.session.commit()
        await self.session.refresh(entity)
        return entity

    async def remove(self, entity: ModelT) -> None:
        await self.session.delete(entity)
        await self.session.commit()

    async def remove_by_id(self, entity_id: UUID) -> None:
        await self.session.execute(
            delete(self.model).where(self.model.id == entity_id)
        )
        await self.session.commit()
