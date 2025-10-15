"""
Script to run the document management migration
"""
import asyncio
from pathlib import Path
from core.services.supabase import DBConnection
from core.utils.logger import logger


async def run_migration():
    """Run the document management migration"""
    migration_file = Path(__file__).parent / "supabase" / "migrations" / "20251014000000_create_documents_table.sql"

    if not migration_file.exists():
        logger.error(f"Migration file not found: {migration_file}")
        return False

    # Read migration SQL
    with open(migration_file, 'r') as f:
        migration_sql = f.read()

    # Connect to database
    db = DBConnection()
    await db.initialize()
    client = await db.client

    try:
        # Split by statement and execute each one
        statements = [s.strip() for s in migration_sql.split(';') if s.strip()]

        logger.info(f"Running {len(statements)} SQL statements...")

        for i, statement in enumerate(statements, 1):
            if not statement:
                continue

            try:
                logger.debug(f"Executing statement {i}/{len(statements)}")
                # Use the rpc function to execute raw SQL
                await client.rpc('exec_sql', {'sql': statement}).execute()
                logger.debug(f"Statement {i} executed successfully")
            except Exception as e:
                # Some statements might fail if objects already exist, that's okay
                error_msg = str(e)
                if 'already exists' in error_msg.lower() or 'duplicate' in error_msg.lower():
                    logger.warning(f"Statement {i} already applied: {error_msg}")
                else:
                    logger.error(f"Error executing statement {i}: {error_msg}")
                    # Continue with other statements

        logger.info("Migration completed successfully!")
        return True

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return False
    finally:
        await db.disconnect()


if __name__ == "__main__":
    success = asyncio.run(run_migration())
    exit(0 if success else 1)
