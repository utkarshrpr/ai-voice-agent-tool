#!/usr/bin/env python3
"""Quick test script to verify Retell AI API connectivity."""

import httpx
import os
from dotenv import load_dotenv

load_dotenv()

RETELL_API_KEY = os.getenv("RETELL_API_KEY")
BASE_URL = "https://api.retellai.com"

async def test_retell_connection():
    """Test if we can connect to Retell AI API."""
    headers = {
        "Authorization": f"Bearer {RETELL_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            # Try to list agents
            response = await client.get(
                f"{BASE_URL}/list-agents",
                headers=headers,
                timeout=10.0
            )
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")

            if response.status_code == 200:
                print("\n✅ Retell AI API connection successful!")
                return True
            else:
                print(f"\n❌ Retell AI API error: {response.status_code}")
                print(f"Response: {response.text}")
                return False

        except Exception as e:
            print(f"\n❌ Connection error: {e}")
            return False

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_retell_connection())
