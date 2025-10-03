#!/usr/bin/env python3
"""
Test script to simulate Suna's interaction with 302.AI model
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from core.ai_models import registry
from core.services.llm import make_llm_api_call


async def test_302ai_model():
    """Test the 302.AI model exactly like Suna does"""

    print("=" * 60)
    print("Testing 302.AI Model Integration")
    print("=" * 60)

    # Get model from registry
    model = registry.get('claude-sonnet-4-5-20250929')

    if not model:
        print("❌ Model not found in registry!")
        return

    print(f"\n✅ Found model: {model.name}")
    print(f"   ID: {model.id}")
    print(f"   API Base: {model.config.api_base if model.config else 'None'}")

    # Test message
    messages = [
        {
            "role": "user",
            "content": "Respond with exactly: 'Working perfectly! 302.AI integration successful.'"
        }
    ]

    print(f"\n📤 Sending test message...")
    print(f"   Model: {model.id}")
    print(f"   API Base: {model.config.api_base}")

    try:
        # Call LLM API exactly like Suna does
        response = await make_llm_api_call(
            messages=messages,
            model_name=model.id,
            temperature=0.7,
            max_tokens=100,
            stream=False  # Non-streaming for testing
        )

        print(f"\n✅ API Call Successful!")
        print(f"\n📥 Response:")
        if hasattr(response, 'choices'):
            # OpenAI-style response
            content = response.choices[0].message.content
            print(f"   {content}")
            print(f"\n📊 Usage:")
            print(f"   Input tokens: {response.usage.prompt_tokens}")
            print(f"   Output tokens: {response.usage.completion_tokens}")
        else:
            # Anthropic-style response
            content = response.content[0].text if hasattr(response, 'content') else str(response)
            print(f"   {content}")
            if hasattr(response, 'usage'):
                print(f"\n📊 Usage:")
                print(f"   Input tokens: {response.usage.input_tokens}")
                print(f"   Output tokens: {response.usage.output_tokens}")

        print(f"\n✅ Test PASSED! 302.AI integration is working!")
        return True

    except Exception as e:
        print(f"\n❌ API Call Failed!")
        print(f"   Error: {str(e)}")
        print(f"\n🔍 Error Details:")
        print(f"   Type: {type(e).__name__}")
        if hasattr(e, '__dict__'):
            for key, value in e.__dict__.items():
                print(f"   {key}: {value}")

        print(f"\n❌ Test FAILED! Check error details above.")
        return False


async def main():
    """Main test runner"""
    success = await test_302ai_model()
    print("\n" + "=" * 60)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
