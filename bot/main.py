import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from dotenv import load_dotenv

from handlers import start
from handlers.notifications import setup_scheduler
from services.api_client import api

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()

    dp.include_router(start.router)

    scheduler = setup_scheduler(bot)
    scheduler.start()

    logger.info("Planify Bot started")
    try:
        await dp.start_polling(bot, drop_pending_updates=True)
    finally:
        scheduler.shutdown()
        await api.close()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
