import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def update_admin():
    async with AsyncSessionLocal() as session:
        await session.execute(
            text("UPDATE users SET password_hash = :hash WHERE email = 'admin@university.edu.vn'"),
            {"hash": "$argon2id$v=19$m=65536,t=3,p=4$Lyjk7guHR1COPIapAMz2Cg$E9QjMbgYThR8OfFFuE7Tc/tv0pCdXdoZunGNxP5SVx4"}
        )
        await session.commit()
        print("Updated successfully")

if __name__ == "__main__":
    asyncio.run(update_admin())
