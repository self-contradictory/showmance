from sqlalchemy import Connection, inspect, text
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine

from data.tables import Base


async def connect(url: str) -> AsyncEngine:
    engine = create_async_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_add_new_columns)
    return engine


def _add_new_columns(conn: Connection) -> None:
    inspector = inspect(conn)
    quote = conn.dialect.identifier_preparer
    for table in Base.metadata.sorted_tables:
        present = {column["name"] for column in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in present or not column.nullable:
                continue
            kind = column.type.compile(dialect=conn.dialect)
            conn.execute(
                text(
                    f"ALTER TABLE {quote.format_table(table)} "
                    f"ADD COLUMN {quote.format_column(column)} {kind}"
                )
            )


class Repository:
    def __init__(self, engine: AsyncEngine) -> None:
        self._session = async_sessionmaker(engine, expire_on_commit=False)
