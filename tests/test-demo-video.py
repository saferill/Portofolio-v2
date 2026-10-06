from playwright.sync_api import sync_playwright
from pathlib import Path
import json
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);g=b.new_page(viewport={'width':1440,'height':1000});g.goto('http://localhost:3000/projects/word-academic');v=g.locator('#demo-video video');v.scroll_into_view_if_needed();v.evaluate('(v)=>v.play()');g.wait_for_timeout(2500)
 result=v.evaluate('(v)=>({currentTime:v.currentTime,duration:v.duration,width:v.videoWidth,height:v.videoHeight,frames:v.getVideoPlaybackQuality().totalVideoFrames,paused:v.paused,error:v.error})');assert result['frames']>5 and result['width']==1080 and result['height']==1920 and result['currentTime']>0 and not result['error']
 v.evaluate('(v)=>v.pause()');g.screenshot(path='checks/demo-fixed-desktop.png')
 response=g.request.get('http://localhost:3000/videos/word-academic-demo-v2.mp4',headers={'Range':'bytes=0-999'});assert response.status==206;assert response.headers['content-type']=='video/mp4';result['range_and_mime']=True
 for width in [390,768]:
  g.set_viewport_size({'width':width,'height':844});assert not g.evaluate('document.documentElement.scrollWidth>innerWidth');v.scroll_into_view_if_needed();assert abs(v.bounding_box()['width']/v.bounding_box()['height']-9/16)<.01
  if width==390:g.screenshot(path='checks/demo-fixed-mobile.png')
 g.goto('http://localhost:3000/projects/coda');assert g.locator('#demo-video').count()==0
 Path('checks/word-academic-demo-results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result));b.close()
