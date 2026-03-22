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


def client_programs_keyboard(token: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="💪 Посмотреть мои программы",
            web_app=WebAppInfo(url=f"{MINI_APP_URL}/client/programs?token={token}")
        )],
    ])
