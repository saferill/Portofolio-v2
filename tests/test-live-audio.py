from playwright.sync_api import sync_playwright
from pathlib import Path
import json
Path('checks').mkdir(exist_ok=True)
results={}
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''window.__audio=[];const OriginalAudio=window.Audio;window.Audio=function(...args){const a=new OriginalAudio(...args);window.__audio.push(a);return a;};''')
 page.goto('http://localhost:3000/chat',wait_until='networkidle');page.wait_for_timeout(600)
 field=page.locator('input').first
 def command(text):field.fill(text);field.press('Enter')
 command('/play Love Me Not Ravyn Lenae')
 try:
  page.wait_for_function('window.portfolioMusicDebug?.currentTime>2 && window.portfolioMusicDebug?.playing===true',timeout=50000)
 except Exception:
  print('PLAYBACK FAILURE',page.locator('body').inner_text()[-2200:]);print(page.evaluate('window.portfolioMusicDebug'));page.screenshot(path='checks/audio-live-failed.png');raise
 results['love_me_not_actual_playback']=page.evaluate('window.portfolioMusicDebug')
 command('/pause');page.wait_for_function('window.__audio.every(a=>a.paused)');results['pause']=True
 time_before=page.evaluate('window.portfolioMusicDebug.currentTime');page.wait_for_timeout(700);time_after=page.evaluate('window.portfolioMusicDebug.currentTime');results['pause_stops_clock']=abs(time_after-time_before)<.15
 command('/resume');page.wait_for_function('window.portfolioMusicDebug.playing===true');page.wait_for_timeout(600);results['resume']=True
 page.evaluate("window.dispatchEvent(new CustomEvent('music-command',{detail:{command:'seek',value:60}}))")
 page.wait_for_function('window.portfolioMusicDebug.currentTime>=60');results['seek']=page.evaluate('window.portfolioMusicDebug.currentTime')
 command('/volume 35');results['volume']=page.evaluate('window.__audio[0].volume')
 page.locator('a[href="/about"]').click();page.wait_for_timeout(800);results['audio_survives_navigation']=page.evaluate('window.portfolioMusicDebug.playing')
 page.locator('a[href="/chat"]').click();page.wait_for_timeout(800)
 # Expand the original Chat mini player by clicking its song title.
 page.get_by_text('Love Me Not',exact=True).first.click();page.wait_for_timeout(500);page.screenshot(path='checks/audio-live-playing.png',full_page=True)
 command('/queue NIKI Every Summertime');page.get_by_text('➕ Adding',exact=False).wait_for(timeout=25000)
 command('/next');page.wait_for_function("window.portfolioMusicDebug?.trackId==='UyMvBWVGaOA'&&window.portfolioMusicDebug?.playing===true&&window.portfolioMusicDebug?.currentTime>1",timeout=50000)
 results['queue_next_actual_playback']=page.evaluate('window.portfolioMusicDebug')
 command('/prev');page.wait_for_function("window.portfolioMusicDebug?.trackId==='HfpR4tAmI7E'&&window.portfolioMusicDebug?.playing===true&&window.portfolioMusicDebug?.currentTime>1",timeout=50000);results['previous']=True
 command('/stop');page.wait_for_function('window.__audio.every(a=>a.paused)');results['stop']=True
 results['errors']=errors;results['no_iframe']=page.locator('iframe').count()==0
 print(json.dumps(results,indent=2));Path('checks/live-audio-results.json').write_text(json.dumps(results,indent=2));browser.close()
