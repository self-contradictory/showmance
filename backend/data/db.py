from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine

from data.tables import Base


async def connect(url: str) -> AsyncEngine:
    engine = create_async_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return engine


class Repository:
    def __init__(self, engine: AsyncEngine) -> None:
        self._session = async_sessionmaker(engine, expire_on_commit=False)
