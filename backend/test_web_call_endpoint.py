#!/usr/bin/env python3
"""Test to find the correct web call endpoint."""

import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()

RETELL_API_KEY = os.getenv("RETELL_API_KEY")
BASE_URL = "https://api.retellai.com"

async def test_endpoints():
    """Test different endpoint variations."""
    headers = {
        "Authorization": f"Bearer {RETELL_API_KEY}",
        "Content-Type": "application/json"
    }

    # Use the agent we created earlier
    agent_id = "agent_7b3a92a7a1e9efaf064080aba2"

    endpoints = [
        "/create-web-call",
        "/v1/create-web-call",
        "/register-call",
        "/create-call",
        "/web-call",
        "/register-phone-call",  # Try the phone call endpoint too
    ]

    async with httpx.AsyncClient() as client:
        for endpoint in endpoints:
            try:
                payload = {
                    "agent_id": agent_id,
                    "metadata": {"test": "true"}
                }

                print(f"Testing: {BASE_URL}{endpoint}")
                response = await client.post(
                    f"{BASE_URL}{endpoint}",
                    json=payload,
                    headers=headers,
                    timeout=10.0
                )

                print(f"  Status: {response.status_code}")
                if response.status_code != 404:
                    print(f"  Response: {response.text}")
                    if response.status_code in [200, 201]:
                        print(f"  ✅ SUCCESS! Use this endpoint: {endpoint}\n")
                        return endpoint
                print()

            except Exception as e:
                print(f"  Error: {e}\n")

        print("❌ No working endpoint found")
        return None

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_endpoints())
