from pathlib import Path
from playwright.sync_api import sync_playwright
import json
Path('checks').mkdir(exist_ok=True)
results={}
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto('http://localhost:3000',wait_until='networkidle');page.wait_for_timeout(900)
 assert page.locator('.pf-topline,.pf-footer,.pf-home-grid,.pf-feature,.pf-hero-title').count()==0
 assert page.locator('h2').first.evaluate('(e)=>getComputedStyle(e).fontSize')=='36px'
 results['original_home_type_and_no_new_shell']=True
 results['three_original_image_cards']=page.locator('main a[href^="/projects/"]').count()==3
 page.get_by_role('button',name='Get in Touch',exact=True).click();page.locator('dialog[open]').wait_for();results['contact_links']=page.locator('dialog a').evaluate_all('(a)=>a.map(e=>e.href)');page.keyboard.press('Escape');assert not page.locator('dialog').is_visible()
 page.get_by_role('button',name='Toggle theme').click();assert 'dark' in page.locator('html').get_attribute('class');page.get_by_role('button',name='Toggle theme').click();results['theme']=True
 page.locator('a[href="/about"]').first.click();page.wait_for_timeout(800);assert 'SMK Nurul Jadid' in page.locator('main').inner_text();assert page.locator('main figure').count()==0
 page.locator('a[href="/projects"]').first.click();page.wait_for_timeout(800);assert page.locator('main a[href="/projects/word-academic"]').count()==1
 page.get_by_role('button',name='Desktop',exact=True).click();assert page.get_by_role('button',name='Desktop',exact=True).get_attribute('aria-pressed')=='true';results['project_filter']=True
 page.locator('main a[href="/projects/word-academic"]').click();page.wait_for_timeout(800);page.get_by_role('button',name='View image 2',exact=True).click();results['gallery']=page.locator('[data-gallery-track]').evaluate('(e)=>e.style.transform')=='translateY(-100%)'
 assert page.locator('#project-live-link').get_attribute('href')=='https://lynk.id/wordacademic'
 for width in [390,768]:
  page.set_viewport_size({'width':width,'height':844})
  for path in ['/','/about','/projects','/projects/word-academic','/projects/coda','/projects/tempmail-pro','/projects/safevideos','/projects/hifi','/projects/linko','/projects/alhuda','/chat']:
   page.goto('http://localhost:3000'+path,wait_until='networkidle');page.wait_for_timeout(650);assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,path)
   assert not page.locator('img').evaluate_all('(imgs)=>imgs.some(i=>!i.complete||i.naturalWidth===0)'),path
   assert 'Panji' not in page.locator('body').inner_text()
   if width==390:page.screenshot(path='checks/restored-mobile-'+(path.strip('/').replace('/','-')or'home')+'.png',full_page=True)
 results['responsive_no_overflow_no_broken_images']=True;results['errors']=errors
 print(json.dumps(results,indent=2));Path('checks/restored-layout-results.json').write_text(json.dumps(results,indent=2));b.close()
