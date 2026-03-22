import logging

from aiogram import Bot, Router
from aiogram.filters import CommandStart, CommandObject
from aiogram.types import Message

logger = logging.getLogger(__name__)

from keyboards.trainer import main_menu, client_programs_keyboard
from services.api_client import api

router = Router()


@router.message(CommandStart(deep_link=True))
async def start_with_invite(message: Message, command: CommandObject, bot: Bot):
    """Клиент переходит по инвайт-ссылке: /start invite_<token>"""
    token = command.args
    if not token or not token.startswith("invite_"):
        await start_trainer(message)
        return

    invite_token = token.removeprefix("invite_")
    client = await api.get_client_by_token(invite_token)

    if not client:
        await message.answer("Ссылка недействительна или устарела.")
        return

    bind_data = await api.bind_telegram(invite_token, message.from_user.id)
    if not bind_data:
        await message.answer("Не удалось привязать аккаунт. Попробуй позже.")
        return

    trainer_tg_id = bind_data.get("trainer_telegram_id", 0)
    if trainer_tg_id:
        try:
            await bot.send_message(
                chat_id=trainer_tg_id,
                text=f"✅ Клиент <b>{client['name']}</b> подключился к боту!",
                parse_mode="HTML",
            )
        except Exception as e:
            logger.error(f"Failed to notify trainer {trainer_tg_id}: {e}")

    await message.answer(
        f"Привет, {client['name']}! 👋\n\nТвои программы тренировок доступны — нажми кнопку ниже, чтобы открыть.",
        reply_markup=client_programs_keyboard(invite_token),
    )


@router.message(CommandStart())
async def start_trainer(message: Message):
    """Обычный старт — для тренера"""
    name = message.from_user.first_name
    await message.answer(
        f"Привет, {name}! 👋\n\n"
        "Я помогу тебе вести клиентов, составлять программы тренировок и отслеживать оплаты.\n\n"
        "Открой кабинет тренера 👇",
        reply_markup=main_menu(name),
    )
