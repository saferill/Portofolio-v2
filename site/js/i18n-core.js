import {strings} from './i18n-strings.js';
export function language(){return typeof document!=='undefined'&&document.documentElement.lang==='id'?'id':'en';}
const inverse=Object.fromEntries(Object.entries(strings).map(([en,id])=>[id,en]));
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=[];
for(const [en,id] of Object.entries(strings)){
 if(!en.includes('${'))continue;
 const names=[...en.matchAll(/\$\{([^}]+)\}/g)].map(m=>m[1]);
 const parts=en.split(/\$\{[^}]+\}/g);
 patterns.push({regex:new RegExp('^'+parts.map(escape).join('([\\s\\S]*?)')+'$'),names,id});
}
export function translate(text,lang=language()){
 if(typeof text!=='string')return text;
 if(lang==='en')return text; // Stored messages retain the language in which they were sent.
 if(Object.hasOwn(strings,text))return strings[text];
 for(const p of patterns){const m=text.match(p.regex);if(m)return p.id.replace(/\$\{([^}]+)\}/g,(all,key)=>{const i=p.names.indexOf(key);return i<0?all:m[i+1];});}
 if(text.includes('\n'))return text.split('\n').map(line=>translate(line,lang)).join('\n');
 const m=text.match(/^(\s*(?:•\s*)?)(.*?)(\s*)$/s);
 if(m&&Object.hasOwn(strings,m[2]))return m[1]+strings[m[2]]+m[3];
 return text;
}
export function english(text){return inverse[text]||text;}
export function useLanguage(React){
 const [,refresh]=React.useState(0);
 React.useEffect(()=>{const changed=()=>refresh(n=>n+1);window.addEventListener('portfolio-language-change',changed);return()=>window.removeEventListener('portfolio-language-change',changed);},[]);
}
