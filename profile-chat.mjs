// Rule-based portfolio FAQ. English replies; English and Indonesian keywords supported.
export function profileReply(message, p, lang="en", notes={}){
 const query=String(message).toLowerCase();
 if(/\bcv\b|\bresume\b|curriculum vitae/.test(query))return lang==='id'?`[Unduh CV (PDF)](${p.cv.pdf}) · [Versi Word](${p.cv.docx})`:`[Download CV (PDF)](${p.cv.pdf}) · [Word version](${p.cv.docx})`;
 if(/experience|pengalaman|internship|\bpkl\b|medinfo|organisasi|organization/.test(query))return p.experience.map(x=>`**${x.role}**\n${x.organization}\n${x.period}\n${x.details.map(d=>'- '+d).join('\n')}`).join('\n\n')+(lang==='id'?'\n\n[Lihat profil](/about)':'\n\n[View profile](/about)');
 if(lang==="id")return profileReplyId(message,p,notes);
 const text=String(message).toLowerCase();
 const projects=p.projects||[p.project];
 const aliases={'word-academic':/word\s*academic|add.in|skripsi|thesis/,'tempmail-pro':/temp\s*mail|email sementara|temporary email/,'coda':/\bcoda\b/,'safevideos':/safe\s*videos?|downloader/,'hifi':/\bhi[ -]?fi\b/,'linko':/\blinko\b|berbagi file|file.sharing/,'alhuda':/al[ -]?huda|ad[zh]an|qur.?an/};
 const matched=projects.filter(project=>aliases[project.slug]?.test(text));
 if(matched.length)return matched.map(project=>{
  const dev=project.status==='development';
  const note=notes[project.slug];
  if(note && /progress|status|development|perkembangan/.test(text) && note.progress)return `**${project.title} — In development**\n\nPresent in the code:\n${note.progress.implemented.en.map(x=>'- '+x).join('\n')}\n\nPending or not yet verified:\n${note.progress.unverified.en.map(x=>'- '+x).join('\n')}\n\nBased on code inspection, not a tested release. [View details](/projects/${project.slug})`;
  if(note && /why|story|reason|cerita|kenapa|alasan/.test(text))return note.story.en+`\n\n[View details](/projects/${project.slug})`;

  return `**${project.title}** — ${dev?'In development':'Available'}\n\n${project.description}\n\nPlatform: **${project.platform}**.\n\n[View details](/projects/${project.slug})${dev?' · Not released yet; download links are not available in this portfolio.':` · [Open ${project.title}](${project.url})`}${project.demo?'\n\n[Watch the demo](/projects/'+project.slug+'#demo-video)':''}${!dev&&/price|cost|buy|licen[cs]e|compatib|harga|paket|beli|lisensi|kompatib/.test(text)?'\n\nVisit the official project page for current access options and terms.':''}`;
 }).join('\n\n---\n\n');
 if(/proyek|project|aplikasi|\bapps?\b|download|unduh|access|akses|price|cost|buy|harga|paket|beli|licen[cs]e|lisensi|compatib|kompatib/.test(text))return `Here are Syafril’s projects:\n${projects.map(x=>`- [${x.title}](/projects/${x.slug}) — ${x.status==='development'?'In development':'Available'} (${x.platform})`).join('\n')}\n\nMention a project name for details and access links. [View all projects](/projects)`;
 if(/contact|reach|kontak|hubungi|whatsapp|wa\b|email|instagram|social|sosial/.test(text))return `You can reach Syafril through:\n- [Email: ${p.email}](mailto:${p.email})\n- [WhatsApp: ${p.phoneDisplay}](${p.whatsapp})\n- [Instagram: @${p.handle}](${p.instagram})`;
 if(/education|study|student|college|university|school|major|pendidikan|kuliah|universitas|kampus|jurusan|sekolah|smk/.test(text))return `Syafril is currently studying **${p.major} at ${p.university}**. He previously studied **${p.schoolMajor} at ${p.school}**.\n\n[View the About page](/about)`;
 if(/skills?|abilities|tools|keahlian|bisa apa|kemampuan|perangkat|canva|excel|corel|capcut/.test(text))return `Syafril’s listed skills are **${p.skills.join(', ')}**. He has a Multimedia background and is currently studying Accounting.\n\n[View full profile](/about)`;
 if(/where|from|location|live|asal|lokasi|tinggal|jember/.test(text))return `Syafril is from **${p.location}**. He currently studies at ${p.university}.`;
 if(/who|syafril|profile|about|name|siapa|profil|tentang|perkenal|nama/.test(text))return `**${p.name}** is an ${p.major} student at ${p.university}, from ${p.location}. He previously studied ${p.schoolMajor} at ${p.school} and develops web, desktop, and Android projects.\n\n[Get to know him](/about) · [View all projects](/projects)`;
 return `Hi! This is Syafril’s portfolio assistant. Ask about **his profile, education, skills, projects, or contact details**. For music, type **/play song title** or **/help**.\n\nThese profile replies use information supplied by Syafril, not conversational AI.`;
}

function profileReplyId(message,p,notes){
 const text=String(message).toLowerCase();
 const aliases={'word-academic':/word\s*academic|add.in|skripsi|thesis/,'tempmail-pro':/temp\s*mail|email sementara|temporary email/,'coda':/\bcoda\b/,'safevideos':/safe\s*videos?|downloader/,'hifi':/\bhi[ -]?fi\b/,'linko':/\blinko\b|berbagi file|file.sharing/,'alhuda':/al[ -]?huda|ad[zh]an|qur.?an/};
 const projects=p.projects||[p.project];const found=projects.filter(x=>aliases[x.slug]?.test(text));
 if(found.length)return found.map(x=>{
  const note=notes[x.slug];
  if(note?.progress && /progress|status|development|perkembangan/.test(text))return `**${x.title} — Dalam pengembangan**\n\nTerlihat pada kode:\n${note.progress.implemented.id.map(v=>'- '+v).join('\n')}\n\nBelum selesai atau belum diverifikasi:\n${note.progress.unverified.id.map(v=>'- '+v).join('\n')}\n\nBerdasarkan pemeriksaan kode, bukan rilis yang telah diuji. [Lihat detail](/projects/${x.slug})`;
  if(note && /why|story|reason|cerita|kenapa|alasan/.test(text))return note.story.id+`\n\n[Lihat detail](/projects/${x.slug})`;
  return `**${x.title}** — ${x.status==='development'?'Dalam pengembangan':'Tersedia'}\n\n${x.description}\n\nPlatform: **${x.platform}**.\n\n[Lihat detail](/projects/${x.slug})${x.url?` · [Buka ${x.title}](${x.url})`:' · Belum dirilis; tautan unduhan belum tersedia di portfolio ini.'}${x.demo?`\n\n[Tonton demo](/projects/${x.slug}#demo-video)`:''}`;
 }).join('\n\n---\n\n');
 if(/proyek|project|aplikasi|\bapps?\b|download|unduh|akses|access|harga|price|cost|beli|buy/.test(text))return `Berikut proyek Syafril:\n${projects.map(x=>`- [${x.title}](/projects/${x.slug}) — ${x.status==='development'?'Dalam pengembangan':'Tersedia'} (${x.platform})`).join('\n')}\n\nSebutkan nama proyek untuk detailnya. [Lihat semua proyek](/projects)`;
 if(/kontak|contact|hubungi|whatsapp|email|instagram|social|sosial/.test(text))return `Hubungi Syafril melalui:\n- [Email: ${p.email}](mailto:${p.email})\n- [WhatsApp: ${p.phoneDisplay}](${p.whatsapp})\n- [Instagram: @${p.handle}](${p.instagram})`;
 if(/education|study|university|school|major|pendidikan|kuliah|universitas|kampus|jurusan|sekolah|smk/.test(text))return `Syafril adalah mahasiswa aktif **${p.major} di ${p.university}**. Sebelumnya ia menempuh pendidikan **${p.schoolMajor} di ${p.school}**.\n\n[Lihat profil](/about)`;
 if(/skill|keahlian|kemampuan|canva|excel|corel|capcut/.test(text))return `Keahlian Syafril: **${p.skills.join(', ')}**.\n\n[Lihat profil](/about)`;
 if(/where|location|asal|lokasi|tinggal|jember/.test(text))return `Syafril berasal dari **${p.location}** dan berkuliah di ${p.university}.`;
 if(/who|syafril|profile|about|name|siapa|profil|tentang|nama/.test(text))return `**${p.name}** adalah mahasiswa ${p.major} di ${p.university}, berasal dari ${p.location}. Ia mengembangkan proyek web, desktop, dan Android.\n\n[Kenal lebih dekat](/about) · [Lihat proyek](/projects)`;
 return 'Halo! Ini asisten portfolio Syafril. Tanyakan tentang **profil, pendidikan, keahlian, proyek, atau kontak**. Untuk musik, ketik **/play judul lagu** atau **/help**.\n\nBalasan ini berbasis informasi portfolio, bukan AI percakapan.';
}
