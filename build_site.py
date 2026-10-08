from pathlib import Path
from string import Template
import json, html

ROOT=Path(__file__).parent; SITE=ROOT/'site'; SRC=ROOT/'source'
p=json.loads((SITE/'data/profile.json').read_text(encoding='utf-8')); e=html.escape
values={k.upper():e(str(v)) for k,v in p.items() if isinstance(v,str)}
values.update({'SCHOOL_MAJOR':e(p['schoolMajor']),'PROJECT_DESCRIPTION':e(p['project']['description']),'PROJECT_URL':e(p['project']['url'])})
values['SKILL_PILLS']=''.join(f'<div class="group flex items-center gap-x-1.5 px-3 py-1.5 rounded-full border border-border hover:bg-foreground/4 cursor-default transition-all duration-200"><span>{e(skill)}</span></div>' for skill in p['skills'])
projects=p['projects']
notes=json.loads((SITE/'data/project-notes.json').read_text(encoding='utf-8'))
translations=json.loads((SITE/'data/locales-id.json').read_text(encoding='utf-8'))
for note in notes.values():
 for field in ['story','focus','statusText']:
  translations[note[field]['en']]=note[field]['id']
 for group in note.get('progress',{}).values():
  translations.update(zip(group['en'],group['id']))
(SITE/'js/i18n-strings.js').write_text('export const strings = '+json.dumps(translations,ensure_ascii=False,indent=2)+';\n', encoding='utf-8')

def fragment(name, data):
 return Template((SRC/'pages'/f'{name}.html').read_text(encoding='utf-8')).substitute(data)
def project_values(project):
 v=values.copy()
 for key,value in project.items():
  if isinstance(value,str):v['PROJECT_'+key.upper()]=e(value)
 v['PROJECT_URL']=e(project.get('url') or '')
 v['PROJECT_STATUS_CODE']=project['status']
 v['PROJECT_STATUS']='Available' if project['status']=='available' else 'In development'
 v['PROJECT_FILTERS']=' '.join(project['filters'])
 v['PROJECT_FEATURES']='\n'.join('• '+e(f) for f in project['features'])
 v['FEATURES_HEADING']='Key Features' if project['status']=='available' else 'Features in Development'
 v['FEATURE_ITEMS']=''.join('<li>'+e(item)+'</li>' for item in project['features'])
 v['PROJECT_ACTION']=fragment('project-action',v) if project.get('url') else '<span class="inline-flex items-center gap-x-2 px-6 py-3 rounded-full border border-border text-muted text-[11px] font-bold">Not released yet</span>'
 note=notes.get(project['slug'],{})
 v['PROJECT_STORY']=e(note.get('story',{}).get('en',''))
 v['PROJECT_FOCUS']=e(note.get('focus',{}).get('en',''))
 v['PROJECT_STATUSTEXT']=e(note.get('statusText',{}).get('en',project['access']))
 v['PROJECT_PENDING']=''
 if 'progress' in note:
  for key in ['implemented','unverified']:
   v['PROGRESS_'+key.upper()]=''.join('<li>'+e(item)+'</li>' for item in note['progress'][key]['en'])
  v['PROJECT_PENDING']='<h3 class="text-xs font-bold text-foreground">Still to Build or Validate</h3><ul class="pf-progress-list">'+v['PROGRESS_UNVERIFIED']+'</ul>'
 v['PROJECT_DEMO']='' 
 demo=project.get('demo')
 if demo and demo.get('provider')=='local':
  v['DEMO_SRC']=e(demo['src'])
  v['DEMO_VIEW_URL']=e(demo['url'])
  v['PROJECT_DEMO']=fragment('project-demo',v)
 slides=[];buttons=[]
 for i,image in enumerate(project['gallery']):
  g={'GALLERY_IMAGE':e(image),'GALLERY_ALT':e(project['title']+' — '+project['visualNote']),'GALLERY_INDEX':i,'GALLERY_NUMBER':i+1,'GALLERY_PRESSED':str(i==0).lower()}
  slides.append(fragment('gallery-slide',g))
  if len(project['gallery'])>1:buttons.append(fragment('gallery-button',g))
 v['GALLERY_SLIDES']=''.join(slides);v['GALLERY_BUTTONS']=''.join(buttons)
 return v
values['PROJECT_CARDS']=''.join(fragment('project-card',project_values(project)) for project in projects)
for i,project in enumerate(x for x in projects if x.get('featured')):
 for key in ['slug','title','thumbnail']:values[f'FEATURED_{i}_{key.upper()}']=e(project[key])
values['CV_DOWNLOADS']=fragment('cv-downloads',values)
experience_items=[]
for item in p.get('experience',[]):
 bullets=''.join('<li>'+e(x)+'</li>' for x in item['details'])
 experience_items.append('<article class="space-y-3"><h3 class="text-sm font-bold text-foreground">'+e(item['role'])+'</h3><p class="text-sm text-foreground">'+e(item['organization'])+'</p><p class="text-xs text-muted">'+e(item['period'])+'</p><ul class="pf-progress-list text-sm leading-relaxed text-muted">'+bullets+'</ul></article>')
values['EXPERIENCE_ITEMS']=''.join(experience_items)
values['EXPERIENCE_SECTION']=fragment('experience',values) if experience_items else ''
runtime=(SRC/'astro-runtime.html').read_text(encoding='utf-8')
contact=Template((SRC/'contact.html').read_text(encoding='utf-8')).substitute(values)
def render(page,path,title,desc,page_values=None):
 content=(SRC/'chat-island.html').read_text(encoding='utf-8') if page=='chat' else Template((SRC/'pages'/f'{page}.html').read_text(encoding='utf-8')).substitute(page_values or values)
 person={'@context':'https://schema.org','@type':'Person','name':p['name'],'email':p['email'],'sameAs':[p['instagram']],'alumniOf':{'@type':'EducationalOrganization','name':p['school']},'affiliation':{'@type':'CollegeOrUniversity','name':p['university']}}
 canonical=f"https://syafril.my.id/{path + ('/' if path else '')}"
 keywords='Moch. Syafril Ramadhani, Syafril Ramadhani, Syafril, safe_rill, saferill, Portfolio, Web Developer, Android Developer, UNU Yogyakarta, Akuntansi, Multimedia, Coda, TempMail Pro, HiFi, SafeVideos'
 head=f'''<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><meta name="description" content="{e(desc)}"><meta name="keywords" content="{e(keywords)}"><meta name="author" content="{e(p['name'])}"><meta name="theme-color" content="#ececea"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="canonical" href="{canonical}"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:type" content="website"><meta property="og:locale" content="en_US"><meta property="og:url" content="{canonical}"><meta property="og:site_name" content="Syafril — Portfolio"><meta property="og:image" content="/images/syafril-portrait.webp"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/assets/7a779bf34a7f.css"><link rel="stylesheet" href="/_astro/Layout.BZ1HocBq.css"><link rel="stylesheet" href="/portfolio.css?v=cv2"><meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback" content="animate"><script type="module" src="/_astro/ClientRouter.astro_astro_type_script_index_0_lang.CAqDO0tx.js"></script><script>try{{const q=new URLSearchParams(location.search).get("lang"),l=q==="en"||q==="id"?q:localStorage.getItem("portfolio-language");document.documentElement.lang=l==="id"?"id":"en";}}catch{{}}function applyTheme(){{try{{let t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches));}}catch{{}}}}applyTheme();document.addEventListener('astro:after-swap',applyTheme);</script><script type="application/ld+json">{json.dumps(person,ensure_ascii=False)}</script><script type="module" src="/js/portfolio.js"></script><script type="module" src="/js/i18n.js"></script>'''
 dest=SITE/path/'index.html';dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(f'<!DOCTYPE html><html lang="en"><head>{head}</head><body class="antialiased">{runtime}<nav class="pf-language" aria-label="Language"><button type="button" data-language="en" aria-label="English" aria-pressed="true" lang="en">EN</button><span aria-hidden="true">/</span><button type="button" data-language="id" aria-label="Bahasa Indonesia" aria-pressed="false" lang="id">ID</button></nav>{content}{contact if page!="chat" else ""}</body></html>', encoding='utf-8')
render('home','','Moch. Syafril Ramadhani — Portfolio','Syafril’s portfolio: an Accounting student at UNU Yogyakarta with a Multimedia background and projects for web, desktop, and Android.')
render('about','about','About — Moch. Syafril Ramadhani','Profile, education, and skills of Moch. Syafril Ramadhani.')
render('projects','projects','Projects — Moch. Syafril Ramadhani','Explore Syafril’s web, desktop, and Android projects, including available apps and work in development.')
for project in projects:
 render('project','projects/'+project['slug'],project['title']+' — Moch. Syafril Ramadhani',project['description'],project_values(project))
render('chat','chat','Chat & Music — Moch. Syafril Ramadhani','Ask about Syafril and his projects, or play music using chat commands.')
api=[{**project,'short_description':project['description'],'project_url':project['url'],'is_hidden':False,'client':'Personal project','gallery':json.dumps(project['gallery']),'position':i} for i,project in enumerate(projects)]
(SITE/'api/projects.json').write_text(json.dumps(api,ensure_ascii=False,indent=2), encoding='utf-8')

# Generate SEO Sitemap & Robots.txt
sitemap_pages = [("", "1.0", "weekly"), ("about/", "0.9", "monthly"), ("projects/", "0.9", "weekly"), ("chat/", "0.8", "monthly")]
for prj in projects:
 sitemap_pages.append((f"projects/{prj['slug']}/", "0.8", "monthly"))

entries = [f'  <url>\n    <loc>https://syafril.my.id/{u}</loc>\n    <changefreq>{freq}</changefreq>\n    <priority>{prio}</priority>\n  </url>' for u, prio, freq in sitemap_pages]
sitemap_content = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(entries) + '\n</urlset>\n'
(SITE/'sitemap.xml').write_text(sitemap_content, encoding='utf-8')

robots_content = "User-agent: *\nAllow: /\n\nSitemap: https://syafril.my.id/sitemap.xml\nSitemap: https://syafril.pages.dev/sitemap.xml\n"
(SITE/'robots.txt').write_text(robots_content, encoding='utf-8')

print(f'Built {4+len(projects)} pages, sitemap.xml, robots.txt, with SEO tags and {len(projects)} projects.')

