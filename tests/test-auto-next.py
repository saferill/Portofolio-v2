import sys, json, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://localhost:8788"

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME_PATH,
        headless=True,
        args=["--autoplay-policy=no-user-gesture-required"]
    )
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    print(f"Loading {BASE_URL}/chat/...")
    page.goto(f"{BASE_URL}/chat/", wait_until="networkidle")
    page.wait_for_timeout(1000)

    # 1. Play first song
    print("Playing first song: Love Me Not Ravyn Lenae")
    field = page.locator("input").first
    field.fill("/play Love Me Not Ravyn Lenae")
    field.press("Enter")

    page.wait_for_function("() => window.portfolioMusicDebug?.playing === true && window.portfolioMusicDebug?.currentTime > 1", timeout=30000)
    dbg_first = page.evaluate("() => window.portfolioMusicDebug")
    first_track_id = dbg_first.get("trackId")
    first_track_msg = dbg_first.get("message")
    print(f"First song playing: id={first_track_id} title={first_track_msg}")

    # 2. Simulate song completion by triggering next() (which gets called on YouTube ended event)
    print("\nSimulating song ended -> calling engine next()...")
    page.evaluate("() => window.__portfolioMusicEngine.next()")

    # 3. Wait for new track to be automatically loaded and playing
    page.wait_for_function(f"() => window.portfolioMusicDebug?.trackId && window.portfolioMusicDebug?.trackId !== '{first_track_id}' && window.portfolioMusicDebug?.playing === true && window.portfolioMusicDebug?.currentTime > 0.5", timeout=30000)

    dbg_next = page.evaluate("() => window.portfolioMusicDebug")
    next_track_id = dbg_next.get("trackId")
    next_track_msg = dbg_next.get("message")
    print(f"Second song automatically playing: id={next_track_id} title={next_track_msg}")

    # Verify history and state
    state = page.evaluate("() => window.__portfolioMusicEngine.getState()")
    print(f"History length: {len(state.get('history', []))}")
    print(f"Current song: {state.get('current', {}).get('title')} by {state.get('current', {}).get('artist')}")

    assert next_track_id != first_track_id, "Track ID must change to new recommended song"
    assert dbg_next.get("playing") is True, "New song must be playing automatically"

    print("\nSUCCESS: Automatic queue / autoplay next song is working perfectly!")
    browser.close()
