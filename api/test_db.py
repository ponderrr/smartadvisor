import asyncio
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, AsyncSessionLocal
from app.models import User
from sqlalchemy import select


async def test_database():
    print("🔧 Testing Smart Advisor Database...")
    print("=" * 50)

    try:
        # Test 1: Engine connection
        print("1. Testing database engine connection...")
        async with engine.begin() as conn:
            print("   ✅ Database engine connected successfully!")

        # Test 2: Session creation
        print("2. Testing database session creation...")
        async with AsyncSessionLocal() as session:
            print("   ✅ Database session created successfully!")

            # Test 3: Query execution
            print("3. Testing database query execution...")
            result = await session.execute(select(User))
            users = result.scalars().all()
            print(f"   ✅ Database query successful! Found {len(users)} users.")

            # Test 4: Table structure
            print("4. Testing table structure...")
            from app.core.database import Base

            tables = list(Base.metadata.tables.keys())
            print(f"   ✅ Found {len(tables)} tables: {', '.join(tables)}")

        print("=" * 50)
        print("🎉 DATABASE IS WORKING PERFECTLY!")
        print("✅ All tests passed. Your database is ready to use.")

    except Exception as e:
        print("=" * 50)
        print("❌ DATABASE TEST FAILED!")
        print(f"Error: {str(e)}")
        print("\n🔧 Troubleshooting steps:")
        print("1. Make sure you've run: alembic upgrade head")
        print("2. Check your .env file has correct DATABASE_URL")
        print(
            "3. Ensure all dependencies are installed: pip install -r requirements.txt"
        )
        return False

    return True


if __name__ == "__main__":
    success = asyncio.run(test_database())
    sys.exit(0 if success else 1)
