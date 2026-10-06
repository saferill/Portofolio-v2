import http from 'node:http';
import { createReadStream, statSync, readFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import YTMusic from 'ytmusic-api';
import { resolveAudio, relayAudio } from './music-stream.mjs';
import { profileReply } from './profile-chat.mjs';
const root = fileURLToPath(new URL('./site/', import.meta.url));
const music = new YTMusic();
let initialization;
async function yt() { initialization ??= music.initialize().catch(e => { initialization=null; throw e; }); await initialization; return music; }
const cache = new Map(), inflight = new Map(), rates = new Map(), artworkSources = new Map();
function artwork(id,url){
 try{const parsed=new URL(url);if(parsed.protocol==='https:'&&['yt3.googleusercontent.com','lh3.googleusercontent.com','i.ytimg.com','img.youtube.com'].includes(parsed.hostname)){if(artworkSources.size>=200)artworkSources.delete(artworkSources.keys().next().value);artworkSources.set(id,url);}}catch{}
 return '/api/music/artwork?id='+id;
}
function timeout(p, ms=18000) { let timer; return Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Search timed out. Please try again.')),ms)})]).finally(()=>clearTimeout(timer)); }
async function cached(key, fn) {
 const c=cache.get(key); if(c && c.expires>Date.now()) return c.value;
 if(inflight.has(key)) return inflight.get(key);
 const p=timeout(fn()).then(value=>{ if(cache.size>=200)cache.delete(cache.keys().next().value); cache.set(key,{value,expires:Date.now()+600000}); return value; }).finally(()=>inflight.delete(key));
 inflight.set(key,p);return p;
}
function track(song) {
 if(!song || !/^[\w-]{11}$/.test(song.videoId || ''))return null;
 const raw=typeof song.duration==='string'&&song.duration.includes(':')?song.duration.split(':').reduce((n,v)=>n*60+Number(v),0):Number(song.duration);
 const seconds=Number.isFinite(raw)?Math.max(0,Math.floor(raw)):0;
 const artists=Array.isArray(song.artist)?song.artist:[song.artist];
 return {id:song.videoId,title:song.name||song.title||'YouTube Music',artist:artists.map(a=>a?.name).filter(Boolean).join(', ')||song.artists||'YouTube',durationSeconds:seconds,duration:seconds?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'--:--',thumbnail:artwork(song.videoId,song.thumbnails?.at(-1)?.url||song.thumbnail||`https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`)};
}
function videoId(input) {
 if(/^[\w-]{11}$/.test(input))return input;
 try {const u=new URL(input);if(!['youtube.com','www.youtube.com','music.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname))return null;const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1];return /^[\w-]{11}$/.test(id||'')?id:null;}catch{return null;}
}
function json(res,status,data) { const body=JSON.stringify(data);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Length':Buffer.byteLength(body)});res.end(body); }
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.mp3':'audio/mpeg','.mp4':'video/mp4','.pdf':'application/pdf','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
const server=http.createServer(async(req,res)=>{
 try {
  const u=new URL(req.url,'http://local');
  if(u.pathname==='/api/health')return json(res,200,{ok:true,provider:'ytmusic-api',playback:'HTMLAudio via yt-dlp',version:'audio-2'});
  if(u.pathname==='/api/music/artwork'){
   const id=u.searchParams.get('id');if(!/^[\w-]{11}$/.test(id||''))return json(res,400,{error:'Invalid ID'});
   try{
    const picture=await cached('art:'+id,async()=>{
     const urls=[artworkSources.get(id),`https://i.ytimg.com/vi/${id}/hqdefault.jpg`].filter(Boolean);
     for(const url of urls){try{const response=await fetch(url,{signal:AbortSignal.timeout(8000),redirect:'error'});if(response.ok&&(response.headers.get('content-type')||'').startsWith('image/')){const data=Buffer.from(await response.arrayBuffer());if(data.length<2000000)return {type:response.headers.get('content-type'),data};}}catch{}}
     return {type:'image/svg+xml',data:readFileSync(resolve(root,'images/music-cover.svg'))};
    });
    res.writeHead(200,{'Content-Type':picture.type,'Cache-Control':'public, max-age=3600','Content-Length':picture.data.length});return res.end(picture.data);
   }catch{return json(res,502,{error:'Artwork unavailable'});}
  }
  if(u.pathname==='/api/music/resolve'||u.pathname==='/api/music/audio'){
   if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'GET required'});
   const id=u.searchParams.get('id');if(!/^[\w-]{11}$/.test(id||''))return json(res,400,{error:'Invalid track ID.'});
   const ip=req.socket.remoteAddress;const key='audio:'+ip;const now=Date.now(),rate=rates.get(key);
   if(!rate||rate.until<now)rates.set(key,{count:1,until:now+60000});else if(++rate.count>90)return json(res,429,{error:'Terlalu banyak permintaan audio. Tunggu sebentar.'});
   if(u.pathname==='/api/music/audio')return await relayAudio(id,req,res);
   try{const result=await resolveAudio(id);return json(res,200,{id,src:'/api/music/audio?id='+id,durationSeconds:result.duration,playback:'audio',title:result.title});}
   catch(error){return json(res,502,{error:error.message});}
  }
  if(u.pathname==='/api/music/search') {
   if(req.method!=='GET')return json(res,405,{error:'GET required'});
   const key=req.socket.remoteAddress; const now=Date.now();const rate=rates.get(key);if(!rate||rate.until<now)rates.set(key,{count:1,until:now+60000});else if(++rate.count>45)return json(res,429,{error:'Too many searches. Please wait a moment.'});
   const id=u.searchParams.get('id'),q=(u.searchParams.get('q')||'').trim();
   if(id) {
    if(!/^[\w-]{11}$/.test(id))return json(res,400,{error:'Invalid video ID.'});
    const related=await cached('related:'+id,async()=>{const client=await yt();return (await client.getUpNexts(id)).map(track).filter(t=>t&&t.id!==id).slice(0,12);});
    return json(res,200,related);
   }
   if(!q || q.length>200)return json(res,400,{error:'Enter a song title (up to 200 characters).'});
   if(u.searchParams.get('type')==='video'){
    const results=await cached('videos:'+q.toLowerCase(),async()=>{const client=await yt();return (await client.searchVideos(q)).map(track).filter(Boolean).slice(0,6);});
    return json(res,200,results);
   }
   const result=await cached('search:'+q.toLowerCase(),async()=>{
    const client=await yt();const id=videoId(q);
    if(id){
     try{return track(await client.getSong(id));}catch{
      const response=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+id),{signal:AbortSignal.timeout(7000)});
      if(!response.ok)throw new Error('Video unavailable.');const meta=await response.json();return track({videoId:id,name:meta.title,artist:{name:meta.author_name},thumbnail:meta.thumbnail_url});
     }
    }
    if(/^https?:/i.test(q))throw new Error('Use a song title or a valid YouTube link.');
    const songs=await client.searchSongs(q);const results=songs.map(track).filter(Boolean);
    if(!results.length)results.push(...(await client.searchVideos(q)).map(track).filter(Boolean));
    return results[0]||null;
   });
   if(!result)return json(res,404,{error:'Song not found. Try adding the artist’s name.'});
   return json(res,200,result);
  }
  if(u.pathname==='/api/chat'&&req.method==='POST'){
   let body='';for await(const part of req){body+=part;if(body.length>16000)return json(res,413,{error:'Message is too long.'});}
   let data;try{data=JSON.parse(body);}catch{return json(res,400,{error:'Invalid JSON'});}
   const lang=data.language==='id'?'id':'en';const text=String(data.message||'').trim();const play=text.match(/^(?:tolong\s+)?(?:putar(?:kan|in)?|play|mainkan)(?:\s+(?:lagu|musik))?\s+(.+?)(?:\s+dong)?[.!]?$/i);
   if(play)return json(res,200,{text:lang==='id'?`Mencari ${play[1]}…`:`Searching for ${play[1]}…`,musicAction:{command:'play',query:play[1]}});
   const cmd={'pause':'pause','jeda':'pause','resume':'resume','lanjut':'resume','stop':'stop','berhenti':'stop','next':'next','skip':'next'}[text.toLowerCase()];
   if(cmd)return json(res,200,{text:lang==='id'?'Perintah musik dikirim ke pemutar.':'Music command sent to the player.',musicAction:{command:cmd}});
   const profile=JSON.parse(readFileSync(resolve(root,lang==='id'?'data/profile-id.json':'data/profile.json'),'utf8'));
   return json(res,200,{text:profileReply(text,profile,lang,JSON.parse(readFileSync(resolve(root,'data/project-notes.json'),'utf8'))),musicAction:{command:'none'}});
  }
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed'});
  const name=u.pathname==='/api/projects'?'/api/projects.json':decodeURIComponent(u.pathname);
  let path=resolve(root,'.'+name);if(path!==resolve(root)&&!path.startsWith(resolve(root)+sep))return json(res,403,{error:'Forbidden'});
  let st;try{st=statSync(path);if(st.isDirectory()){path=resolve(path,'index.html');st=statSync(path);}}catch{return json(res,404,{error:'Not found'});}
  if(!st.isFile())return json(res,404,{error:'Not found'});
  const headers={'Content-Type':types[extname(path)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache','Referrer-Policy':'strict-origin-when-cross-origin'};
  let start=0,end=st.size-1,status=200;
  if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m)return json(res,416,{error:'Invalid range'});start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;if(start>end||start>=st.size){res.writeHead(416,{'Content-Range':`bytes */${st.size}`});return res.end();}status=206;headers['Content-Range']=`bytes ${start}-${end}/${st.size}`;}
  headers['Content-Length']=end-start+1;res.writeHead(status,headers);if(req.method==='HEAD')return res.end();createReadStream(path,{start,end}).on('error',()=>res.destroy()).pipe(res);
 }catch(e){console.error('[request]',e.message);if(!res.headersSent)json(res,502,{error:'The music service is unavailable. Please try again shortly.'});else res.end();}
});
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Portfolio + Coda music service listening on 0.0.0.0:'+(process.env.PORT||3000)));
