import asyncio
import logging
from collections.abc import Awaitable, Mapping

logger = logging.getLogger(__name__)


async def settle[K, T](calls: Mapping[K, Awaitable[T]]) -> dict[K, T]:
    results = await asyncio.gather(*calls.values(), return_exceptions=True)
    settled: dict[K, T] = {}
    for key, result in zip(calls, results, strict=True):
        if isinstance(result, BaseException):
            logger.error("call for agent %s failed", key, exc_info=result)
        else:
            settled[key] = result
    return settled
