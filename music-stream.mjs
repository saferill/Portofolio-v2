import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
const run=promisify(execFile);
const cache=new Map(),pending=new Map();
let active=0;
const ID=/^[A-Za-z0-9_-]{11}$/;
function validStream(url){const u=new URL(url);if(u.protocol!=='https:'||!u.hostname.endsWith('.googlevideo.com')||u.port)throw new Error('Unsupported audio source.');return u.href;}
export async function resolveAudio(id,refresh=false){
 if(!ID.test(id||''))throw new Error('Invalid track ID.');
 const hit=cache.get(id);if(!refresh&&hit&&hit.expires>Date.now())return hit;
 if(pending.has(id))return pending.get(id);
 if(active>=3)throw new Error('The music server is busy. Please try again shortly.');
 const task=(async()=>{
  active++;
  try{
   const python=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
   const {stdout}=await run(python,['-m','yt_dlp','--skip-download','--no-playlist','--no-warnings','--socket-timeout','12','--retries','0','--extractor-retries','0','--format','bestaudio[ext=m4a]/bestaudio','--dump-single-json','--',`https://www.youtube.com/watch?v=${id}`],{timeout:30000,maxBuffer:12*1024*1024,windowsHide:true});
   const data=JSON.parse(stdout);
   if(!data.url||data.is_live||data.vcodec!=='none')throw new Error('No supported audio stream is available for this song.');
   const url=validStream(data.url);
   const expiresParam=Number(new URL(url).searchParams.get('expire'))*1000;
   const expires=Math.min(Date.now()+240000,expiresParam>0?expiresParam-60000:Infinity);
   const result={url,expires,duration:Number(data.duration)||0,title:data.title||'',mime:data.ext==='m4a'?'audio/mp4':data.ext==='webm'?'audio/webm':'application/octet-stream',headers:{'User-Agent':data.http_headers?.['User-Agent']||'Mozilla/5.0'}};
   if(cache.size>=50)cache.delete(cache.keys().next().value);
   cache.set(id,result);return result;
  }catch(error){
   const detail=String(error.stderr||error.message||'');
   console.error('[audio-resolve]',id,detail.slice(-600));
   if(/No module named|ENOENT/.test(detail))throw new Error('The audio engine is not installed. Run pip install -r requirements.txt.');
   if(/Sign in|confirm|not a bot|private|members.only|age.restrict/i.test(detail))throw new Error('The audio source requires verification or restricts access. Choose another song.');
   if(error.killed)throw new Error('The audio source timed out. Please try again.');
   throw new Error('The audio source is unavailable. Choose another version or try again later.');
  }finally{active--;}
 })();
 pending.set(id,task);try{return await task;}finally{pending.delete(id);}
}
export async function relayAudio(id,req,res){
 const controller=new AbortController();
 res.once('close',()=>controller.abort());
 const range=req.headers.range;
 if(range&&!/^bytes=(?:\d+-\d*|-\d+)$/.test(range)){res.writeHead(416);res.end();return;}
 let upstream;
 try{
  for(let attempt=0;attempt<2;attempt++){
   const data=await resolveAudio(id,attempt===1);
   upstream=await fetch(data.url,{method:req.method==='HEAD'?'HEAD':'GET',headers:{...data.headers,...(range?{Range:range}:{})},redirect:'error',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])});
   if(attempt===0&&[403,410].includes(upstream.status)){await upstream.body?.cancel();cache.delete(id);continue;}
   if(upstream.status===416){res.writeHead(416,{'Content-Range':upstream.headers.get('content-range')||'bytes */*'});await upstream.body?.cancel();res.end();return;}
   if(!upstream.ok)throw new Error('The audio server rejected playback. Try another version of the song.');
   const headers={'Content-Type':upstream.headers.get('content-type')||data.mime,'Accept-Ranges':'bytes','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
   for(const key of ['content-length','content-range'])if(upstream.headers.has(key))headers[key]=upstream.headers.get(key);
   res.writeHead(upstream.status,headers);
   if(req.method==='HEAD'){await upstream.body?.cancel();res.end();return;}
   await pipeline(Readable.fromWeb(upstream.body),res);return;
  }
 }catch(error){
  if(controller.signal.aborted)return;
  if(!res.headersSent){res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message||'Audio unavailable.'}));}else res.destroy();
 }finally{controller.abort();}
}
