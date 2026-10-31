let actx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!actx) actx = new AudioCtx();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch {
    return null;
  }
}

export function playSkidSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const dur = 0.55;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 7;
    bp.frequency.setValueAtTime(2800, t);
    bp.frequency.exponentialRampToValueAtTime(850, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    src.start(t);
  } catch {}
}

// Sci-Fi space warp / thruster transition sound
export function playWarpSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.45);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  } catch {}
}

// AI Copilot listening activation chime
export function playChimeSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  } catch {}
}

// High-tech success confirmation beep
export function playConfirmSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.setValueAtTime(880, t + 0.1); // A5

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  } catch {}
}

export function triggerSkidEffect(btnEl: HTMLElement | null, soundEnabled: boolean) {
  playSkidSound(soundEnabled);
  if (!btnEl || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    return;
  }

  const r = btnEl.getBoundingClientRect();
  btnEl.classList.remove('brake');
  void btnEl.offsetWidth; // trigger reflow
  btnEl.classList.add('brake');
  setTimeout(() => btnEl.classList.remove('brake'), 800);

  const box = document.createElement('div');
  box.className = 'smokebox';
  box.style.cssText = `left: ${r.left + 8}px; top: ${r.bottom - 4}px;`;
  for (let i = 0; i < 8; i++) {
    const q = document.createElement('i');
    q.className = 'smk';
    const x = Math.random() * Math.max(20, r.width - 24);
    const dx = (Math.random() - 0.5) * 40;
    const s = 0.8 + Math.random() * 1.2;
    q.style.cssText = `--x: ${x}px; --dx: ${dx}px; --s: ${s}; animation-delay: ${i * 0.05}s;`;
    box.appendChild(q);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 1500);
}
