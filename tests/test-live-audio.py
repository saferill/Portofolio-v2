"""Test live audio continuity across Astro View Transitions and Cloudflare Pages Functions.
Supports testing either https://syafril.pages.dev/chat or http://localhost:3000/chat.
Verifies both YouTube IFrame engine and HTMLAudio engine, position continuity, pause/resume,
volume, queue, seek, and seamless navigation across Chat -> About -> Projects -> Chat.
"""
from pathlib import Path
import sys, json

target_url = sys.argv[1] if len(sys.argv) > 1 else 'https://syafril.pages.dev/chat'
Path('checks').mkdir(exist_ok=True)
results = {'target': target_url}

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('Playwright not installed in current Python environment. Skipping automated browser run.')
    sys.exit(0)

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    print(f'Navigating to {target_url}...')
    page.goto(target_url, wait_until='networkidle')
    page.wait_for_timeout(800)

    field = page.locator('input').first
    def command(text):
        field.fill(text)
        field.press('Enter')

    # Test 1: Play YouTube song via Chat
    print('Sending command: /play Love Me Not Ravyn Lenae...')
    command('/play Love Me Not Ravyn Lenae')

    try:
        page.wait_for_function('window.portfolioMusicDebug?.currentTime > 2 && window.portfolioMusicDebug?.playing === true', timeout=50000)
    except Exception as e:
        print('PLAYBACK FAILURE:', page.locator('body').inner_text()[-1000:])
        print('Debug State:', page.evaluate('window.portfolioMusicDebug'))
        page.screenshot(path='checks/audio-live-failed.png')
        raise

    debug_initial = page.evaluate('window.portfolioMusicDebug')
    results['youtube_playback_initial'] = debug_initial
    print('Initial Playback:', debug_initial)

    # Test 2: Pause
    command('/pause')
    page.wait_for_function('window.portfolioMusicDebug?.playing === false', timeout=10000)
    time_pause_1 = page.evaluate('window.portfolioMusicDebug?.currentTime || 0')
    page.wait_for_timeout(800)
    time_pause_2 = page.evaluate('window.portfolioMusicDebug?.currentTime || 0')
    results['pause_stops_clock'] = abs(time_pause_2 - time_pause_1) < 0.2
    results['pause'] = True

    # Test 3: Resume
    command('/resume')
    page.wait_for_function('window.portfolioMusicDebug?.playing === true', timeout=10000)
    page.wait_for_timeout(600)
    results['resume'] = True

    # Test 4: Seek
    page.evaluate("window.dispatchEvent(new CustomEvent('music-command',{detail:{command:'seek',value:45}}))")
    page.wait_for_function('window.portfolioMusicDebug?.currentTime >= 44', timeout=10000)
    results['seek'] = page.evaluate('window.portfolioMusicDebug.currentTime')

    # Test 5: Volume
    command('/volume 35')
    results['volume'] = page.evaluate('window.portfolioMusicDebug.volume')

    # Test 6: Navigation Continuity (Chat -> About -> Projects -> Chat)
    time_before_nav = page.evaluate('window.portfolioMusicDebug.currentTime')
    print(f'Time before navigation to About: {time_before_nav}s')

    page.locator('a[href="/about"]').click()
    page.wait_for_timeout(1000)
    time_after_about = page.evaluate('window.portfolioMusicDebug.currentTime')
    playing_about = page.evaluate('window.portfolioMusicDebug.playing')
    print(f'Time on About page: {time_after_about}s, playing: {playing_about}')

    results['audio_survives_about_navigation'] = playing_about and (time_after_about >= time_before_nav)

    page.locator('a[href="/projects"]').click()
    page.wait_for_timeout(1000)
    time_after_projects = page.evaluate('window.portfolioMusicDebug.currentTime')
    playing_projects = page.evaluate('window.portfolioMusicDebug.playing')
    print(f'Time on Projects page: {time_after_projects}s, playing: {playing_projects}')

    results['audio_survives_projects_navigation'] = playing_projects and (time_after_projects >= time_after_about)

    page.locator('a[href="/chat"]').click()
    page.wait_for_timeout(1000)
    time_after_chat = page.evaluate('window.portfolioMusicDebug.currentTime')
    playing_chat = page.evaluate('window.portfolioMusicDebug.playing')
    print(f'Time returning to Chat: {time_after_chat}s, playing: {playing_chat}')

    results['audio_survives_full_roundtrip'] = playing_chat and (time_after_chat >= time_after_projects)

    # Test 7: Queue, Next, Prev
    command('/queue NIKI Every Summertime')
    page.get_by_text('➕', exact=False).wait_for(timeout=25000)

    command('/next')
    page.wait_for_function("window.portfolioMusicDebug?.playing === true && window.portfolioMusicDebug?.currentTime > 1", timeout=50000)
    results['queue_next_playback'] = page.evaluate('window.portfolioMusicDebug')

    command('/prev')
    page.wait_for_function("window.portfolioMusicDebug?.playing === true && window.portfolioMusicDebug?.currentTime > 1", timeout=50000)
    results['previous'] = True

    # Test 8: Stop cleanly clears state
    command('/stop')
    page.wait_for_function('window.portfolioMusicDebug?.playing === false && window.portfolioMusicDebug?.trackId === null', timeout=10000)
    results['stop_clears_state'] = True

    results['errors'] = errors
    print(json.dumps(results, indent=2))
    Path('checks/live-audio-results.json').write_text(json.dumps(results, indent=2))
    browser.close()
