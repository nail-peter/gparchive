"""
Find missing GP episodes by checking date gaps
"""
from datetime import datetime, timedelta
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Existing episodes from R2
existing_dates = [
    "2025-10-18", "2025-10-25", "2025-11-01", "2025-11-08", "2025-11-15",
    "2025-11-29", "2025-12-06", "2025-12-13", "2025-12-20", "2025-12-27",
    "2026-01-03", "2026-01-10", "2026-01-18", "2026-01-25",
    "2026-02-01", "2026-02-08", "2026-02-14", "2026-02-21", "2026-02-28",
    "2026-03-07", "2026-03-14", "2026-03-21",
    "2026-04-05",
    "2026-05-09", "2026-05-16", "2026-05-23", "2026-05-30",
    "2026-06-13", "2026-06-20", "2026-06-27"
]

# Convert to datetime objects
existing = [datetime.strptime(d, "%Y-%m-%d") for d in existing_dates]
existing.sort()

# GP airs on Saturdays
start_date = existing[0]
end_date = datetime(2026, 7, 13)  # Today

missing = []
current = start_date

while current <= end_date:
    # Only check Saturdays (weekday 5)
    if current.weekday() == 5:
        if current not in existing:
            missing.append(current.strftime("%Y-%m-%d"))
    current += timedelta(days=1)

print("Missing GP Episodes (Saturdays):")
print("=" * 60)
for date in missing:
    print(f"  {date}")

print(f"\nTotal missing: {len(missing)} episodes")
print("\nNote: Some may not be available on BBC anymore")
