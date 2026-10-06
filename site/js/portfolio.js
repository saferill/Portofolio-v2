// Interactions only. Page geometry and typography are the original reference layout.
let track=null,playing=false,returnFocus=null;
const PLAY='<svg class="pf-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>';
const PAUSE='<svg class="pf-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z"/></svg>';
function refreshMusic(){
 const active=track?.id==='local-summer-nights'&&playing;
 for(const button of document.querySelectorAll('[data-music-toggle]')){
  button.querySelector('[data-music-icon]').innerHTML=active?PAUSE:PLAY;
  const title=active?'Pause Summer Nights':'Play Summer Nights';button.title=title;button.setAttribute('aria-label',title);
 }
}
function closeContact(){const dialog=document.getElementById('pf-contact');dialog?.close();document.body.style.overflow='';if(returnFocus?.isConnected)returnFocus.focus();}
document.addEventListener('click',event=>{
 const imageButton=event.target.closest('[data-gallery-index]');
 if(imageButton){const gallery=imageButton.closest('[data-gallery]');const index=Number(imageButton.dataset.galleryIndex);gallery.querySelector('[data-gallery-track]').style.transform=`translateY(-${index*100}%)`;for(const b of gallery.querySelectorAll('[data-gallery-index]'))b.setAttribute('aria-pressed',String(b===imageButton));return;}
 const filter=event.target.closest('[data-filter]');
 if(filter){applyFilter(filter.dataset.filter);const url=new URL(location.href);if(filter.dataset.filter==='all')url.searchParams.delete('category');else url.searchParams.set('category',filter.dataset.filter);history.pushState(history.state,'',url);return;}

 const open=event.target.closest('[data-contact-open]');
 if(open){returnFocus=open;const dialog=document.getElementById('pf-contact');if(dialog){dialog.showModal();document.body.style.overflow='hidden';}return;}
 if(event.target.closest('[data-contact-close]')){closeContact();return;}
 if(event.target.id==='pf-contact'){
  const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeContact();return;
 }
 if(event.target.closest('[data-music-toggle]')){
  const detail=track?.id==='local-summer-nights'?{command:playing?'pause':'resume'}:{command:'play_track',track:{id:'local-summer-nights',title:'Summer Nights',artist:'Myla',duration:'3:12',durationSeconds:192,thumbnail:'/images/music-cover.svg'}};
  window.dispatchEvent(new CustomEvent('music-command',{detail}));
 }
});
document.addEventListener('close',event=>{if(event.target.id==='pf-contact')document.body.style.overflow='';},true);
document.addEventListener('cancel',event=>{if(event.target.id==='pf-contact')document.body.style.overflow='';},true);
window.addEventListener('music-track-change',event=>{track=event.detail.track;refreshMusic();});
window.addEventListener('music-state-change',event=>{playing=event.detail.playing;refreshMusic();});
function applyFilter(category){
 const buttons=[...document.querySelectorAll('[data-filter]')];
 if(!buttons.length)return;
 if(!buttons.some(b=>b.dataset.filter===category))category='all';
 for(const b of buttons){const active=b.dataset.filter===category;b.setAttribute('aria-pressed',String(active));b.classList.toggle('text-foreground',active);b.classList.toggle('text-muted',!active);b.classList.toggle('font-bold',active);b.querySelector('[data-active-line]').hidden=!active;}
 for(const card of document.querySelectorAll('[data-project-card]'))card.hidden=category!=='all'&&!card.dataset.categories.split(' ').includes(category);
}
window.addEventListener('popstate',()=>applyFilter(new URLSearchParams(location.search).get('category')||'all'));
function init(){applyFilter(new URLSearchParams(location.search).get('category')||'all');refreshMusic();window.dispatchEvent(new CustomEvent('music-request-state'));}
document.addEventListener('astro:page-load',init);
document.addEventListener('astro:before-swap',()=>{document.body.style.overflow='';});
init();
