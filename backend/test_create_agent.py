#!/usr/bin/env python3
"""Test creating an agent in Retell AI."""

import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()

RETELL_API_KEY = os.getenv("RETELL_API_KEY")
BASE_URL = "https://api.retellai.com"

async def test_create_agent():
    """Test creating an agent in Retell AI."""
    headers = {
        "Authorization": f"Bearer {RETELL_API_KEY}",
        "Content-Type": "application/json"
    }

    # Simplified payload based on what we see in the list
    payload = {
        "agent_name": "Test Agent from API",
        "voice_id": "11labs-Adrian",
        "language": "en-US",
        "response_engine": {
            "type": "retell-llm",
            "llm_id": "general",
        },
        "general_prompt": "You are a helpful assistant. Keep responses brief and clear.",
    }

    async with httpx.AsyncClient() as client:
        try:
            print("Attempting to create agent...")
            print(f"Payload: {json.dumps(payload, indent=2)}")

            response = await client.post(
                f"{BASE_URL}/create-agent",
                json=payload,
                headers=headers,
                timeout=30.0
            )

            print(f"\nStatus Code: {response.status_code}")
            print(f"Response: {response.text}")

            if response.status_code in [200, 201]:
                print("\n✅ Agent created successfully!")
                data = response.json()
                print(f"Agent ID: {data.get('agent_id')}")
                return True
            else:
                print(f"\n❌ Failed to create agent")
                return False

        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_create_agent())
