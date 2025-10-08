#!/usr/bin/env python3
"""Test GLM-4.6 via Z.AI Anthropic-compatible API"""

import os
from anthropic import Anthropic

# Get API key from environment
api_key = os.getenv("ZAI_API_KEY")
if not api_key:
    print("ERROR: ZAI_API_KEY environment variable not set!")
    exit(1)

# Initialize Anthropic client with Z.AI endpoint
client = Anthropic(
    api_key=api_key,
    base_url="https://api.z.ai/api/anthropic"
)

print("Testing GLM-4.6 via Z.AI Anthropic API...")
print(f"Base URL: https://api.z.ai/api/anthropic")
print(f"Model: GLM-4.6\n")

try:
    # Create a test message
    message = client.messages.create(
        model="GLM-4.6",
        max_tokens=100,
        messages=[
            {"role": "user", "content": "Say hello in one sentence."}
        ]
    )

    print("✅ SUCCESS!")
    print(f"\nResponse:")
    print(message.content[0].text)
    print(f"\nUsage: {message.usage}")

except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
