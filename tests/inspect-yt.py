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

    page.goto("https://syafril.pages.dev/chat", wait_until="networkidle")
    page.wait_for_timeout(1000)

    # Let's inspect what happens when creating YT.Player with and without videoId
    diag = page.evaluate("""() => {
        return new Promise((resolve) => {
            const report = { logs: [] };
            function log(m) { report.logs.push(m); }

            // Check if YT script is loaded
            log('Initial window.YT: ' + typeof window.YT);

            // Trigger a play command
            window.dispatchEvent(new CustomEvent('music-command', {
                detail: {
                    command: 'play_track',
                    track: {
                        id: 'cswfR85D7jM',
                        videoId: 'cswfR85D7jM',
                        title: 'Love Me Not',
                        artist: 'Ravyn Lenae',
                        durationSeconds: 210
                    }
                }
            }));

            let checks = 0;
            const timer = setInterval(() => {
                checks++;
                const engine = window.__portfolioMusicEngine;
                const yt = window.YT;
                log(`Check ${checks}: YT=${typeof yt} player=${typeof yt?.Player} debug=${JSON.stringify(window.portfolioMusicDebug)}`);

                if (checks >= 8) {
                    clearInterval(timer);
                    resolve(report);
                }
            }, 1000);
        });
    }""")

    print(json.dumps(diag, indent=2))
    browser.close()
