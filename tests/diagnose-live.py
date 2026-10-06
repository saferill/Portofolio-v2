import sys, json, time
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME_PATH,
        headless=True,
        args=["--autoplay-policy=no-user-gesture-required"]
    )
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()

    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: console_logs.append(f"[PAGE_ERROR] {err}"))

    print("Navigating to https://syafril.pages.dev/chat...")
    page.goto("https://syafril.pages.dev/chat", wait_until="networkidle")
    page.wait_for_timeout(1500)

    print("Sending command: /play Love Me Not Ravyn Lenae")
    field = page.locator("input").first
    field.fill("/play Love Me Not Ravyn Lenae")
    field.press("Enter")

    # Poll and observe for 15 seconds
    for sec in range(15):
        page.wait_for_timeout(1000)
        debug = page.evaluate("() => window.portfolioMusicDebug || null")
        panel_text = page.evaluate("""() => {
            const p = document.getElementById('music-audio-panel');
            return p ? { hidden: p.hidden, text: p.innerText } : null;
        }""")
        yt_state = page.evaluate("""() => {
            const ifr = document.querySelector('iframe');
            return {
                iframePresent: !!ifr,
                iframeSrc: ifr ? ifr.src : null,
                isConnected: ifr ? ifr.isConnected : false
            };
        }""")
        print(f"Sec {sec+1}: debug={json.dumps(debug)} panel={json.dumps(panel_text)} yt={json.dumps(yt_state)}")
        if panel_text and not panel_text.get("hidden"):
            print(">>> PANEL IS VISIBLE!")

    page.screenshot(path="checks/diagnose-live.png")
    print("\n--- ALL CONSOLE LOGS ---")
    for log in console_logs:
        print(log)

    browser.close()
