"""Seed the database with sample data for testing."""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from app.db.session import async_session, engine
from app.models import Base
from app.models.user import User
from app.models.family import Family, FamilyMember, FamilyRole
from app.models.child import ChildProfile
from app.models.device import Device
from app.models.rule import BlockingRule, RuleType
from app.models.location import LocationUpdate, Geofence
from app.services.auth import hash_password


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        parent = User(
            email="parent@example.com",
            hashed_password=hash_password("canopy123"),
            full_name="Alex Johnson",
        )
        db.add(parent)
        await db.flush()

        family = Family(name="Johnson Family")
        db.add(family)
        await db.flush()

        member = FamilyMember(
            family_id=family.id, user_id=parent.id, role=FamilyRole.owner
        )
        db.add(member)

        emma = ChildProfile(family_id=family.id, name="Emma", age=12)
        liam = ChildProfile(family_id=family.id, name="Liam", age=9)
        db.add_all([emma, liam])
        await db.flush()

        macbook_emma = Device(
            family_id=family.id,
            child_profile_id=emma.id,
            name="Emma's MacBook Air",
            platform="macos",
            device_token="test-device-token-emma-001",
        )
        imac_emma = Device(
            family_id=family.id,
            child_profile_id=emma.id,
            name="Family iMac",
            platform="macos",
            device_token="test-device-token-imac-001",
        )
        macbook_liam = Device(
            family_id=family.id,
            child_profile_id=liam.id,
            name="Liam's MacBook",
            platform="macos",
            device_token="test-device-token-liam-001",
        )
        db.add_all([macbook_emma, imac_emma, macbook_liam])
        await db.flush()

        rules = [
            BlockingRule(
                family_id=family.id,
                child_profile_id=emma.id,
                rule_type=RuleType.block_site,
                target="tiktok.com",
                schedule_days=["mon", "tue", "wed", "thu", "fri"],
                schedule_start="08:00",
                schedule_end="15:00",
            ),
            BlockingRule(
                family_id=family.id,
                rule_type=RuleType.block_site,
                target="reddit.com",
            ),
            BlockingRule(
                family_id=family.id,
                child_profile_id=liam.id,
                rule_type=RuleType.block_app,
                target="com.apple.Safari",
                schedule_days=["mon", "tue", "wed", "thu", "fri"],
                schedule_start="20:00",
                schedule_end="07:00",
            ),
        ]
        db.add_all(rules)
        await db.flush()

        # Location data — Accra, Ghana coordinates
        now = datetime.now(timezone.utc)
        locations = [
            LocationUpdate(
                device_id=macbook_emma.id,
                child_profile_id=emma.id,
                family_id=family.id,
                latitude=5.6037,
                longitude=-0.1870,
                accuracy=15.0,
                address="Independence Ave, Accra",
            ),
            LocationUpdate(
                device_id=macbook_liam.id,
                child_profile_id=liam.id,
                family_id=family.id,
                latitude=5.6145,
                longitude=-0.2053,
                accuracy=20.0,
                address="Cantonments, Accra",
            ),
        ]
        locations[0].created_at = now - timedelta(minutes=12)
        locations[1].created_at = now - timedelta(minutes=5)
        db.add_all(locations)

        geofences = [
            Geofence(
                family_id=family.id,
                name="Home",
                latitude=5.6037,
                longitude=-0.1870,
                radius_meters=150,
                is_safe_zone=True,
            ),
            Geofence(
                family_id=family.id,
                name="School",
                latitude=5.6145,
                longitude=-0.2053,
                radius_meters=300,
                is_safe_zone=True,
            ),
            Geofence(
                family_id=family.id,
                child_profile_id=emma.id,
                name="Library",
                latitude=5.6100,
                longitude=-0.1950,
                radius_meters=100,
                is_safe_zone=True,
            ),
        ]
        db.add_all(geofences)
        await db.commit()

        print(f"Seeded: parent={parent.email}, family={family.name}")
        print(f"  Children: Emma (age 12), Liam (age 9)")
        print(f"  Devices: {macbook_emma.name}, {imac_emma.name}, {macbook_liam.name}")
        print(f"  Rules: {len(rules)} blocking rules")
        print(f"  Locations: {len(locations)} recent updates")
        print(f"  Geofences: {len(geofences)} zones (Home, School, Library)")
        print(f"\nTest credentials: parent@example.com / canopy123")
        print(f"Device tokens: test-device-token-emma-001, test-device-token-imac-001, test-device-token-liam-001")


if __name__ == "__main__":
    asyncio.run(seed())
