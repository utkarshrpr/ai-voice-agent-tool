#!/usr/bin/env python3
"""Test web call creation with v2 endpoint."""

import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()

RETELL_API_KEY = os.getenv("RETELL_API_KEY")
BASE_URL_V2 = "https://api.retellai.com/v2"

async def test_create_web_call():
    """Test creating a web call with v2 endpoint."""
    headers = {
        "Authorization": f"Bearer {RETELL_API_KEY}",
        "Content-Type": "application/json"
    }

    # Use the agent we created earlier
    agent_id = "agent_7b3a92a7a1e9efaf064080aba2"

    payload = {
        "agent_id": agent_id,
        "metadata": {
            "test": "true",
            "driver_name": "Test Driver",
            "load_number": "TEST-001"
        }
    }

    async with httpx.AsyncClient() as client:
        try:
            print(f"Creating web call with agent: {agent_id}")
            print(f"Endpoint: {BASE_URL_V2}/create-web-call")

            response = await client.post(
                f"{BASE_URL_V2}/create-web-call",
                json=payload,
                headers=headers,
                timeout=30.0
            )

            print(f"\nStatus: {response.status_code}")
            print(f"Response: {response.text}")

            if response.status_code in [200, 201]:
                data = response.json()
                print(f"\n✅ Web call created successfully!")
                print(f"Call ID: {data.get('call_id')}")
                print(f"Access Token: {data.get('access_token')[:50]}...")
                return True
            else:
                print(f"\n❌ Failed to create web call")
                return False

        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_create_web_call())
