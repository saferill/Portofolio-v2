import sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://localhost:8788"

# Start python http server in background if needed
import subprocess
server = subprocess.Popen([sys.executable, "-m", "http.server", "8789", "--directory", "site"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--autoplay-policy=no-user-gesture-required"]
        )
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        print("1. Opening Chat page on http://localhost:8789/chat/...")
        page.goto("http://localhost:8789/chat/", wait_until="networkidle")
        page.wait_for_timeout(500)

        # Check initial title and favicon
        init_title = page.title()
        init_favicon = page.evaluate("() => document.querySelector('link[rel=\"icon\"]')?.href")
        print(f"Initial Title: {init_title}")
        print(f"Initial Favicon: {init_favicon}")
        assert "favicon.svg" in init_favicon, "Initial favicon must be avatar favicon.svg"

        # 2. Trigger play track
        print("\n2. Playing track...")
        page.evaluate("""() => {
            window.dispatchEvent(new CustomEvent('music-command', {
                detail: {
                    command: 'play_track',
                    track: {
                        id: 'local-summer-nights',
                        title: 'Summer Nights',
                        artist: 'Myla',
                        durationSeconds: 192
                    }
                }
            }));
        }""")
        page.wait_for_timeout(1000)

        play_title = page.title()
        play_favicon = page.evaluate("() => document.querySelector('link[rel=\"icon\"]')?.href")
        print(f"Playing Title: {play_title}")
        print(f"Playing Favicon: {play_favicon}")
        assert "▶ Summer Nights · Myla" in play_title, f"Expected play title but got: {play_title}"
        assert "favicon-equalizer.svg" in play_favicon, f"Expected equalizer favicon but got: {play_favicon}"

        # 3. Trigger pause
        print("\n3. Pausing track...")
        page.evaluate("() => window.dispatchEvent(new CustomEvent('music-command', { detail: { command: 'pause' } }))")
        page.wait_for_timeout(600)

        pause_title = page.title()
        pause_favicon = page.evaluate("() => document.querySelector('link[rel=\"icon\"]')?.href")
        print(f"Paused Title: {pause_title}")
        print(f"Paused Favicon: {pause_favicon}")
        assert "⏸ Summer Nights · Myla" in pause_title, f"Expected pause title but got: {pause_title}"
        assert "favicon-paused.svg" in pause_favicon, f"Expected paused favicon but got: {pause_favicon}"

        # 4. Trigger stop
        print("\n4. Stopping track...")
        page.evaluate("() => window.dispatchEvent(new CustomEvent('music-command', { detail: { command: 'stop' } }))")
        page.wait_for_timeout(600)

        stop_title = page.title()
        stop_favicon = page.evaluate("() => document.querySelector('link[rel=\"icon\"]')?.href")
        print(f"Stopped Title: {stop_title}")
        print(f"Stopped Favicon: {stop_favicon}")
        assert "favicon.svg" in stop_favicon, f"Expected avatar favicon on stop but got: {stop_favicon}"

        print("\n🎉 ALL TESTS PASSED! Dynamic Title & Dynamic Favicon combination (1 & 4) works beautifully!")
        browser.close()
finally:
    server.terminate()
