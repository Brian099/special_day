import urllib.request
import json
import time
import subprocess
import os
import sys

def test_app():
    # Start server in background
    env = os.environ.copy()
    env["PORT"] = "8089"
    env["DATABASE_PATH"] = "d:/coding/纪念日提醒/test_data.db"
    
    proc = subprocess.Popen(["node", "app/backend/server.js"], env=env, cwd="d:/coding/纪念日提醒")
    time.sleep(2)
    
    base_url = "http://127.0.0.1:8089/api"
    
    try:
        # 1. Test calculation preview (Solar & Lunar)
        solar_payload = {
            "target_date": "2024-10-01",
            "calendar_type": "solar",
            "repeat_type": "year"
        }
        req = urllib.request.Request(f"{base_url}/preview/calculate", data=json.dumps(solar_payload).encode('utf-8'), headers={"Content-Type": "application/json"})
        resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        print("✅ Solar Calculation Preview:", resp["data"]["nextDate"], "Days remaining:", resp["data"]["daysRemaining"])
        
        lunar_payload = {
            "target_date": "2024-01-01", # 农历正月初一 (春节)
            "calendar_type": "lunar",
            "repeat_type": "year"
        }
        req = urllib.request.Request(f"{base_url}/preview/calculate", data=json.dumps(lunar_payload).encode('utf-8'), headers={"Content-Type": "application/json"})
        resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        print("✅ Lunar Calculation Preview (Spring Festival):", resp["data"]["nextDate"], resp["data"]["lunarFormatted"], "Days remaining:", resp["data"]["daysRemaining"])
        
        # 2. Test fnOS Gateway simulation headers
        headers = {
            "X-Trim-User-Id": "1002",
            "X-Trim-Username": "fnos_tester",
            "X-Trim-Is-Admin": "true",
            "Content-Type": "application/json"
        }
        
        # Get Me
        req = urllib.request.Request(f"{base_url}/auth/me", headers=headers)
        resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        print("✅ fnOS Gateway Auto-login:", resp["data"]["user"])
        
        # Create Lunar Birthday Event
        event_payload = {
            "title": "农历生日快乐",
            "target_date": "1998-08-15",
            "calendar_type": "lunar",
            "repeat_type": "year",
            "direction": "countdown",
            "top_pinned": True
        }
        req = urllib.request.Request(f"{base_url}/events", data=json.dumps(event_payload).encode('utf-8'), headers=headers)
        resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        print("✅ Event created:", resp["data"]["id"])
        
        # Create Monthly Cycle Event (e.g. Period/Payment)
        cycle_payload = {
            "title": "周期关怀提醒",
            "target_date": "2026-09-25",
            "calendar_type": "solar",
            "repeat_type": "month",
            "repeat_interval": 1,
            "direction": "countdown"
        }
        req = urllib.request.Request(f"{base_url}/events", data=json.dumps(cycle_payload).encode('utf-8'), headers=headers)
        resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        print("✅ Monthly cycle created:", resp["data"]["id"])
        
        # Create Weekly Flag Raising Event
        week_payload = {
            "title": "周一升旗仪式",
            "target_date": "2026-09-21",
            "calendar_type": "solar",
            "repeat_type": "week",
            "repeat_weekdays": "[1]",
            "direction": "countdown"
        }
        req = urllib.request.Request(f"{base_url}/events", data=json.dumps(week_payload).encode('utf-8'), headers=headers)
        resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        print("✅ Weekly event created:", resp["data"]["id"])
        
        # Query Events
        req = urllib.request.Request(f"{base_url}/events", headers=headers)
        resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        print(f"✅ Fetched {len(resp['data']['events'])} events. Stats:", resp["data"]["stats"])
        for ev in resp["data"]["events"]:
            print(f"   - [{ev['title']}] Next: {ev['calculation']['nextDate']} ({ev['calculation']['lunarFormatted']}) | 剩余: {ev['calculation']['daysRemaining']}天 | 置顶: {ev['top_pinned']}")
            
        print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
    finally:
        proc.terminate()
        try:
            os.remove("d:/coding/纪念日提醒/test_data.db")
        except:
            pass

if __name__ == "__main__":
    test_app()
