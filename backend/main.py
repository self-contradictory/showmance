import uvicorn

from config import settings


def main() -> None:
    uvicorn.run(
        "api.app:app",
        host=settings.host,
        port=settings.port,
        timeout_graceful_shutdown=settings.shutdown_timeout,
    )


if __name__ == "__main__":
    main()
