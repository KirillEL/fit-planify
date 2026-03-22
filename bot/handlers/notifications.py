from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.api_client import api
import os

TRAINER_TELEGRAM_IDS: list[int] = []  # Загружать из БД при необходимости


async def notify_unpaid(bot: Bot, trainer_telegram_id: int):
    payments = await api.get_unpaid_payments(trainer_telegram_id)
    if not payments:
        return

    lines = [f"💳 <b>Неоплаченные клиенты:</b>\n"]
    for p in payments:
        lines.append(f"• Клиент #{p['client_id']} — {p['amount']} ₽")

    await bot.send_message(
        chat_id=trainer_telegram_id,
        text="\n".join(lines),
        parse_mode="HTML",
    )


def setup_scheduler(bot: Bot) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="Asia/Novosibirsk")

    # Каждый понедельник в 10:00 — напоминание об оплатах
    scheduler.add_job(
        notify_unpaid,
        trigger="cron",
        day_of_week="mon",
        hour=10,
        minute=0,
        kwargs={"bot": bot, "trainer_telegram_id": 0},  # замени на реальный ID
    )

    return scheduler
