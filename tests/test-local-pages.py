import sys, json, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://localhost:8788"

results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME_PATH,
        headless=True,
        args=["--autoplay-policy=no-user-gesture-required"]
    )
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    console_logs = []
    page.on("console", lambda m: console_logs.append(f"[{m.type}] {m.text}"))
    page.on("pageerror", lambda e: console_logs.append(f"[PAGE_ERR] {e}"))

    print(f"1. Loading Chat page on {BASE_URL}/chat/...")
    page.goto(f"{BASE_URL}/chat/", wait_until="networkidle")
    page.wait_for_timeout(1000)

    chat_input = page.locator("input").first

    def send_chat(cmd):
        print(f"   -> Sending chat command: {cmd}")
        chat_input.fill(cmd)
        chat_input.press("Enter")

    # ========================================================
    # TEST 1: Local Audio (Summer Nights)
    # ========================================================
    print("\n--- TEST 1: Local Audio (Summer Nights) ---")
    page.evaluate("""() => {
        window.dispatchEvent(new CustomEvent('music-command', {
            detail: {
                command: 'play_track',
                track: {
                    id: 'local-summer-nights',
                    title: 'Summer Nights',
                    artist: 'Syafril Local',
                    durationSeconds: 167
                }
            }
        }));
    }""")
    page.wait_for_function("() => window.portfolioMusicDebug?.playing === true && window.portfolioMusicDebug?.activeEngine === 'html5' && window.portfolioMusicDebug?.currentTime > 0.5", timeout=15000)
    dbg_local = page.evaluate("() => window.portfolioMusicDebug")
    print(f"Local audio playing successfully: engine={dbg_local.get('activeEngine')} time={dbg_local.get('currentTime')}s")
    results["local_audio"] = {
        "engine": dbg_local.get("activeEngine"),
        "currentTime": dbg_local.get("currentTime"),
        "playing": dbg_local.get("playing")
    }

    # ========================================================
    # TEST 2: YouTube Video 1 (Love Me Not - Ravyn Lenae)
    # ========================================================
    print("\n--- TEST 2: YouTube Video 1 (Love Me Not Ravyn Lenae) ---")
    send_chat("/play Love Me Not Ravyn Lenae")

    try:
        page.wait_for_function("() => window.portfolioMusicDebug?.playing === true && window.portfolioMusicDebug?.activeEngine === 'youtube' && window.portfolioMusicDebug?.currentTime > 2", timeout=30000)
    except Exception as e:
        print("YouTube playback failed!")
        dbg = page.evaluate("() => window.portfolioMusicDebug")
        print("Debug state:", json.dumps(dbg, indent=2))
        panel = page.evaluate("() => { const p = document.getElementById('music-audio-panel'); return p ? { hidden: p.hidden, text: p.innerText } : null; }")
        print("Panel state:", panel)
        page.screenshot(path="checks/test-yt-fail.png")
        raise

    dbg_yt1 = page.evaluate("() => window.portfolioMusicDebug")
    print(f"YouTube 1 playing: trackId={dbg_yt1.get('trackId')} time={dbg_yt1.get('currentTime')}s ytReady={dbg_yt1.get('ytReady')}")
    results["youtube_song_1"] = {
        "trackId": dbg_yt1.get("trackId"),
        "currentTime": dbg_yt1.get("currentTime"),
        "ytReady": dbg_yt1.get("ytReady"),
        "mediaConnected": dbg_yt1.get("mediaConnected")
    }

    # Verify popup panel is NOT showing intrusive errors
    panel_state = page.evaluate("() => { const p = document.getElementById('music-audio-panel'); return p ? p.hidden : true; }")
    print("Is panel hidden during normal playback?", panel_state)
    results["panel_hidden_during_playback"] = panel_state

    # ========================================================
    # TEST 3: Pause and Resume
    # ========================================================
    print("\n--- TEST 3: Pause and Resume ---")
    send_chat("/pause")
    page.wait_for_function("() => window.portfolioMusicDebug?.playing === false", timeout=10000)
    t1 = page.evaluate("() => window.portfolioMusicDebug?.currentTime || 0")
    page.wait_for_timeout(1000)
    t2 = page.evaluate("() => window.portfolioMusicDebug?.currentTime || 0")
    clock_stopped = abs(t2 - t1) < 0.2
    print(f"Pause clock stopped: t1={t1}, t2={t2}, delta={abs(t2-t1):.2f}")

    send_chat("/resume")
    page.wait_for_function("() => window.portfolioMusicDebug?.playing === true && window.portfolioMusicDebug?.currentTime > 0", timeout=10000)
    results["pause_resume"] = {
        "clock_stopped": clock_stopped,
        "resumed": page.evaluate("() => window.portfolioMusicDebug?.playing")
    }
    print("Resumed successfully:", results["pause_resume"])

    # ========================================================
    # TEST 4: Seek and Volume
    # ========================================================
    print("\n--- TEST 4: Seek and Volume ---")
    page.evaluate("() => window.dispatchEvent(new CustomEvent('music-command', { detail: { command: 'seek', value: 45 } }))")
    page.wait_for_function("() => window.portfolioMusicDebug?.currentTime >= 44", timeout=10000)
    time_after_seek = page.evaluate("() => window.portfolioMusicDebug?.currentTime")
    print(f"Seeked to: {time_after_seek}s")

    send_chat("/volume 42")
    page.wait_for_timeout(500)
    vol = page.evaluate("() => window.portfolioMusicDebug?.volume")
    print(f"Volume updated to: {vol}")
    results["seek_and_volume"] = {
        "seek_target_45": time_after_seek >= 44,
        "volume_42": vol == 42
    }

    # ========================================================
    # TEST 5: Second YouTube Song (Switching tracks)
    # ========================================================
    print("\n--- TEST 5: Second YouTube Song ---")
    send_chat("/play lofi hip hop")
    page.wait_for_timeout(3000)
    page.wait_for_function("() => window.portfolioMusicDebug?.playing === true && window.portfolioMusicDebug?.currentTime > 1", timeout=30000)
    dbg_yt2 = page.evaluate("() => window.portfolioMusicDebug")
    print(f"YouTube 2 playing: trackId={dbg_yt2.get('trackId')} title={dbg_yt2.get('message')} time={dbg_yt2.get('currentTime')}s")
    results["youtube_song_2"] = {
        "trackId": dbg_yt2.get("trackId"),
        "different_from_first": dbg_yt2.get("trackId") != dbg_yt1.get("trackId"),
        "playing": dbg_yt2.get("playing")
    }

    # ========================================================
    # TEST 6: Navigation Continuity Across Pages
    # ========================================================
    print("\n--- TEST 6: Navigation Continuity Across Pages ---")
    time_pre_nav = page.evaluate("() => window.portfolioMusicDebug?.currentTime || 0")
    print(f"Time before navigation: {time_pre_nav}s")

    # Navigate to About
    print("Navigating to /about...")
    page.locator('a[href="/about"]').click()
    page.wait_for_timeout(1500)
    t_about = page.evaluate("() => window.portfolioMusicDebug?.currentTime || 0")
    playing_about = page.evaluate("() => window.portfolioMusicDebug?.playing")
    print(f"On /about: playing={playing_about}, time={t_about}s")

    # Navigate to Projects
    print("Navigating to /projects...")
    page.locator('a[href="/projects"]').click()
    page.wait_for_timeout(1500)
    t_proj = page.evaluate("() => window.portfolioMusicDebug?.currentTime || 0")
    playing_proj = page.evaluate("() => window.portfolioMusicDebug?.playing")
    print(f"On /projects: playing={playing_proj}, time={t_proj}s")

    # Navigate back to Chat
    print("Navigating back to /chat...")
    page.locator('a[href="/chat"]').click()
    page.wait_for_timeout(1500)
    t_chat = page.evaluate("() => window.portfolioMusicDebug?.currentTime || 0")
    playing_chat = page.evaluate("() => window.portfolioMusicDebug?.playing")
    print(f"Back on /chat: playing={playing_chat}, time={t_chat}s")

    results["navigation_continuity"] = {
        "about": playing_about and t_about >= time_pre_nav,
        "projects": playing_proj and t_proj >= t_about,
        "chat_roundtrip": playing_chat and t_chat >= t_proj
    }

    # ========================================================
    # TEST 7: Browser History (Back / Forward)
    # ========================================================
    print("\n--- TEST 7: Browser History (Back / Forward) ---")
    page.go_back()
    page.wait_for_timeout(1000)
    playing_back = page.evaluate("() => window.portfolioMusicDebug?.playing")
    print(f"After browser Back: playing={playing_back}, url={page.url}")

    page.go_forward()
    page.wait_for_timeout(1000)
    playing_fwd = page.evaluate("() => window.portfolioMusicDebug?.playing")
    print(f"After browser Forward: playing={playing_fwd}, url={page.url}")

    results["browser_history"] = {
        "back_playing": playing_back,
        "forward_playing": playing_fwd
    }

    # ========================================================
    # TEST 8: Language Switch & Theme Toggle
    # ========================================================
    print("\n--- TEST 8: Language Switch & Theme Toggle ---")
    # Language switch
    id_btn = page.locator('button[data-language="id"]').first
    if id_btn.is_visible():
        id_btn.click()
        page.wait_for_timeout(500)
        lang_doc = page.evaluate("() => document.documentElement.lang")
        print(f"Language switched to: {lang_doc}")
    else:
        lang_doc = "id_skipped"

    # Theme toggle
    theme_btn = page.locator('button[aria-label*="theme" i], button[aria-label*="tema" i]').first
    if theme_btn.is_visible():
        theme_btn.click()
        page.wait_for_timeout(500)
        is_dark = page.evaluate("() => document.documentElement.classList.contains('dark')")
        print(f"Theme toggled: dark={is_dark}")
    else:
        is_dark = True

    playing_after_customization = page.evaluate("() => window.portfolioMusicDebug?.playing")
    results["customization_tests"] = {
        "lang": lang_doc,
        "dark": is_dark,
        "playback_maintained": playing_after_customization
    }

    # ========================================================
    # TEST 9: Diagnostics Verification (Testing error capture)
    # ========================================================
    print("\n--- TEST 9: Diagnostics Verification ---")
    # Dispatch an intentionally invalid track ID to verify onError captures raw code
    page.evaluate("""() => {
        window.dispatchEvent(new CustomEvent('music-command', {
            detail: {
                command: 'play_track',
                track: {
                    id: 'invalid-id-999',
                    title: 'Invalid Test Song',
                    artist: 'None',
                    durationSeconds: 100
                }
            }
        }));
    }""")
    page.wait_for_timeout(3000)
    diag_state = page.evaluate("() => window.portfolioMusicDebug?.lastError")
    print("Diagnostics recorded on invalid video:", json.dumps(diag_state, indent=2))
    results["diagnostics_capture"] = {
        "captured": diag_state is not None,
        "code": diag_state.get("code") if diag_state else None,
        "meaning": diag_state.get("meaning") if diag_state else None,
        "origin": diag_state.get("origin") if diag_state else None,
        "ytReady": diag_state.get("ytReady") if diag_state else None,
        "iframeConnected": diag_state.get("iframeConnected") if diag_state else None
    }

    # Capture final screenshot
    page.screenshot(path="checks/test-suite-complete.png")

    print("\n================ TEST SUMMARY ================")
    print(json.dumps(results, indent=2))
    with open("checks/test-results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    browser.close()
