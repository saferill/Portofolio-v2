# Moch. Syafril Ramadhani — Bilingual Portfolio

English / Indonesian portfolio with the original reference layout preserved. Syafril is an Accounting student at Universitas Nahdlatul Ulama Yogyakarta, previously studying Multimedia at SMK Nurul Jadid, from Jember, East Java, Indonesia.

## Run

Requires Node.js 20+ and Python 3.10+.

```sh
npm ci
python -m pip install -r requirements.txt
npm start
```

Open http://localhost:3000. The server binds to 0.0.0.0; set PORT to change the port. Set PYTHON if the audio resolver needs a different Python executable. No API key or account cookies are required by this configuration.

## Pages and projects

Home retains the original three image-only cards: Word Academic, Coda, and SafeVideos. About retains the original two-column layout. Projects includes working All / Web App / Desktop / Android filters, including URL queries, reloads, and Back navigation.

| Project | Platform | Status | Detail route |
|---|---|---|---|
| Word Academic | Microsoft Word · Windows | Available | /projects/word-academic |
| TempMail Pro | Web | Available | /projects/tempmail-pro |
| Coda | Web | Available | /projects/coda |
| SafeVideos | Web | Available | /projects/safevideos |
| HiFi | Android · Desktop | In development | /projects/hifi |
| Linko | Android ↔ Windows | In development | /projects/linko |
| AlHuda | Android | In development | /projects/alhuda |

Status information comes from the owner. Development projects have no invented demo links, download links, release dates, or additional features. HiFi's desktop operating systems are not specified.

## Edit and rebuild

- `site/data/profile.json`: identity, contact links, skills, and the authoritative `projects` array. The singular `project` object retains legacy Word Academic data.
- `source/pages/*.html`: editable original-layout templates and reusable card, action, gallery, and demo fragments.
- `build_site.py`: standard-library renderer producing 11 pages and the projects API JSON.
- `site/_astro/Layout.BZ1HocBq.css`: unchanged original layout stylesheet. Do not redesign the shell, typography, dock, or cards.
- `site/portfolio.css`: interaction, accessibility, and responsive demo-player styles.
- `site/js/portfolio.js`: contact dialog, project filters, gallery, and Home music control.
- `profile-chat.mjs`: rule-based FAQ with English/Indonesian replies and keyword recognition. It is not conversational AI.
- `source/astro-runtime.html`: active dock entry `DockWithPlayer.locale.v4.js` with `MusicPlayer.locale.v4.js`.
- `source/chat-island.html`: active chat entry `SyafrilChat.locale.v6.js`.

```sh
python build_site.py
```

Restart the Node server after backend changes. Refresh the browser after frontend changes. The rendered pages are already included, so rebuilding is not required for the initial run. Keep exactly three featured projects to preserve the Home layout.

## Language and content integrity

The UI, descriptions, accessibility labels, page metadata, FAQ replies, music messages, and editable SVG project covers are in English. Institution and project names remain unchanged. Original screenshots, the supplied logo, and the recorded demo retain their original content. Saved conversation messages are retained; the stored welcome is refreshed to English, and new FAQ replies follow the selected language. The compact EN / ID selector sits above the original card at the upper right. English is the default; choices persist in localStorage and optional ?lang=en / ?lang=id links.

The latest user-selected portrait is `site/images/syafril-avatar-v2.webp`; the full portrait is `site/images/syafril-portrait.webp`. Contact links are email, WhatsApp, and Instagram, not a simulated message form.

Word Academic gallery visuals use the supplied logo and clearly labeled feature illustrations, not app screenshots. The AI lettering in the supplied logo is not evidence of an AI feature. HiFi, Linko, and AlHuda covers are placeholder artwork, not official logos or app screenshots. Public-site screenshots for TempMail Pro, Coda, and SafeVideos do not constitute end-to-end verification of those external services. The disposable address visible in TempMail's screenshot is not Syafril's contact address.

No invented employment, testimonials, graduation dates, client logos, metrics, pricing, or technical stacks are included. This package includes editable templates plus public compiled runtime assets; it is not the original private Astro/React source repository.

## Word Academic demo

The owner supplied https://drive.google.com/file/d/1AaZ--NhLMk_jaarbTfarFwx330lF56YF/view. The original HEVC encoding could play audio without displaying video in some browsers. `site/videos/word-academic-demo-v2.mp4` is the H.264 yuv420p / AAC conversion with faststart, approximately 35 seconds, 1080×1920. Include the videos folder when deploying.

The responsive native HTML5 player uses the original 9:16 ratio, max-width 420px, a poster, controls, playsinline, metadata preload, no autoplay, and a Drive fallback link. The server returns video/mp4 and supports HTTP Range. Testing verifies decoded video frames and dimensions, not just advancing time.

## Music

```text
/play Love Me Not Ravyn Lenae
/queue NIKI Every Summertime
/pause
/resume
/next
/prev
/volume 35
/stop
/help
```

`server.mjs` uses ytmusic-api for search. `music-stream.mjs` resolves public streams with yt-dlp and relays audio using same-origin endpoints with Range support. The player uses HTMLAudio, not the former YouTube iframe. Inspect `window.portfolioMusicDebug` and `/api/health` for diagnostics.

Sources can change or restrict access. Respect content permissions and provider terms; public accessibility does not grant redistribution rights. No account cookies or verification bypass are used. Some browsers require a play-button click. Stream URLs are not stored permanently. The included Summer Nights MP3 came from the previous snapshot; check its licensing before publishing.

## Tests

With the server running, install Python Playwright and Chromium, then run the scripts from the project root:

```sh
python -m pip install playwright
python -m playwright install chromium
python tests/test-restored-layout.py
python tests/test-project-catalog.py
python tests/test-demo-video.py
python tests/test-live-audio.py
```

The tests check original layout geometry, contacts, theme, responsive layouts, broken images, filters, seven detail pages, development status, chat identity, native demo-video frames, real audio playback, pause/resume, seeking, volume, queue controls, and persistence across navigation. Latest results are included in tests/. These results are not a guarantee of every browser or external-network condition.

## Project stories and reviewed development progress

Each of the seven project detail pages has Behind the Project and Development Focus sections. These describe the purpose and scope without inventing personal experiences or claiming sole authorship. The three development projects additionally distinguish Present in the Code from Pending or Not Yet Verified. Review was static source inspection, not native app execution or device testing; there are no completion percentages or release dates.

HiFi: search, player controls, queues, shuffle/radio continuation, and Android native stream integration were found. Desktop/device playback remains unverified. Linko: discovery, send/receive, progress/cancellation, history, settings and web-sharing code were found; its LocalSend-derived foundation is acknowledged without a repository link. AlHuda: prayer-time calculations, alarm/audio code, locations, settings and upcoming-alarm navigation were found; Qibla/Qada/monthly-view items remain placeholders, and a Quran reader was not found in the reviewed code. All three remain in development according to the owner.

No links to the owner's reviewed repositories are exposed on the website or in its project data. The native source repositories are not bundled.

### Bilingual editing

- `site/data/project-notes.json`: story, focus, and progress content in both languages. The builder includes English content and refreshes translations from both language fields.
- `site/data/profile.json` and `profile-id.json`: English and Indonesian profile/project copy. Keep both aligned when editing existing data.
- `site/data/locales-id.json`: editable English-to-Indonesian interface dictionary, including expanded profile paragraphs, titles, labels, and message templates.
- `site/js/i18n-strings.js`: generated dictionary; do not edit directly.
- `site/js/i18n-core.js`: exact translation units, dynamic message-template translation, and React language hook.
- `site/js/i18n.js`: selector, saved preference, optional query language, static-text localization, SVG asset switching, and Astro navigation handling.
- `site/images/id/`: localized versions of authored SVG covers. Screenshots, logos and the recorded demo stay unchanged.

Run `python build_site.py` after changing content. Existing messages keep the language in which they were sent; the welcome and UI switch languages, while new replies use the selected language. Language changes do not reload pages or remount the music engine, so audio and the native demo video continue playing. Without JavaScript, the generated pages remain English.

Additional verification: `python tests/test-bilingual.py` covers default language, switching, saved preference, translated story/progress, chat/help, both-language responsive layouts, images, and absence of repository links. Audio/video continuity across language changes was also checked in the browser.

## Approved Home/About copy

Home now introduces accounting, multimedia, and practical apps. About uses the three approved paragraphs covering education, work across documents/design/video/app development, and available versus ongoing projects rather than repeating the seven-project list. English templates are in source/pages/home.html and about.html, with approved Indonesian translations in site/data/locales-id.json. Original layout remains unchanged.

## CV and experience

The About page now includes the owner's confirmed experiences: Administration internship (PKL) at Universitas Muhammadiyah Jember, December 2022–March 2023, and active Medinfo (Media and Information) in Himpunan Mahasiswa Akuntansi at Universitas Nahdlatul Ulama Yogyakarta, term 2026/2027. PKL duties cover assisting student administration, communication of student requests to lecturers, and letter preparation. Medinfo is deliberately role-level only; no specific social media, design, campaign, leadership, or performance claims were supplied.

The CV uses a single-column, text-based format without invented education dates, GPA, skill ratings, language proficiency, or metrics. PDF versions are one page each. Editable DOCX files are also provided. All files live in site/documents with syafril-cv-en and syafril-cv-id basenames. The About download links use the selected EN/ID language and the native download attribute. The server serves application/pdf and OOXML Word MIME types. Existing website geometry remains unchanged apart from the requested experience/download content.

Experience and CV paths are in profile.json and profile-id.json. Additional CV wording is in site/data/cv-content.json. To rebuild CV files: python -m pip install -r requirements-documents.txt, then python build_cv.py. Embedded PDF fonts and their license are in source/fonts. Rebuild pages separately with python build_site.py. Update both profile languages and the translation dictionary when editing experience.

The rule-based FAQ now answers experience and CV questions. Verification: tests/test-cv.py checks both text PDFs, factual dates, language-aware PDF/DOCX downloads, MIME types, responsive layout, and FAQ responses. This optional test requires pypdf and Playwright.

## Latest project-copy refinement

All seven details now use one concise overview in the hero, followed by Why This Project, My Contribution, Key Features (or Features in Development), and Current Status. The former repeated About/Purpose/Story/progress sections are consolidated, not added again. Development limitations appear once beside current status. Visual provenance notes and the original gallery/demo remain.

Coda is explicitly browser-based, while HiFi targets dedicated Android/desktop apps. AlHuda is described as a prayer-reminder project with Quran reading planned, not available. Linko retains LocalSend attribution without a repository link. Role descriptions stay at project-development level; no unsupported individual feature authorship, results, or metrics are invented. Static code evidence does not prove tested native-app behavior.

English and Indonesian descriptions/features are in profile.json/profile-id.json; story, contribution (focus field), statusText, and reviewed progress are in project-notes.json. The builder refreshes story/focus/statusText translations automatically. Review both language fields when editing. Tests cover all seven pages in both languages, distinct headings, no repository links, filter behavior, video playback, CV downloads, and mobile layouts.
