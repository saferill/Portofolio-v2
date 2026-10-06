// Cloudflare Pages Function: /api/chat
export async function onRequestPost({ request }) {
  try {
    const data = await request.json();
    const lang = data.language === 'id' ? 'id' : 'en';
    const text = String(data.message || '').trim();

    // Check for music play command in chat
    const playMatch = text.match(/^(?:tolong\s+)?(?:putar(?:kan|in)?|play|mainkan)(?:\s+(?:lagu|musik))?\s+(.+?)(?:\s+dong)?[.!]?$/i);
    if (playMatch) {
      const query = playMatch[1].trim();
      return jsonResponse({
        text: lang === 'id' ? `Mencari "${query}" di YouTube…` : `Searching for "${query}" on YouTube…`,
        musicAction: { command: 'play', query }
      });
    }

    // Music control commands
    const controlCmds = {
      'pause': 'pause', 'jeda': 'pause',
      'resume': 'resume', 'lanjut': 'resume',
      'stop': 'stop', 'berhenti': 'stop',
      'next': 'next', 'skip': 'next'
    };
    if (controlCmds[text.toLowerCase()]) {
      const cmd = controlCmds[text.toLowerCase()];
      return jsonResponse({
        text: lang === 'id' ? 'Perintah musik dikirim ke pemutar.' : 'Music command sent to the player.',
        musicAction: { command: cmd }
      });
    }

    // FAQ replies based on Syafril's profile
    const reply = getFaqReply(text, lang);
    return jsonResponse({ text: reply, musicAction: { command: 'none' } });
  } catch (err) {
    return jsonResponse({ error: 'Chat processing error: ' + err.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function getFaqReply(query, lang) {
  const q = query.toLowerCase();

  if (/\bcv\b|\bresume\b|curriculum vitae/.test(q)) {
    return lang === 'id'
      ? `[Unduh CV (PDF)](/documents/syafril-cv-id.pdf) · [Versi Word](/documents/syafril-cv-id.docx)`
      : `[Download CV (PDF)](/documents/syafril-cv-en.pdf) · [Word version](/documents/syafril-cv-en.docx)`;
  }

  if (/experience|pengalaman|internship|\bpkl\b|medinfo|organisasi|organization/.test(q)) {
    return lang === 'id'
      ? `Pengalaman Syafril meliputi administrasi dokumen, desain multimedia, dan pembuatan aplikasi praktis untuk tugas akademik & produktivitas.\n\n[Lihat selengkapnya di halaman About](/about)`
      : `Syafril's experience spans multimedia design, accounting, and developing practical productivity apps.\n\n[Learn more on the About page](/about)`;
  }

  if (/proyek|project|aplikasi|\bapps?\b|download|unduh|word academic|coda|safevideos|tempmail|hifi|linko|alhuda/.test(q)) {
    return lang === 'id'
      ? `Berikut beberapa proyek Syafril:\n- **[Word Academic](/projects/word-academic)** — Add-in Microsoft Word untuk format skripsi/tugas otomatis\n- **[Coda](/projects/coda)** — Web app pemutar musik & produktivitas\n- **[SafeVideos](/projects/safevideos)** — Web video utility\n- **[TempMail Pro](/projects/tempmail-pro)** — Layanan disposable email\n- Proyek dalam pengembangan: **HiFi**, **Linko**, **AlHuda**\n\n[Lihat semua proyek di sini](/projects)`
      : `Here are Syafril’s key projects:\n- **[Word Academic](/projects/word-academic)** — Microsoft Word add-in for automated academic formatting\n- **[Coda](/projects/coda)** — Web-based music & productivity player\n- **[SafeVideos](/projects/safevideos)** — Web video downloader utility\n- **[TempMail Pro](/projects/tempmail-pro)** — Temporary email utility\n- In development: **HiFi**, **Linko**, **AlHuda**\n\n[View all projects](/projects)`;
  }

  if (/contact|reach|kontak|hubungi|whatsapp|wa\b|email|instagram/.test(q)) {
    return lang === 'id'
      ? `Kamu bisa menghubungi Syafril melalui:\n- **Email:** [mochsyafrilramadhani5@gmail.com](mailto:mochsyafrilramadhani5@gmail.com)\n- **WhatsApp:** [0851-4300-1281](https://wa.me/6285143001281)\n- **Instagram:** [@safe_rill](https://www.instagram.com/safe_rill/)`
      : `You can reach Syafril through:\n- **Email:** [mochsyafrilramadhani5@gmail.com](mailto:mochsyafrilramadhani5@gmail.com)\n- **WhatsApp:** [+62 851-4300-1281](https://wa.me/6285143001281)\n- **Instagram:** [@safe_rill](https://www.instagram.com/safe_rill/)`;
  }

  if (/pendidikan|kuliah|universitas|kampus|jurusan|sekolah|smk|study|education|university/.test(q)) {
    return lang === 'id'
      ? `Syafril adalah mahasiswa aktif jurusan **Akuntansi di Universitas Nahdlatul Ulama Yogyakarta**. Sebelumnya menempuh pendidikan **Multimedia di SMK Nurul Jadid**.`
      : `Syafril is currently an **Accounting student at Universitas Nahdlatul Ulama Yogyakarta**, having previously studied **Multimedia at SMK Nurul Jadid**.`;
  }

  if (/skill|keahlian|kemampuan|canva|excel|corel|capcut|word/.test(q)) {
    return lang === 'id'
      ? `Keahlian Syafril mencakup: **Microsoft Word, Microsoft Excel, Canva, CorelDRAW, CapCut**, dan pengembangan aplikasi web/desktop.`
      : `Syafril's skills include: **Microsoft Word, Microsoft Excel, Canva, CorelDRAW, CapCut**, and web/desktop application development.`;
  }

  if (/asal|lokasi|tinggal|jember|where|location/.test(q)) {
    return lang === 'id'
      ? `Syafril berasal dari **Jember, Jawa Timur, Indonesia**.`
      : `Syafril is from **Jember, East Java, Indonesia**.`;
  }

  if (/siapa|profil|tentang|nama|who|syafril|about/.test(q)) {
    return lang === 'id'
      ? `**Moch. Syafril Ramadhani** adalah mahasiswa Akuntansi di UNU Yogyakarta dengan latar belakang Multimedia dari SMK Nurul Jadid. Ia menyukai perpaduan angka, desain visual, dan pembuatan aplikasi bermanfaat.`
      : `**Moch. Syafril Ramadhani** is an Accounting student at UNU Yogyakarta with a Multimedia background from SMK Nurul Jadid, building practical applications.`;
  }

  return lang === 'id'
    ? `Halo! Aku asisten portofolio Syafril. Tanyakan tentang **profil, pendidikan, keahlian, proyek, atau kontak**. Untuk memutar musik, ketik **/play [judul lagu]** atau **/help**.`
    : `Hi! I'm Syafril's portfolio assistant. Feel free to ask about his **profile, education, skills, projects, or contacts**. To play music, type **/play [song title]** or **/help**.`;
}
