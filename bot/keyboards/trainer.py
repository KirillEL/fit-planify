from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
import os

MINI_APP_URL = os.getenv("MINI_APP_URL", "https://your-domain.com")


def main_menu(trainer_name: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="📋 Открыть кабинет тренера",
            web_app=WebAppInfo(url=f"{MINI_APP_URL}/trainer")
        )],
    ])


def client_program_keyboard(program_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="💪 Посмотреть мою программу",
            web_app=WebAppInfo(url=f"{MINI_APP_URL}/client/program/{program_id}")
        )],
    ])
