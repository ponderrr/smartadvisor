#!/usr/bin/env python3
"""
Simple test script to verify the SmartAdvisor API is working correctly.
Run this script after starting your FastAPI server.
"""

import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1"


class APITester:
    def __init__(self):
        self.access_token = None

    async def test_health_check(self):
        """Test basic health check."""
        print("🔍 Testing health check...")
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get("http://localhost:8000/health")
                print(f"Health check: {response.status_code} - {response.json()}")
                return response.status_code == 200
            except Exception as e:
                print(f"❌ Health check failed: {e}")
                return False

    async def test_register_user(self):
        """Test user registration."""
        print("\n👤 Testing user registration...")
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpassword123",
            "age": 25,
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{BASE_URL}/auth/register", json=user_data
                )
                print(f"Registration: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    print("✅ Registration successful")
                    print(f"Registered user: {data.get('email', 'unknown')}")
                    return True
                elif response.status_code == 400:
                    error_data = response.json()
                    if "already registered" in error_data.get("detail", "").lower():
                        print("ℹ️ User already exists, will try login instead")
                        return False
                    else:
                        print(f"❌ Registration failed: {response.text}")
                        return False
                else:
                    print(f"❌ Registration failed: {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Registration error: {e}")
                return False

    async def test_login_user(self):
        """Test user login."""
        print("\n🔐 Testing user login...")
        login_data = {"email": "test@example.com", "password": "testpassword123"}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
                print(f"Login: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    self.access_token = data["access_token"]
                    print("✅ Login successful")
                    print(
                        f"Token received (first 20 chars): {self.access_token[:20]}..."
                    )
                    return True
                else:
                    print(f"❌ Login failed: {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Login error: {e}")
                return False

    async def test_current_user(self):
        """Test getting current user info."""
        print("\n👤 Testing current user endpoint...")

        if not self.access_token:
            print("❌ No access token available")
            return False

        headers = {"Authorization": f"Bearer {self.access_token}"}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{BASE_URL}/users/me", headers=headers)
                print(f"Current user: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Current user: {data.get('email', 'unknown')}")
                    return True
                else:
                    print(f"❌ Get current user failed: {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Current user error: {e}")
                return False

    async def test_generate_questions(self):
        """Test question generation."""
        print("\n❓ Testing question generation...")

        if not self.access_token:
            print("❌ No access token available")
            return False

        headers = {"Authorization": f"Bearer {self.access_token}"}
        question_data = {"type": "movie", "num_questions": 3}

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{BASE_URL}/recommendations/generate-questions",
                    json=question_data,
                    headers=headers,
                )
                print(f"Question generation: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Generated {len(data['questions'])} questions")
                    print(f"Recommendation ID: {data['recommendation_id']}")

                    # Print first question
                    if data["questions"]:
                        first_q = data["questions"][0]
                        print(f"First question: {first_q['text']}")

                    return data
                else:
                    print(f"❌ Question generation failed: {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Question generation error: {e}")
                return False

    async def test_submit_answers(self, recommendation_data):
        """Test answer submission."""
        print("\n📝 Testing answer submission...")

        if not self.access_token or not recommendation_data:
            print("❌ Missing access token or recommendation data")
            return False

        headers = {"Authorization": f"Bearer {self.access_token}"}

        # Create answers for all questions
        answers = []
        for question in recommendation_data["questions"]:
            answers.append(
                {
                    "question_id": question["id"],
                    "answer_text": f"Test answer for question {question['order']}: I like action movies with good stories and interesting characters.",
                }
            )

        submission_data = {
            "recommendation_id": recommendation_data["recommendation_id"],
            "answers": answers,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{BASE_URL}/recommendations/submit-answers",
                    json=submission_data,
                    headers=headers,
                )
                print(f"Answer submission: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Received recommendations")
                    print(f"Movies: {len(data.get('movies', []))}")
                    print(f"Books: {len(data.get('books', []))}")

                    # Print first recommendation if available
                    if data.get("movies"):
                        first_movie = data["movies"][0]
                        print(f"First movie: {first_movie['title']}")

                    return True
                else:
                    print(f"❌ Answer submission failed: {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Answer submission error: {e}")
                return False

    async def test_subscription_status(self):
        """Test subscription status."""
        print("\n💳 Testing subscription status...")

        if not self.access_token:
            print("❌ No access token available")
            return False

        headers = {"Authorization": f"Bearer {self.access_token}"}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{BASE_URL}/subscriptions/status", headers=headers
                )
                print(f"Subscription status: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Subscription tier: {data.get('tier', 'unknown')}")
                    print(f"Status: {data.get('status', 'unknown')}")
                    return True
                else:
                    print(f"❌ Subscription status failed: {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Subscription status error: {e}")
                return False

    async def test_subscription_plans(self):
        """Test getting subscription plans."""
        print("\n📋 Testing subscription plans...")

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{BASE_URL}/subscriptions/plans")
                print(f"Subscription plans: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    plans = data.get("plans", [])
                    print(f"✅ Found {len(plans)} subscription plans")
                    for plan in plans:
                        print(
                            f"  - {plan.get('name', 'Unknown')}: ${plan.get('price', 0)}"
                        )
                    return True
                else:
                    print(f"❌ Get subscription plans failed: {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Subscription plans error: {e}")
                return False

    async def run_all_tests(self):
        """Run all tests in sequence."""
        print("🚀 Starting API tests...\n")

        # Test health check first
        if not await self.test_health_check():
            print("❌ Health check failed - is the server running?")
            return

        # Test subscription plans (public endpoint)
        await self.test_subscription_plans()

        # Try to register a new user
        register_success = await self.test_register_user()

        # If registration fails (user might exist), try login
        if not register_success:
            login_success = await self.test_login_user()
            if not login_success:
                print("❌ Both registration and login failed")
                return
        else:
            # If registration succeeded, we still need to login to get the token
            login_success = await self.test_login_user()
            if not login_success:
                print("❌ Registration succeeded but login failed")
                return

        # Test authenticated endpoints
        await self.test_current_user()
        await self.test_subscription_status()

        # Test recommendation flow
        print("\n🎬 Testing recommendation flow...")
        recommendation_data = await self.test_generate_questions()
        if recommendation_data:
            await self.test_submit_answers(recommendation_data)

        print("\n🎉 API testing completed!")


async def main():
    """Main function to run tests."""
    tester = APITester()
    await tester.run_all_tests()


if __name__ == "__main__":
    print("SmartAdvisor API Tester")
    print("========================")
    print("Make sure your FastAPI server is running on http://localhost:8000")
    print()

    asyncio.run(main())
