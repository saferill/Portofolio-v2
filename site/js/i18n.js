import {translate,english} from './i18n-core.js';
const stored=()=>{try{return localStorage.getItem('portfolio-language');}catch{return null;}};
let selected='en';
const baseText=new WeakMap(),baseAttrs=new WeakMap();
let queued=false;
function choose(){const query=new URLSearchParams(location.search).get('lang');return ['en','id'].includes(query)?query:stored()==='id'?'id':'en';}
function text(node){
 const old=baseText.get(node);
 if(!old||node.nodeValue!==old.last)baseText.set(node,{en:english(node.nodeValue),last:node.nodeValue});
 const saved=baseText.get(node),value=translate(saved.en,selected);
 if(node.nodeValue!==value)node.nodeValue=value;
 saved.last=value;
}
function attr(element,key){
 let record=baseAttrs.get(element);if(!record){record={};baseAttrs.set(element,record);}
 const current=element.getAttribute(key);if(current===null)return;
 if(!record[key]||current!==record[key].last)record[key]={en:english(current),last:current};
 const next=translate(record[key].en,selected);if(current!==next)element.setAttribute(key,next);record[key].last=next;
}
function apply(){
 queued=false;
 document.documentElement.lang=selected;
 const roots=[...document.querySelectorAll('main,#pf-contact,.pf-language,#music-audio-panel')];
 for(const root of roots){
  if(root.closest('astro-island')&&root.id!=='music-audio-panel')continue;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('script,style,textarea,[contenteditable],astro-island')&&root.id!=='music-audio-panel'?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  let n;while(n=walker.nextNode())text(n);
  for(const el of [root,...root.querySelectorAll('[aria-label],[title],[placeholder],[alt]')])for(const key of ['aria-label','title','placeholder','alt'])attr(el,key);
  for(const img of root.querySelectorAll('img[src]')){
   let source=img.getAttribute('src').replace('/images/id/','/images/');
   if(source.startsWith('/images/')&&source.endsWith('.svg')&&!source.includes('music-cover')){
    const desired=selected==='id'?source.replace('/images/','/images/id/'):source;
    if(img.getAttribute('src')!==desired)img.setAttribute('src',desired);
   }
  }
 }
 for(const a of document.querySelectorAll('[data-cv-format]')){const format=a.dataset.cvFormat;a.href='/documents/syafril-cv-'+selected+'.'+format;a.download='Syafril-CV-'+selected.toUpperCase()+'.'+format;}
 const title=document.querySelector('title');if(title?.firstChild)text(title.firstChild);
 for(const meta of document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]'))attr(meta,'content');
 document.querySelector('meta[property="og:locale"]')?.setAttribute('content',selected==='id'?'id_ID':'en_US');
 for(const button of document.querySelectorAll('[data-language]'))button.setAttribute('aria-pressed',String(button.dataset.language===selected));
}
function schedule(){if(queued)return;queued=true;queueMicrotask(apply);}
function init(){selected=choose();try{localStorage.setItem('portfolio-language',selected);}catch{}document.documentElement.lang=selected;apply();window.dispatchEvent(new CustomEvent('portfolio-language-change',{detail:{language:selected}}));}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-language]');if(!button)return;
 selected=button.dataset.language;try{localStorage.setItem('portfolio-language',selected);}catch{}
 const url=new URL(location.href);url.searchParams.set('lang',selected);history.replaceState(history.state,'',url);
 document.documentElement.lang=selected;apply();window.dispatchEvent(new CustomEvent('portfolio-language-change',{detail:{language:selected}}));
});
document.addEventListener('astro:after-swap',init);document.addEventListener('astro:page-load',init);
window.addEventListener('popstate',init);
new MutationObserver(records=>{if(records.some(r=>r.type==='characterData'||r.type==='childList'||['title','alt','aria-label','placeholder','src'].includes(r.attributeName)))schedule();}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','alt','aria-label','placeholder','src']});
init();
