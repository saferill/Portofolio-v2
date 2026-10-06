from playwright.sync_api import sync_playwright
from pathlib import Path
import json
base='http://localhost:3000';projects=json.loads(Path('site/data/profile.json').read_text())['projects'];results={}
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox']);g=b.new_page(viewport={'width':1440,'height':1000});errors=[];g.on('pageerror',lambda e:errors.append(str(e)))
 g.goto(base,wait_until='networkidle');g.wait_for_timeout(700)
 assert g.locator('main a[href^="/projects/"]').evaluate_all('(a)=>a.map(x=>x.getAttribute("href"))')==['/projects/word-academic','/projects/coda','/projects/safevideos']
 g.screenshot(path='checks/catalog-home.png',full_page=True)
 g.goto(base+'/projects',wait_until='networkidle');g.wait_for_timeout(600);g.screenshot(path='checks/catalog-projects.png',full_page=True)
 assert g.locator('[data-project-card]').count()==7
 for category,expected in [('web',3),('desktop',3),('android',3),('all',7)]:
  g.locator(f'[data-filter="{category}"]').click();assert g.locator('[data-project-card]:visible').count()==expected
  g.reload(wait_until='networkidle');assert g.locator('[data-project-card]:visible').count()==expected
 g.locator('[data-filter="web"]').click();g.locator('[data-filter="android"]').click();g.go_back();g.wait_for_timeout(500);assert g.locator('[data-filter="web"]').get_attribute('aria-pressed')=='true';assert g.locator('[data-project-card]:visible').count()==3
 g.goto(base+'/projects?category=wrong',wait_until='networkidle');assert g.locator('[data-project-card]:visible').count()==7
 results['filters_click_reload_back_invalid']=True
 for project in projects:
  g.goto(base+'/projects/'+project['slug'],wait_until='networkidle');assert g.locator('h1').inner_text()==project['title']
  if project['status']=='development':assert g.locator('#project-live-link').count()==0;assert 'Not released yet' in g.locator('main').inner_text()
  else:assert g.locator('#project-live-link').get_attribute('href')==project['url']
  if project['slug'] in ['coda','hifi']:g.wait_for_timeout(650);g.screenshot(path=f'checks/catalog-{project["slug"]}.png',full_page=True)
 results['seven_details_four_active_three_development']=True
 api=g.request.get(base+'/api/projects').json();assert len(api)==7
 results['projects_api']=True
 g.goto(base+'/chat',wait_until='networkidle');g.wait_for_timeout(600);assert 'Syafril Assistant' in g.locator('body').inner_text();assert 'Panji' not in g.locator('body').inner_text()
 results['chat_identity']=True;results['page_errors']=errors;assert not errors
 b.close()
Path('checks/catalog-results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
