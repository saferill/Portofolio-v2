import sys, json, time
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME_PATH,
        headless=True,
        args=["--autoplay-policy=no-user-gesture-required"]
    )
    page = browser.new_page()

    # Load a blank page or syafril.pages.dev and test proper YT.Player initialization
    page.goto("https://syafril.pages.dev/", wait_until="networkidle")

    res = page.evaluate("""() => {
        return new Promise((resolve) => {
            const container = document.createElement('div');
            container.id = 'test-yt-container';
            container.style.width = '300px';
            container.style.height = '200px';
            document.body.appendChild(container);

            const logs = [];
            function log(m) { logs.push(m); }

            function initPlayer() {
                log('Calling new YT.Player with videoId and origin...');
                const player = new window.YT.Player('test-yt-container', {
                    videoId: 'cswfR85D7jM',
                    width: '300',
                    height: '200',
                    playerVars: {
                        autoplay: 1,
                        playsinline: 1,
                        enablejsapi: 1,
                        origin: window.location.origin
                    },
                    events: {
                        onReady: (e) => {
                            log('ON_READY fired! typeof playVideo=' + typeof e.target.playVideo);
                            try {
                                e.target.playVideo();
                                log('playVideo called successfully');
                            } catch (err) {
                                log('playVideo err: ' + err.message);
                            }
                        },
                        onStateChange: (e) => {
                            log('ON_STATE_CHANGE: ' + e.data);
                        },
                        onError: (e) => {
                            log('ON_ERROR fired with code: ' + e.data);
                        }
                    }
                });
            }

            if (window.YT && window.YT.Player) {
                initPlayer();
            } else {
                window.onYouTubeIframeAPIReady = () => {
                    log('onYouTubeIframeAPIReady fired');
                    initPlayer();
                };
                const s = document.createElement('script');
                s.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(s);
            }

            setTimeout(() => {
                resolve(logs);
            }, 6000);
        });
    }""")

    print("Proper YT test logs:")
    for l in res:
        print(" ", l)

    browser.close()
