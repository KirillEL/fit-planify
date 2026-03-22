import logging
import os

from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.api_client import api

logger = logging.getLogger(__name__)


async def send_payment_reminders(bot: Bot):
    try:
        data = await api.get_payment_reminders()
    except Exception as e:
        logger.error(f"Failed to fetch payment reminders: {e}")
        return

    # Notify trainers
    for trainer in data.get("trainers", []):
        tg_id = trainer["trainer_telegram_id"]
        lines = ["💳 <b>Напоминание об оплатах</b>\n"]
        total = 0
        for c in trainer["unpaid_clients"]:
            note = f" ({c['note']})" if c.get("note") else ""
            lines.append(f"• {c['client_name']} — {c['amount']:.0f} ₽{note}")
            total += c["amount"]
        lines.append(f"\n<b>Итого: {total:.0f} ₽</b>")
        try:
            await bot.send_message(chat_id=tg_id, text="\n".join(lines), parse_mode="HTML")
        except Exception as e:
            logger.error(f"Failed to notify trainer {tg_id}: {e}")

    # Notify connected clients
    for client in data.get("clients", []):
        tg_id = client["client_telegram_id"]
        note = f" ({client['note']})" if client.get("note") else ""
        text = (
            f"💳 <b>Напоминание об оплате</b>\n\n"
            f"Привет, {client['client_name']}! Тренер ожидает оплату "
            f"на сумму <b>{client['amount']:.0f} ₽</b>{note}.\n\n"
            f"Пожалуйста, свяжитесь с тренером для уточнения деталей."
        )
        try:
            await bot.send_message(chat_id=tg_id, text=text, parse_mode="HTML")
        except Exception as e:
            logger.error(f"Failed to notify client {tg_id}: {e}")


def setup_scheduler(bot: Bot) -> AsyncIOScheduler:
    tz = os.getenv("TZ", "Asia/Novosibirsk")
    scheduler = AsyncIOScheduler(timezone=tz)

    # Каждый понедельник в 10:00
    scheduler.add_job(
        send_payment_reminders,
        trigger="cron",
        day_of_week="mon",
        hour=10,
        minute=0,
        kwargs={"bot": bot},
    )

    return scheduler
