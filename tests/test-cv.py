from pathlib import Path
from playwright.sync_api import sync_playwright
from pypdf import PdfReader
import json
results={}
for lang in ['id','en']:
 r=PdfReader(f'site/documents/syafril-cv-{lang}.pdf');assert len(r.pages)==1
 text=r.pages[0].extract_text();assert '2022' in text and '2023' in text and '2026/2027' in text and 'Universitas Muhammadiyah Jember' in text and 'Medinfo' in text;assert 'github.com' not in text
results['two_one_page_text_pdfs']=True
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);g=b.new_page(viewport={'width':1440,'height':1000});errors=[];g.on('pageerror',lambda e:errors.append(str(e)))
 for lang in ['en','id']:
  g.goto('http://localhost:3000/about?lang='+lang,wait_until='networkidle');assert '2026/2027' in g.locator('main').inner_text()
  assert ('Administration Intern (PKL)' if lang=='en' else 'Peserta PKL — Administrasi') in g.locator('main').inner_text()
  for fmt in ['pdf','docx']:
   link=g.locator(f'[data-cv-format={fmt}]');assert link.get_attribute('href').endswith(f'syafril-cv-{lang}.{fmt}')
   with g.expect_download() as info:link.click()
   download=info.value;assert download.suggested_filename==f'Syafril-CV-{lang.upper()}.{fmt}';assert download.failure() is None
   res=g.request.get('http://localhost:3000/documents/syafril-cv-'+lang+'.'+fmt);assert res.ok;assert res.headers['content-type'].startswith('application/pdf' if fmt=='pdf' else 'application/vnd.openxmlformats')
  answer=g.request.post('http://localhost:3000/api/chat',data={'message':'pengalaman PKL','language':lang}).json()['text'];assert '2022' in answer and 'Medinfo' in answer
  for width in [390,768,1440]:
   g.set_viewport_size({'width':width,'height':1000});assert not g.evaluate('document.documentElement.scrollWidth>innerWidth')
  if lang=='id':g.screenshot(path='checks/about-cv-id.png',full_page=True)
 g.locator('[data-language=en]').click();assert g.locator('[data-cv-format=pdf]').get_attribute('href').endswith('-en.pdf')
 assert not errors,errors;b.close()
results.update({'downloads_pdf_docx_both_languages':True,'experience_in_about_and_faq':True,'responsive_no_overflow':True,'errors':errors});Path('checks/cv-results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
