from playwright.sync_api import sync_playwright
from pathlib import Path
import json
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);g=b.new_page(viewport={'width':1440,'height':1000});errors=[];g.on('pageerror',lambda e:errors.append(str(e)))
 g.goto('http://localhost:3000',wait_until='networkidle');assert g.locator('html').get_attribute('lang')=='en'
 g.locator('[data-language=id]').click();g.wait_for_timeout(300);assert g.locator('html').get_attribute('lang')=='id';print(g.locator('main').inner_text()[:700]);assert 'Belajar akuntansi' in g.locator('main').inner_text();assert g.get_by_role('button',name='Ubah tema').count()==1
 g.locator('a[href="/projects"]').first.click();g.wait_for_timeout(500);assert 'Dalam pengembangan' in g.locator('main').inner_text();g.locator('[data-filter="android"]').click();assert g.locator('[data-project-card]:visible').count()==3
 g.locator('a[href="/projects/alhuda"]').click();g.wait_for_timeout(450);assert 'ALASAN PROYEK INI' in g.locator('main').inner_text();assert 'FITUR DALAM PENGEMBANGAN' in g.locator('main').inner_text();assert not g.locator('a[href*="github.com"]').count()
 g.reload(wait_until='networkidle');assert g.locator('html').get_attribute('lang')=='id';g.screenshot(path='checks/bilingual-alhuda-id.png',full_page=True)
 g.locator('[data-language=en]').click();g.wait_for_timeout(250);assert 'WHY THIS PROJECT' in g.locator('main').inner_text();assert 'FEATURES IN DEVELOPMENT' in g.locator('main').inner_text()
 g.goto('http://localhost:3000/chat?lang=id',wait_until='networkidle');g.wait_for_timeout(500);print('CHAT',g.locator('body').inner_text()[:500]);assert 'Halo!' in g.locator('body').inner_text()
 box=g.get_by_placeholder('Tulis pesan atau /play judul lagu');box.fill('progress AlHuda');g.get_by_role('button',name='Kirim pesan').click();g.get_by_text('Terlihat pada kode:',exact=False).wait_for();
 box.fill('/help');g.get_by_role('button',name='Kirim pesan').click();g.get_by_text('Perintah Musik yang Tersedia:',exact=False).wait_for();g.screenshot(path='checks/bilingual-chat-id.png',full_page=True)
 g.locator('[data-language=en]').click();g.wait_for_timeout(400);assert g.get_by_placeholder('Type a message or /play song title').count()==1;assert 'Hi! I’m the portfolio assistant' in g.locator('body').inner_text()
 g.get_by_placeholder('Type a message or /play song title').fill('progress HiFi');g.get_by_role('button',name='Send message').click();g.get_by_text('Present in the code:',exact=False).wait_for()
 for lang in ['en','id']:
  for width in [390,768]:
   g.set_viewport_size({'width':width,'height':844})
   for route in ['/','/about','/projects','/projects/word-academic','/projects/hifi','/projects/linko','/projects/alhuda','/chat']:
    g.goto('http://localhost:3000'+route+'?lang='+lang,wait_until='networkidle');assert not g.evaluate('document.documentElement.scrollWidth>innerWidth'),(route,lang,width)
    assert not g.locator('img').evaluate_all('(imgs)=>imgs.some(i=>!i.complete||!i.naturalWidth)'),route
    assert not g.locator('a[href*="github.com"]').count()
 assert not errors,errors
 Path('checks/bilingual-results.json').write_text(json.dumps({'switch_and_persistence':True,'localized_chat_and_help':True,'story_and_progress':True,'mobile_no_overflow':True,'no_repository_links':True,'errors':errors},indent=2));print('All bilingual tests passed');b.close()
