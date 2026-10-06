import {a as React} from './index.CaSDoa4f.js';
const number=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
const M=React.forwardRef(function MusicPlayer(props,ref){
 const callbacks=React.useRef(props);callbacks.current=props;
 const engine=React.useRef({});
 React.useImperativeHandle(ref,()=>engine.current,[]);
 React.useEffect(()=>{
  let current=null,queue=[],history=[],historyIndex=-1,volume=60,token=0,disposed=false,wantsPlay=false,resolving=false,failed=false,nextBusy=false,watchdog,abort;
  const audio=new Audio();audio.preload='auto';audio.volume=volume/100;
  const host=document.querySelector('astro-island[data-astro-transition-persist="dock-and-music"]')||document.body;
  const panel=document.createElement('section');panel.id='music-audio-panel';panel.hidden=true;panel.setAttribute('aria-label','Music player status');
  panel.innerHTML='<div class="audio-panel-heading"><strong>Music player</strong><button type="button" class="audio-dismiss" aria-label="Dismiss message">×</button></div><p role="status" aria-live="polite"></p><div class="audio-panel-actions"><button type="button" class="audio-retry">Play music</button><button type="button" class="audio-alternatives">Other versions</button><button type="button" class="audio-stop">Stop</button><a target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a></div><div class="audio-choices"></div>';
  const style=document.createElement('style');style.textContent='#music-audio-panel{position:fixed;right:20px;bottom:112px;width:340px;max-width:calc(100vw - 24px);z-index:65;padding:14px;border-radius:18px;background:#171717;color:#fff;border:1px solid #414141;box-shadow:0 10px 35px #0003;font:13px Satoshi,system-ui,sans-serif}#music-audio-panel[hidden]{display:none}.audio-panel-heading{display:flex;align-items:center;justify-content:space-between}.audio-panel-heading button{border:0;background:#333;color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer}#music-audio-panel p{margin:10px 0;line-height:1.55}.audio-panel-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.audio-panel-actions button{border:0;border-radius:18px;padding:8px 12px;background:#fff;color:#171717;cursor:pointer}.audio-panel-actions button:disabled{opacity:.5;cursor:wait}.audio-panel-actions a{color:#bbb;text-decoration:underline;font-size:11px}.audio-choices button{display:block;width:100%;text-align:left;padding:10px;margin-top:8px;border:1px solid #444;border-radius:10px;background:#252525;color:white;cursor:pointer}@media(max-width:600px){#music-audio-panel{top:14px;right:12px;bottom:auto}}';
  host.append(style,panel);
  const status=panel.querySelector('[role=status]'),retry=panel.querySelector('.audio-retry'),alternatives=panel.querySelector('.audio-alternatives'),choices=panel.querySelector('.audio-choices'),source=panel.querySelector('a');
  const debug=()=>{window.portfolioMusicDebug={version:'audio-2',trackId:current?.id,playback:'HTMLAudio',playing:!audio.paused&&!audio.ended,currentTime:number(audio.currentTime),duration:number(audio.duration),readyState:audio.readyState,networkState:audio.networkState,mediaError:audio.error?.code||null,resolving,message:status.textContent,source:audio.getAttribute('src')||null};};
  function state(playing){callbacks.current.onPlayStateChange?.(playing);if('mediaSession'in navigator)navigator.mediaSession.playbackState=playing?'playing':'paused';debug();}
  function progress(){callbacks.current.onProgressChange?.(number(audio.currentTime),number(audio.duration)||number(current?.durationSeconds));debug();}
  function message(text,error=false,visible=true){status.textContent=text;if(visible)panel.hidden=false;window.dispatchEvent(new CustomEvent('music-status',{detail:{text,error,track:current}}));debug();}
  function fail(text){failed=true;clearTimeout(watchdog);state(false);retry.disabled=false;retry.textContent='Retry';message(text,true);}
  function readyMessage(){retry.disabled=false;retry.textContent='Play music';message('Audio is ready. Click Play music or the mini-player’s play button to allow playback.');}
  function mediaMetadata(){if(!current||!('mediaSession'in navigator))return;try{navigator.mediaSession.metadata=new MediaMetadata({title:current.title,artist:current.artist,artwork:current.thumbnail?[{src:current.thumbnail}]:[]});}catch{}}
  function watch(request){clearTimeout(watchdog);watchdog=setTimeout(()=>{if(request!==token||disposed||!wantsPlay||failed)return;if(audio.paused||audio.readyState<3)message('Audio has not started. Click Play music; if it stays silent, try another version.');},10000);}
  async function startAudio(request){
   if(!current||resolving)return;
   wantsPlay=true;failed=false;retry.disabled=false;
   try{watch(request);await audio.play();if(request!==token){return;}}
   catch(error){if(request!==token||disposed)return;clearTimeout(watchdog);state(false);if(error.name==='NotAllowedError'){wantsPlay=false;readyMessage();}else if(error.name!=='AbortError'){fail('Could not start audio. '+(error.name==='NotSupportedError'?'The audio source is unavailable or unsupported.':'Try playing again or choose another version.'));}}
  }
  async function play(track,remember=true){
   if(!track?.id||!track.title){fail('Track data is incomplete. Search for the song again.');return;}
   const request=++token;abort?.abort();abort=new AbortController();clearTimeout(watchdog);
   wantsPlay=true;resolving=true;failed=false;audio.pause();audio.removeAttribute('src');audio.load();
   current={...track,durationSeconds:number(track.durationSeconds)};
   if(remember){history=history.slice(0,historyIndex+1);history.push(current);historyIndex=history.length-1;}
   callbacks.current.onTrackChange?.(current);state(false);callbacks.current.onProgressChange?.(0,current.durationSeconds);mediaMetadata();
   choices.replaceChildren();source.hidden=current.id==='local-summer-nights';source.href=current.id==='local-summer-nights'?'#':'https://www.youtube.com/watch?v='+encodeURIComponent(current.id);
   alternatives.hidden=current.id==='local-summer-nights';retry.disabled=true;retry.textContent='Preparing…';message('Preparing audio for '+current.title+'…');
   try{
    let src='/summer-nights.mp3';
    if(current.id!=='local-summer-nights'){
     const response=await fetch('/api/music/resolve?id='+encodeURIComponent(current.id),{signal:abort.signal});const result=await response.json();
     if(!response.ok)throw new Error(result.error||'The audio source is unavailable.');
     if(request!==token||disposed)return;
     if(!/^\/api\/music\/audio\?id=[\w-]{11}$/.test(result.src))throw new Error('Invalid audio URL.');
     src=result.src;current.durationSeconds=number(result.durationSeconds)||current.durationSeconds;
    }
    if(request!==token||disposed)return;
    resolving=false;retry.disabled=false;retry.textContent='Play music';audio.src=src;audio.volume=volume/100;
    callbacks.current.onProgressChange?.(0,current.durationSeconds);
    if(wantsPlay)await startAudio(request);else{audio.load();message('Paused. Audio is ready to play.');}
   }catch(error){if(request!==token||disposed)return;resolving=false;if(error.name!=='AbortError')fail(error.message||'The audio source is unavailable.');}
  }
  function pause(){wantsPlay=false;clearTimeout(watchdog);audio.pause();state(false);}
  function resume(){
   if(!current){message('Choose a song with /play song title.');return;}
   wantsPlay=true;
   if(resolving){message('Audio is being prepared. Playback will start when it is ready.');return;}
   if(failed||!audio.getAttribute('src')){play(current,false);return;}
   startAudio(token);
  }
  function stop(){++token;abort?.abort();clearTimeout(watchdog);wantsPlay=false;resolving=false;failed=false;current=null;queue=[];audio.pause();audio.removeAttribute('src');audio.load();state(false);callbacks.current.onTrackChange?.(null);callbacks.current.onProgressChange?.(0,0);panel.hidden=true;}
  async function next(){
   if(nextBusy)return;nextBusy=true;
   try{
    if(queue.length){await play(queue.shift());return;}
    if(historyIndex<history.length-1){historyIndex++;await play(history[historyIndex],false);return;}
    if(!current)return;
    if(current.id==='local-summer-nights'){pause();message('The queue is empty. Add a song with /queue song title.');return;}
    const request=token;message('Finding the next song…');const response=await fetch('/api/music/search?id='+encodeURIComponent(current.id));const results=await response.json();
    if(request!==token)return;if(!response.ok)throw new Error(results.error||'Recommendations are unavailable.');
    const song=Array.isArray(results)&&results.find(t=>!history.some(h=>h.id===t.id));
    if(song)await play(song);else{pause();message('The queue has ended. Use /queue song title.');}
   }catch(error){message(error.message,true);}finally{nextBusy=false;}
  }
  function seek(seconds){if(!current||resolving)return;const duration=number(audio.duration);if(duration>0){audio.currentTime=Math.min(duration,number(seconds));progress();}}
  function previous(){if(historyIndex>0){historyIndex--;play(history[historyIndex],false);}else seek(0);}
  Object.assign(engine.current,{playTrack:play,queueTrack:track=>{if(!current)play(track);else{queue.push(track);message(track.title+' added to the queue.',false,false);}},pause,resume,stop,next,prev:previous,setVolume:value=>{volume=Math.min(100,number(value));audio.volume=volume/100;},seekTo:seek,setMinimized:()=>{},getMinimized:()=>panel.hidden});
  retry.onclick=resume;panel.querySelector('.audio-stop').onclick=stop;panel.querySelector('.audio-dismiss').onclick=()=>{panel.hidden=true;};
  alternatives.onclick=async()=>{
   if(!current)return;const request=token;alternatives.disabled=true;message('Searching for other versions…');
   try{const response=await fetch('/api/music/search?type=video&q='+encodeURIComponent(current.title+' '+current.artist));const results=await response.json();if(request!==token)return;if(!response.ok)throw new Error(results.error||'Search failed.');choices.replaceChildren();const options=results.filter(t=>t.id!==current.id).slice(0,3);message(options.length?'Choose a version to play.':'No other versions were found.');for(const track of options){const button=document.createElement('button');button.textContent=track.title+' · '+track.artist;button.onclick=()=>play(track);choices.appendChild(button);}}
   catch(error){if(request===token)message(error.message,true);}finally{alternatives.disabled=false;}
  };
  audio.onplaying=()=>{if(!current||!wantsPlay)return;failed=false;clearTimeout(watchdog);state(true);status.textContent=current.title+' · '+current.artist;panel.hidden=true;debug();};
  audio.onpause=()=>{state(false);};
  audio.onwaiting=()=>{state(false);if(current&&!resolving)message('Loading audio…');};
  audio.onstalled=()=>{if(current&&wantsPlay&&!resolving)message('The audio connection is slow. Waiting for data…');};
  audio.onloadedmetadata=()=>{if(current){current.durationSeconds=number(audio.duration)||current.durationSeconds;progress();}};
  audio.ontimeupdate=progress;
  audio.onended=()=>{state(false);next();};
  audio.onerror=()=>{if(current&&!resolving)fail('Audio stream failed to load (code '+(audio.error?.code||'?')+'). Click Retry or choose Other versions.');};
  const interval=setInterval(progress,500);
  if('mediaSession'in navigator){for(const [action,handler]of Object.entries({play:resume,pause,stop,nexttrack:next,previoustrack:previous,seekto:details=>seek(details.seekTime)})){try{navigator.mediaSession.setActionHandler(action,handler);}catch{}}}
  return()=>{disposed=true;++token;abort?.abort();clearTimeout(watchdog);clearInterval(interval);audio.onended=null;audio.onerror=null;audio.onpause=null;audio.ontimeupdate=null;audio.onplaying=null;audio.pause();audio.removeAttribute('src');audio.load();panel.remove();style.remove();};
 },[]);
 return null;
});
export {M};
