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

    res = page.evaluate("""() => {
        return new Promise((resolve) => {
            const out = { onReadyFired: false, onErrorFired: null, playerState: null, error: null };
            
            const script = document.querySelector('script[src*="iframe_api"]');
            out.scriptPresent = !!script;

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

            setTimeout(() => {
                const ifr = document.querySelector('#yt-audio-container iframe') || document.querySelector('iframe');
                out.iframeTag = ifr ? ifr.outerHTML.slice(0, 300) : null;

                if (window.YT && window.YT.get) {
                    const p = window.YT.get('yt-audio-container');
                    out.ytGet = !!p;
                    if (p) {
                        try { out.playerState = p.getPlayerState(); } catch(e) { out.playerStateErr = e.message; }
                        try { out.videoData = p.getVideoData(); } catch(e) { out.videoDataErr = e.message; }
                        try { out.currentTime = p.getCurrentTime(); } catch(e) { out.curTimeErr = e.message; }
                    }
                }
                resolve(out);
            }, 6000);
        });
    }""")

    print("Direct YT diagnostics:", json.dumps(res, indent=2))
    browser.close()
