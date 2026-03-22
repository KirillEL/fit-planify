from aiogram import Router
from aiogram.filters import CommandStart, CommandObject
from aiogram.types import Message

from keyboards.trainer import main_menu, client_program_keyboard
from services.api_client import api

router = Router()


@router.message(CommandStart(deep_link=True))
async def start_with_invite(message: Message, command: CommandObject):
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

    bound = await api.bind_telegram(invite_token, message.from_user.id)
    if not bound:
        await message.answer("Не удалось привязать аккаунт. Попробуй позже.")
        return

    programs = await api.get_client_programs(client["id"])

    if not programs:
        await message.answer(
            f"Привет, {client['name']}! 👋\n\nТвой тренер ещё не добавил программу. Скоро появится!"
        )
        return

    program = programs[0]
    await message.answer(
        f"Привет, {client['name']}! 👋\n\nТвоя программа тренировок готова — нажми кнопку ниже, чтобы открыть.",
        reply_markup=client_program_keyboard(program["id"]),
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
