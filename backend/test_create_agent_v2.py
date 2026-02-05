#!/usr/bin/env python3
"""Test creating an agent with the newer Retell AI API format."""

import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()

RETELL_API_KEY = os.getenv("RETELL_API_KEY")
BASE_URL = "https://api.retellai.com"

async def test_create_llm_and_agent():
    """Test creating an LLM and then an agent."""
    headers = {
        "Authorization": f"Bearer {RETELL_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        # First, create a custom LLM
        print("Step 1: Creating LLM...")
        llm_payload = {
            "general_prompt": "You are a professional dispatch assistant. Keep responses brief and helpful.",
            "general_tools": [],
            "starting_sentence": "Hi, this is dispatch calling to check in.",
            "model": "gpt-4o-mini"
        }

        try:
            response = await client.post(
                f"{BASE_URL}/create-retell-llm",
                json=llm_payload,
                headers=headers,
                timeout=30.0
            )

            print(f"LLM Status: {response.status_code}")
            print(f"LLM Response: {response.text}\n")

            if response.status_code not in [200, 201]:
                print("❌ Failed to create LLM")
                return False

            llm_data = response.json()
            llm_id = llm_data.get("llm_id")
            print(f"✅ LLM Created: {llm_id}\n")

            # Now create the agent
            print("Step 2: Creating Agent...")
            agent_payload = {
                "agent_name": "Test Agent with LLM",
                "voice_id": "11labs-Adrian",
                "language": "en-US",
                "response_engine": {
                    "type": "retell-llm",
                    "llm_id": llm_id
                }
            }

            response = await client.post(
                f"{BASE_URL}/create-agent",
                json=agent_payload,
                headers=headers,
                timeout=30.0
            )

            print(f"Agent Status: {response.status_code}")
            print(f"Agent Response: {response.text}")

            if response.status_code in [200, 201]:
                print("\n✅ Agent created successfully!")
                agent_data = response.json()
                print(f"Agent ID: {agent_data.get('agent_id')}")
                return True
            else:
                print("\n❌ Failed to create agent")
                return False

        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_create_llm_and_agent())
