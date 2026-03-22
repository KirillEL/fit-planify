import httpx
import os

API_URL = os.getenv("API_URL", "http://api:8080")
BOT_SECRET = os.getenv("BOT_SECRET", "")


class APIClient:
    def __init__(self):
        self.base_url = API_URL
        self.client = httpx.AsyncClient(timeout=10.0)

    async def get_client_by_token(self, token: str) -> dict | None:
        r = await self.client.get(f"{self.base_url}/invite/{token}")
        if r.status_code == 200:
            return r.json()
        return None

    async def bind_telegram(self, token: str, telegram_id: int) -> dict | None:
        r = await self.client.post(
            f"{self.base_url}/invite/{token}/bind",
            json={"telegram_id": telegram_id},
        )
        if r.status_code == 200:
            return r.json()
        return None

    async def get_program(self, program_id: int) -> dict | None:
        r = await self.client.get(f"{self.base_url}/programs/{program_id}")
        if r.status_code == 200:
            return r.json()
        return None

    async def get_client_programs(self, client_id: int) -> list[dict]:
        r = await self.client.get(f"{self.base_url}/clients/{client_id}/programs")
        if r.status_code == 200:
            return r.json()
        return []

    async def get_unpaid_payments(self, trainer_telegram_id: int) -> list[dict]:
        r = await self.client.get(
            f"{self.base_url}/payments/unpaid",
            headers={"X-Trainer-ID": str(trainer_telegram_id)},
        )
        if r.status_code == 200:
            return r.json()
        return []

    async def get_payment_reminders(self) -> dict:
        r = await self.client.get(
            f"{self.base_url}/notify/reminders",
            headers={"X-Bot-Secret": BOT_SECRET},
        )
        if r.status_code == 200:
            return r.json()
        return {"trainers": [], "clients": []}

    async def close(self):
        await self.client.aclose()


api = APIClient()
