"""
数据库管理
"""
import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from backend.models import Base


class Database:
    def __init__(self, db_url: str = "sqlite+aiosqlite:///wasteland.db"):
        self.engine = create_async_engine(
            db_url,
            echo=False,
            poolclass=NullPool,  # SQLite 不需要连接池
        )
        self.session_maker = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    async def init_db(self):
        """初始化数据库表"""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def close(self):
        """关闭连接"""
        await self.engine.dispose()

    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """获取数据库会话"""
        async with self.session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()


# 全局数据库实例
db = Database()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 依赖注入"""
    async with db.session() as session:
        yield session
