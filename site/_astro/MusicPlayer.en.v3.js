import {translate as tr,useLanguage,language} from "../js/i18n-core.js";
import {a as React} from './index.CaSDoa4f.js';

const number = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;

// Persistent Global Music Engine (Singleton across page navigations)
function getGlobalMusicEngine() {
  if (window.__portfolioMusicEngine) {
    return window.__portfolioMusicEngine;
  }

  const subscribers = new Set();
  let token = 0;
  let watchdog = null;
  let abortCtrl = null;
  let nextBusy = false;

  // Single source of truth for music state
  const state = {
    current: null,
    queue: [],
    history: [],
    historyIndex: -1,
    volume: 60,
    playing: false,
    activeEngine: 'none', // 'html5' | 'youtube' | 'none'
    currentTime: 0,
    duration: 0,
    resolving: false,
    failed: false,
    errorMessage: '',
    statusMessage: '',
    wantsPlay: false
  };

  // 1. Persistent HTML5 Audio
  const audio = new Audio();
  audio.preload = 'auto';
  audio.volume = state.volume / 100;
  window.__portfolioAudioElement = audio;

  // 2. Persistent YouTube Player Host
  let ytPlayer = null;
  let ytReady = false;

  // Ensure persistent UI panel and YouTube iframe host attached to document.documentElement
  let panel = document.getElementById('music-audio-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'music-audio-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', tr('Music player status'));
    panel.innerHTML = `
      <div class="audio-panel-heading">
        <strong>${tr('Music player')}</strong>
        <div style="display:flex;gap:6px;align-items:center;">
          <button type="button" class="audio-toggle-pip" title="Minimize/Maximize Video" aria-label="Toggle video size" style="border:0;background:#333;color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:12px;">📺</button>
          <button type="button" class="audio-dismiss" aria-label="Dismiss message">×</button>
        </div>
      </div>
      <p role="status" aria-live="polite"></p>
      <div id="yt-player-host" style="width:100%;aspect-ratio:16/9;max-height:180px;border-radius:12px;overflow:hidden;background:#000;margin:8px 0;display:none;">
        <div id="yt-audio-container" style="width:100%;height:100%;"></div>
      </div>
      <div class="audio-panel-actions">
        <button type="button" class="audio-retry">${tr('Play music')}</button>
        <button type="button" class="audio-alternatives">${tr('Other versions')}</button>
        <button type="button" class="audio-stop">${tr('Stop')}</button>
        <a target="_blank" rel="noopener noreferrer">${tr('Open on YouTube ↗')}</a>
      </div>
      <div class="audio-choices"></div>
    `;

    const style = document.createElement('style');
    style.id = 'music-audio-panel-style';
    style.textContent = `
      #music-audio-panel{position:fixed;right:20px;bottom:112px;width:340px;max-width:calc(100vw - 24px);z-index:65;padding:14px;border-radius:18px;background:#171717;color:#fff;border:1px solid #414141;box-shadow:0 10px 35px #0003;font:13px Satoshi,system-ui,sans-serif;transition:transform .2s ease,opacity .2s ease}
      #music-audio-panel[hidden]{display:none}
      #music-audio-panel.is-pip{width:220px;padding:8px}
      #music-audio-panel.is-pip p, #music-audio-panel.is-pip .audio-panel-actions, #music-audio-panel.is-pip .audio-choices{display:none}
      .audio-panel-heading{display:flex;align-items:center;justify-content:space-between}
      .audio-panel-heading button{border:0;background:#333;color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer}
      #music-audio-panel p{margin:10px 0;line-height:1.55}
      .audio-panel-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .audio-panel-actions button{border:0;border-radius:18px;padding:8px 12px;background:#fff;color:#171717;cursor:pointer}
      .audio-panel-actions button:disabled{opacity:.5;cursor:wait}
      .audio-panel-actions a{color:#bbb;text-decoration:underline;font-size:11px}
      .audio-choices button{display:block;width:100%;text-align:left;padding:10px;margin-top:8px;border:1px solid #444;border-radius:10px;background:#252525;color:white;cursor:pointer}
      @media(max-width:600px){#music-audio-panel{top:14px;right:12px;bottom:auto}}
    `;
    // Attach directly to document.documentElement so Astro View Transitions NEVER detaches it
    document.documentElement.append(style, panel);
  }

  const statusEl = panel.querySelector('[role=status]');
  const retryBtn = panel.querySelector('.audio-retry');
  const alternativesBtn = panel.querySelector('.audio-alternatives');
  const choicesEl = panel.querySelector('.audio-choices');
  const sourceLink = panel.querySelector('a');
  const stopBtn = panel.querySelector('.audio-stop');
  const dismissBtn = panel.querySelector('.audio-dismiss');
  const pipBtn = panel.querySelector('.audio-toggle-pip');
  const ytHost = panel.querySelector('#yt-player-host');

  if (pipBtn) {
    pipBtn.onclick = () => { panel.classList.toggle('is-pip'); };
  }
  if (dismissBtn) {
    dismissBtn.onclick = () => { panel.hidden = true; };
  }

  function isYtPlayerAlive(p) {
    if (!p || typeof p.playVideo !== 'function') return false;
    try {
      const iframe = p.getIframe?.();
      return !!(iframe && iframe.isConnected && document.documentElement.contains(iframe));
    } catch {
      return false;
    }
  }

  function notify() {
    for (const sub of subscribers) {
      try { sub(state); } catch (e) { console.error('Subscription error:', e); }
    }
    updateDebug();
  }

  function updateDebug() {
    let curTime = state.currentTime;
    let dur = state.duration;

    if (state.activeEngine === 'youtube' && isYtPlayerAlive(ytPlayer)) {
      try {
        const ct = ytPlayer.getCurrentTime();
        if (Number.isFinite(ct)) curTime = number(ct);
        const d = ytPlayer.getDuration();
        if (Number.isFinite(d) && d > 0) dur = number(d);
      } catch {}
    } else if (state.activeEngine === 'html5') {
      curTime = number(audio.currentTime);
      dur = number(audio.duration) || state.duration;
    }

    state.currentTime = curTime;
    state.duration = dur;

    window.portfolioMusicDebug = {
      version: 'engine-v3',
      activeEngine: state.activeEngine,
      playback: state.activeEngine === 'youtube' ? 'YouTubeIFrame' : (state.activeEngine === 'html5' ? 'HTMLAudio' : 'none'),
      trackId: state.current?.id || null,
      playing: state.playing,
      currentTime: curTime,
      duration: dur,
      volume: state.volume,
      mediaConnected: state.activeEngine === 'youtube' ? isYtPlayerAlive(ytPlayer) : true,
      source: state.activeEngine === 'youtube' ? ('https://www.youtube.com/watch?v=' + state.current?.id) : (state.activeEngine === 'html5' ? (audio.getAttribute('src') || null) : null),
      message: statusEl ? statusEl.textContent : state.statusMessage
    };
  }

  function setPlayingState(playing) {
    state.playing = playing;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    }
    window.dispatchEvent(new CustomEvent('music-state-change', { detail: { playing } }));
    notify();
  }

  function setProgressState(cur, dur) {
    state.currentTime = number(cur);
    state.duration = number(dur);
    window.dispatchEvent(new CustomEvent('music-progress-change', { detail: { currentTime: state.currentTime, duration: state.duration } }));
    notify();
  }

  function setMessage(text, isError = false, showPanel = true) {
    state.statusMessage = text;
    if (statusEl) statusEl.textContent = text;
    if (showPanel && panel) panel.hidden = false;
    window.dispatchEvent(new CustomEvent('music-status', { detail: { text, error: isError, track: state.current } }));
    updateDebug();
  }

  function setFail(text) {
    state.failed = true;
    state.errorMessage = text;
    clearTimeout(watchdog);
    setPlayingState(false);
    if (retryBtn) {
      retryBtn.disabled = false;
      retryBtn.textContent = tr('Retry');
    }
    setMessage(text, true, true);
  }

  function setMediaMetadata() {
    if (!state.current || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: state.current.title,
        artist: state.current.artist,
        artwork: state.current.thumbnail ? [{ src: state.current.thumbnail }] : []
      });
    } catch {}
  }

  function getYtPlayer(cb) {
    if (isYtPlayerAlive(ytPlayer)) return cb(ytPlayer);

    if (!window.YT) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }

    if (ytHost) ytHost.style.display = 'block';

    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkInterval);
        if (!isYtPlayerAlive(ytPlayer)) {
          try {
            ytPlayer = new window.YT.Player('yt-audio-container', {
              height: '100%',
              width: '100%',
              playerVars: {
                autoplay: 1,
                controls: 1,
                disablekb: 0,
                fs: 0,
                rel: 0,
                playsinline: 1
              },
              events: {
                onReady: e => {
                  ytReady = true;
                  ytPlayer = e.target;
                  cb(ytPlayer);
                },
                onStateChange: e => {
                  // 1 = playing, 2 = paused, 0 = ended
                  if (e.data === 1) {
                    state.failed = false;
                    clearTimeout(watchdog);
                    setPlayingState(true);
                    if (statusEl) statusEl.textContent = `${state.current?.title || ''} · ${state.current?.artist || ''}`;
                    if (panel && !panel.classList.contains('is-pip')) panel.hidden = true;
                    updateDebug();
                  } else if (e.data === 2) {
                    setPlayingState(false);
                  } else if (e.data === 0) {
                    setPlayingState(false);
                    next();
                  }
                },
                onError: () => {
                  setFail(tr('YouTube audio is unavailable for this song. Try another version.'));
                }
              }
            });
          } catch (err) {
            setFail(tr('Could not initialize player.'));
          }
        } else {
          cb(ytPlayer);
        }
      }
    }, 100);
  }

  // HTML5 audio event listeners
  audio.onplaying = () => {
    if (!state.current || !state.wantsPlay) return;
    state.failed = false;
    clearTimeout(watchdog);
    setPlayingState(true);
    if (statusEl) statusEl.textContent = `${state.current.title} · ${state.current.artist}`;
    if (panel) panel.hidden = true;
    updateDebug();
  };
  audio.onpause = () => { setPlayingState(false); };
  audio.onwaiting = () => { setPlayingState(false); if (state.current && !state.resolving) setMessage(tr('Loading audio…')); };
  audio.onstalled = () => { if (state.current && state.wantsPlay && !state.resolving) setMessage(tr('The audio connection is slow. Waiting for data…')); };
  audio.onloadedmetadata = () => {
    if (state.current) {
      state.current.durationSeconds = number(audio.duration) || state.current.durationSeconds;
      setProgressState(audio.currentTime, state.current.durationSeconds);
    }
  };
  audio.ontimeupdate = () => {
    if (state.activeEngine === 'html5') {
      setProgressState(audio.currentTime, audio.duration || state.current?.durationSeconds);
    }
  };
  audio.onended = () => { setPlayingState(false); next(); };
  audio.onerror = () => {
    if (state.current && !state.resolving) {
      setFail(tr('Audio stream failed to load (code ') + (audio.error?.code || '?') + tr('). Click Retry or choose Other versions.'));
    }
  };

  // Regular progress tick for YouTube & HTMLAudio
  setInterval(() => {
    if (state.activeEngine === 'youtube' && isYtPlayerAlive(ytPlayer)) {
      try {
        const ct = ytPlayer.getCurrentTime();
        const d = ytPlayer.getDuration();
        setProgressState(ct, d > 0 ? d : state.current?.durationSeconds);
      } catch {}
    } else if (state.activeEngine === 'html5') {
      setProgressState(audio.currentTime, audio.duration || state.current?.durationSeconds);
    }
  }, 500);

  // Core Play method
  async function play(track, remember = true) {
    if (!track?.id || !track.title) {
      setFail(tr('Track data is incomplete. Search for the song again.'));
      return;
    }

    const request = ++token;
    abortCtrl?.abort();
    abortCtrl = new AbortController();
    clearTimeout(watchdog);

    state.wantsPlay = true;
    state.resolving = true;
    state.failed = false;

    // Reset previous playback
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    if (isYtPlayerAlive(ytPlayer)) {
      try { ytPlayer.stopVideo(); } catch {}
    }

    state.current = { ...track, durationSeconds: number(track.durationSeconds) };
    if (remember) {
      state.history = state.history.slice(0, state.historyIndex + 1);
      state.history.push(state.current);
      state.historyIndex = state.history.length - 1;
    }

    window.dispatchEvent(new CustomEvent('music-track-change', { detail: { track: state.current } }));
    setPlayingState(false);
    setProgressState(0, state.current.durationSeconds);
    setMediaMetadata();

    if (choicesEl) choicesEl.replaceChildren();
    if (sourceLink) {
      sourceLink.hidden = state.current.id === 'local-summer-nights';
      sourceLink.href = state.current.id === 'local-summer-nights' ? '#' : `https://www.youtube.com/watch?v=${encodeURIComponent(state.current.id)}`;
    }
    if (alternativesBtn) alternativesBtn.hidden = state.current.id === 'local-summer-nights';
    if (retryBtn) {
      retryBtn.disabled = true;
      retryBtn.textContent = tr('Preparing…');
    }
    setMessage(tr('Preparing audio for ') + state.current.title + '…');

    try {
      if (state.current.id === 'local-summer-nights') {
        state.activeEngine = 'html5';
        if (ytHost) ytHost.style.display = 'none';
        state.resolving = false;
        if (retryBtn) {
          retryBtn.disabled = false;
          retryBtn.textContent = tr('Play music');
        }
        audio.src = '/summer-nights.mp3';
        audio.volume = state.volume / 100;
        setProgressState(0, state.current.durationSeconds);
        if (state.wantsPlay) {
          watchdog = setTimeout(() => {
            if (request !== token || !state.wantsPlay || state.failed) return;
            if (audio.paused || audio.readyState < 3) setMessage(tr('Audio has not started. Click Play music; if it stays silent, try another version.'));
          }, 10000);
          await audio.play();
        } else {
          audio.load();
          setMessage(tr('Paused. Audio is ready to play.'));
        }
      } else {
        state.activeEngine = 'youtube';
        if (ytHost) ytHost.style.display = 'block';
        state.resolving = true;
        setMessage(tr('Preparing audio for ') + state.current.title + '…');
        getYtPlayer(p => {
          if (request !== token) return;
          state.resolving = false;
          if (retryBtn) {
            retryBtn.disabled = false;
            retryBtn.textContent = tr('Play music');
          }
          try {
            p.loadVideoById(state.current.id);
            p.setVolume(state.volume);
            if (state.wantsPlay) p.playVideo();
          } catch (err) {
            setFail(tr('The audio source is unavailable.'));
          }
        });
      }
    } catch (err) {
      if (request !== token) return;
      state.resolving = false;
      if (err.name !== 'AbortError') setFail(err.message || tr('The audio source is unavailable.'));
    }
  }

  function pause() {
    state.wantsPlay = false;
    clearTimeout(watchdog);
    if (state.activeEngine === 'html5') {
      audio.pause();
    } else if (state.activeEngine === 'youtube' && isYtPlayerAlive(ytPlayer)) {
      try { ytPlayer.pauseVideo(); } catch {}
    }
    setPlayingState(false);
  }

  function resume() {
    if (!state.current) {
      setMessage(tr('Choose a song with /play song title.'));
      return;
    }
    state.wantsPlay = true;
    if (state.activeEngine === 'html5') {
      if (state.failed || !audio.getAttribute('src')) {
        play(state.current, false);
      } else {
        audio.play().catch(e => {
          if (e.name === 'NotAllowedError') setMessage(tr('Audio is ready. Click Play music to allow playback.'));
        });
      }
    } else if (state.activeEngine === 'youtube') {
      getYtPlayer(p => {
        try { p.playVideo(); } catch {}
      });
    }
  }

  function stop() {
    ++token;
    abortCtrl?.abort();
    clearTimeout(watchdog);
    state.wantsPlay = false;
    state.resolving = false;
    state.failed = false;
    state.current = null;
    state.queue = [];
    state.activeEngine = 'none';
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    if (isYtPlayerAlive(ytPlayer)) {
      try { ytPlayer.stopVideo(); } catch {}
    }
    if (ytHost) ytHost.style.display = 'none';
    if (panel) panel.hidden = true;
    setPlayingState(false);
    setProgressState(0, 0);
    window.dispatchEvent(new CustomEvent('music-track-change', { detail: { track: null } }));
    notify();
  }

  async function next() {
    if (nextBusy) return;
    nextBusy = true;
    try {
      if (state.queue.length) {
        const nextSong = state.queue.shift();
        await play(nextSong);
        return;
      }
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        await play(state.history[state.historyIndex], false);
        return;
      }
      if (!state.current) return;
      if (state.current.id === 'local-summer-nights') {
        pause();
        setMessage(tr('The queue is empty. Add a song with /queue song title.'));
        return;
      }
      const request = token;
      setMessage(tr('Finding the next song…'));
      const response = await fetch('/api/music/search?id=' + encodeURIComponent(state.current.id));
      const results = await response.json();
      if (request !== token) return;
      if (!response.ok) throw new Error(results.error || tr('Recommendations are unavailable.'));
      const song = Array.isArray(results) && results.find(t => !state.history.some(h => h.id === t.id));
      if (song) await play(song);
      else {
        pause();
        setMessage(tr('The queue has ended. Use /queue song title.'));
      }
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      nextBusy = false;
    }
  }

  function previous() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      play(state.history[state.historyIndex], false);
    } else {
      seek(0);
    }
  }

  function seek(seconds) {
    if (!state.current || state.resolving) return;
    const s = number(seconds);
    if (state.activeEngine === 'html5') {
      const dur = number(audio.duration);
      if (dur > 0) {
        audio.currentTime = Math.min(dur, s);
        setProgressState(audio.currentTime, dur);
      }
    } else if (state.activeEngine === 'youtube' && isYtPlayerAlive(ytPlayer)) {
      try {
        ytPlayer.seekTo(s, true);
        setProgressState(s, ytPlayer.getDuration() || state.current.durationSeconds);
      } catch {}
    }
  }

  function setVolume(value) {
    const v = Math.min(100, Math.max(0, number(value)));
    state.volume = v;
    audio.volume = v / 100;
    if (isYtPlayerAlive(ytPlayer)) {
      try { ytPlayer.setVolume(v); } catch {}
    }
    notify();
  }

  // Hook UI panel controls
  if (retryBtn) retryBtn.onclick = resume;
  if (stopBtn) stopBtn.onclick = stop;
  if (alternativesBtn) {
    alternativesBtn.onclick = async () => {
      if (!state.current) return;
      const request = token;
      alternativesBtn.disabled = true;
      setMessage(tr('Searching for other versions…'));
      try {
        const response = await fetch('/api/music/search?type=video&q=' + encodeURIComponent(state.current.title + ' ' + state.current.artist));
        const results = await response.json();
        if (request !== token) return;
        if (!response.ok) throw new Error(results.error || tr('Search failed.'));
        if (choicesEl) {
          choicesEl.replaceChildren();
          const options = results.filter(t => t.id !== state.current?.id).slice(0, 3);
          setMessage(options.length ? tr('Choose a version to play.') : tr('No other versions were found.'));
          for (const track of options) {
            const btn = document.createElement('button');
            btn.textContent = `${track.title} · ${track.artist}`;
            btn.onclick = () => play(track);
            choicesEl.appendChild(btn);
          }
        }
      } catch (err) {
        if (request === token) setMessage(err.message, true);
      } finally {
        alternativesBtn.disabled = false;
      }
    };
  }

  // MediaSession Action Handlers
  if ('mediaSession' in navigator) {
    for (const [action, handler] of Object.entries({
      play: resume,
      pause,
      stop,
      nexttrack: next,
      previoustrack: previous,
      seekto: d => seek(d.seekTime)
    })) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
    }
  }

  // Unified global event listener for 'music-command'
  window.addEventListener('music-command', e => {
    const { command, value, track } = e.detail || {};
    switch (command) {
      case 'play': track ? play(track) : resume(); break;
      case 'play_track': track && play(track); break;
      case 'queue':
        if (!state.current) play(track);
        else {
          state.queue.push(track);
          setMessage(track.title + tr(' added to the queue.'), false, false);
          notify();
        }
        break;
      case 'pause': pause(); break;
      case 'resume': resume(); break;
      case 'stop': stop(); break;
      case 'next': next(); break;
      case 'prev': previous(); break;
      case 'seek': if (value !== undefined) seek(value); break;
      case 'set_volume': if (value !== undefined) setVolume(value); break;
    }
  });

  // Listener for 'music-request-state' to re-sync any newly mounted view (like Chat or Dock)
  window.addEventListener('music-request-state', () => {
    window.dispatchEvent(new CustomEvent('music-track-change', { detail: { track: state.current } }));
    window.dispatchEvent(new CustomEvent('music-state-change', { detail: { playing: state.playing } }));
    window.dispatchEvent(new CustomEvent('music-progress-change', { detail: { currentTime: state.currentTime, duration: state.duration } }));
  });

  const engine = {
    getState: () => ({ ...state }),
    playTrack: play,
    queueTrack: track => {
      if (!state.current) play(track);
      else {
        state.queue.push(track);
        setMessage(track.title + tr(' added to the queue.'), false, false);
        notify();
      }
    },
    pause,
    resume,
    stop,
    next,
    prev: previous,
    seekTo: seek,
    setVolume,
    subscribe: fn => {
      subscribers.add(fn);
      fn(state);
      return () => subscribers.delete(fn);
    }
  };

  window.__portfolioMusicEngine = engine;
  window.__portfolioPlayer = state;
  updateDebug();
  return engine;
}

const M = React.forwardRef(function MusicPlayer(props, ref) {
  const callbacks = React.useRef(props);
  callbacks.current = props;

  const engine = getGlobalMusicEngine();
  React.useImperativeHandle(ref, () => engine, []);

  React.useEffect(() => {
    // Immediately sync current engine state to props callbacks on mount
    const s = engine.getState();
    if (s.current) {
      callbacks.current.onTrackChange?.(s.current);
      callbacks.current.onPlayStateChange?.(s.playing);
      callbacks.current.onProgressChange?.(s.currentTime, s.duration);
    }

    // Subscribe to engine updates
    const unsubscribe = engine.subscribe(state => {
      callbacks.current.onTrackChange?.(state.current);
      callbacks.current.onPlayStateChange?.(state.playing);
      callbacks.current.onProgressChange?.(state.currentTime, state.duration);
    });

    // On unmount (e.g. page navigation), ONLY unsubscribe! DO NOT stop engine!
    return () => {
      unsubscribe();
    };
  }, []);

  return null;
});

export { M };
