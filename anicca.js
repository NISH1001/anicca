/* ============================================================
   anicca — all that arises, passes
   A live meditation on impermanence. Vanilla, no deps.
   ============================================================ */
(() => {
  'use strict';

  // ---- defaults: exactly what we set; anyone can tune them ----
  const DEFAULTS = {
    youBorn: 1993,
    herName: 'Anu priyaaay',
    herBorn: 1991,
    sleep: 8,
    work: 8,
    personal: 2,
    meditation: 2,
    togetherToAge: 60, // both live to at least this; binds on the elder
    toAge: 80,         // a realistic life horizon
  };

  const KEY = 'anicca.cfg';
  const NUM_KEYS = ['youBorn', 'herBorn', 'sleep', 'work', 'personal', 'meditation', 'togetherToAge', 'toAge'];
  const DAY_MS = 86400000;
  const YEAR_DAYS = 365.25;

  // accent rgb per lens — mirrors the CSS themes, for the canvas
  const ACCENTS = {
    life:      [199, 212, 230],
    stillness: [127, 216, 192],
    anu:       [240, 179, 106],
  };

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- config ----------
  const clampNum = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

  function sanitize(c) {
    return {
      youBorn: Math.round(clampNum(num(c.youBorn, DEFAULTS.youBorn), 1900, 2026)),
      herBorn: Math.round(clampNum(num(c.herBorn, DEFAULTS.herBorn), 1900, 2026)),
      herName: (typeof c.herName === 'string' && c.herName.trim() ? c.herName : DEFAULTS.herName).slice(0, 20),
      sleep: clampNum(num(c.sleep, DEFAULTS.sleep), 0, 24),
      work: clampNum(num(c.work, DEFAULTS.work), 0, 24),
      personal: clampNum(num(c.personal, DEFAULTS.personal), 0, 24),
      meditation: clampNum(num(c.meditation, DEFAULTS.meditation), 0, 24),
      togetherToAge: Math.round(clampNum(num(c.togetherToAge, DEFAULTS.togetherToAge), 1, 120)),
      toAge: Math.round(clampNum(num(c.toAge, DEFAULTS.toAge), 1, 120)),
    };
  }

  function readConfig() {
    let cfg = { ...DEFAULTS };
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      cfg = { ...cfg, ...saved };
    } catch (_) { /* ignore */ }
    const q = new URLSearchParams(location.search);
    for (const k of Object.keys(DEFAULTS)) {
      if (q.has(k)) cfg[k] = (k === 'herName') ? q.get(k) : Number(q.get(k));
    }
    return sanitize(cfg);
  }

  // a single source of truth for the URL: only non-default config + the lens
  function writeURL() {
    // extension new-tab pages: never touch the URL, or Firefox shows the
    // moz-extension://… address instead of the clean, empty new-tab bar
    if (location.protocol === 'moz-extension:' || location.protocol === 'chrome-extension:') return;
    const q = new URLSearchParams();
    for (const k of Object.keys(DEFAULTS)) {
      if (cfg[k] !== DEFAULTS[k]) q.set(k, cfg[k]);
    }
    if (lens !== 'anu') q.set('lens', lens); // anu is the default landing
    const qs = q.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (_) {}
    writeURL();
  }

  let cfg = readConfig();
  let lens = 'anu';

  // ---------- the math ----------
  const ageDate = (birthYear, addAge) => new Date(birthYear + addAge, 0, 1).getTime();

  function lensModel(key) {
    const name = (cfg.herName && cfg.herName !== '—') ? cfg.herName : 'them';
    if (key === 'life') {
      return {
        perDay: Math.max(0, 24 - cfg.sleep),
        origin: ageDate(cfg.youBorn, 0),
        horizon: ageDate(cfg.youBorn, cfg.toAge),
        eyebrow: 'your waking life',
        unit: 'waking hours remain',
        line: 'Not the time until you end — the time you are still here for.',
      };
    }
    if (key === 'stillness') {
      return {
        perDay: cfg.meditation,
        origin: ageDate(cfg.youBorn, 0),
        horizon: ageDate(cfg.youBorn, cfg.toAge),
        eyebrow: 'hours of stillness',
        unit: 'hours of stillness await',
        line: 'Returned to the breath each day. Watch them arise. Watch them pass.',
      };
    }
    // together
    const horizon = Math.min(ageDate(cfg.youBorn, cfg.togetherToAge), ageDate(cfg.herBorn, cfg.togetherToAge));
    return {
      perDay: Math.max(0, 24 - cfg.sleep - cfg.work - cfg.personal),
      origin: ageDate(Math.min(cfg.youBorn, cfg.herBorn), 0),
      horizon,
      eyebrow: `time with ${name}`,
      unit: 'waking hours together remain',
      line: `The hours with ${name} you have not yet lived — precious because they end.`,
    };
  }

  const remainingHours = (now, m) => Math.max(0, (m.horizon - now) / DAY_MS) * m.perDay;

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    body: document.body,
    eyebrow: $('eyebrow'), numInt: $('numInt'), numFrac: $('numFrac'),
    unit: $('unit'), sub: $('sub'), line: $('line'),
    lived: $('lived'), nowMark: $('nowMark'), ageMark: $('ageMark'),
    originLabel: $('originLabel'), horizonLabel: $('horizonLabel'),
    breathLbl: $('breathLbl'),
    lenses: $('lenses'),
    panel: $('panel'), cfgToggle: $('cfgToggle'), panelClose: $('panelClose'),
    cfgForm: $('cfgForm'), cfgReset: $('cfgReset'), cfgLink: $('cfgLink'),
    panelNote: $('panelNote'),
  };

  const fmtInt = (n) => Math.floor(n).toLocaleString('en-US');
  const fmtFrac = (n) => (n - Math.floor(n)).toFixed(6).slice(2);

  let model = null; // cached lens model; recomputed only when lens/cfg changes
  let lastSub = 0;  // throttle the slow-moving days/years line
  function applyLensCopy() {
    const m = model = lensModel(lens);
    el.eyebrow.textContent = m.eyebrow;
    el.unit.textContent = m.unit;
    el.line.textContent = m.line;
    el.originLabel.textContent = new Date(m.origin).getFullYear();
    el.horizonLabel.textContent = new Date(m.horizon).getFullYear();
  }

  function updateReadout(now) {
    const m = model || (model = lensModel(lens));
    const hrs = remainingHours(now, m);
    el.numInt.textContent = fmtInt(hrs);
    el.numFrac.textContent = fmtFrac(hrs);

    // the days/years line moves slowly — refresh ~twice a second, not every frame
    if (now - lastSub > 500) {
      lastSub = now;
      const days = hrs / 24;
      el.sub.textContent = `≈ ${fmtInt(days)} days · ${(days / YEAR_DAYS).toFixed(1)} years, lived all at once`;
    }

    // lifeline (origin/horizon year labels are set in applyLensCopy, not per frame)
    const span = m.horizon - m.origin;
    const frac = clampNum((now - m.origin) / span, 0, 1);
    const pct = (frac * 100).toFixed(3) + '%';
    el.lived.style.width = pct;
    el.nowMark.style.left = pct;

    // your age right now — lens-independent; many decimals so it visibly streams
    if (el.ageMark) {
      const ageYears = Math.max(0, (now - ageDate(cfg.youBorn, 0)) / (YEAR_DAYS * DAY_MS));
      el.ageMark.style.left = pct;
      el.ageMark.textContent = Math.floor(ageYears) + '.' + (ageYears % 1).toFixed(9).slice(2);
    }
  }

  // ---------- the field: motes that arise and pass ----------
  const canvas = $('field');
  const ctx = canvas.getContext('2d', { alpha: false });
  let W = 0, H = 0, DPR = 1;
  const acc = [...ACCENTS.anu];          // current (lerped) accent
  let glow = null;                        // pre-rendered glow sprite
  let auraGradient = null, bgGradient = null; // cached canvas gradients
  let lgR = -1, lgG = -1, lgB = -1;       // accent the sprites were last built for
  const pointer = { x: -1e4, y: -1e4, on: false };
  let particles = [];

  // rebuild the glow sprite + aura only when the (rounded) accent changes —
  // not every frame. removes a canvas + gradient allocation per frame.
  function buildGlow() {
    const r = Math.round(acc[0]), gg = Math.round(acc[1]), b = Math.round(acc[2]);
    if (glow && r === lgR && gg === lgG && b === lgB) return;
    lgR = r; lgG = gg; lgB = b;
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, `rgba(${r},${gg},${b},1)`);
    grd.addColorStop(0.22, `rgba(${r},${gg},${b},0.45)`);
    grd.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    glow = c;
    buildAura();
  }

  // central aura (accent + size dependent) and abyss background (size only) —
  // cached; rebuilt on accent change (aura) and on resize (both)
  function buildAura() {
    const r = Math.round(acc[0]), gg = Math.round(acc[1]), b = Math.round(acc[2]);
    auraGradient = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, Math.min(W, H) * 0.42);
    auraGradient.addColorStop(0, `rgba(${r},${gg},${b},1)`);
    auraGradient.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  }
  function buildBg() {
    bgGradient = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, Math.max(W, H) * 0.75);
    bgGradient.addColorStop(0, 'rgba(14,16,24,1)');
    bgGradient.addColorStop(0.5, 'rgba(8,9,15,1)');
    bgGradient.addColorStop(1, 'rgba(4,5,9,1)');
  }

  function spawn(p, first) {
    p.x = Math.random() * W;
    p.y = first ? Math.random() * H : H + Math.random() * 60;
    p.r = 0.6 + Math.random() * 2.0;
    p.vx = (Math.random() - 0.5) * 0.18;
    p.vy = -(0.12 + Math.random() * 0.36);   // a slow rising
    p.life = 5 + Math.random() * 9;          // seconds
    p.age = first ? Math.random() * p.life : 0;
    p.sway = 0.3 + Math.random() * 0.9;
    p.phase = Math.random() * Math.PI * 2;
    p.bright = 0.5 + Math.random() * 0.5;
    return p;
  }

  function initParticles() {
    const area = W * H;
    let count = Math.round(area / 1500);
    count = clampNum(count, 220, reduceMotion ? 280 : 1500);
    particles = [];
    for (let i = 0; i < count; i++) particles.push(spawn({}, true));
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildBg();
    buildAura();
    initParticles();
  }

  function drawBackground() {
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);
  }

  function stepField(now, dt, breath) {
    drawBackground();
    ctx.globalCompositeOperation = 'lighter';

    const t = now / 1000;
    for (const p of particles) {
      p.age += dt;
      if (p.age >= p.life || p.y < -40) spawn(p, false);

      const k = p.age / p.life;               // 0..1 along its little life
      // arise (fade in 0..0.18) → abide → pass (fade out 0.6..1)
      let a;
      if (k < 0.18) a = k / 0.18;
      else if (k > 0.6) a = 1 - (k - 0.6) / 0.4;
      else a = 1;
      a = Math.max(0, a) * p.bright;

      p.x += p.vx + Math.sin(t * p.sway + p.phase) * 0.12;
      p.y += p.vy * (1 + breath * 0.5);       // the field breathes

      // a gentle brightening near the cursor — presence
      if (pointer.on) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 26000) a = Math.min(1, a + (1 - d2 / 26000) * 0.6);
      }

      if (a <= 0.01) continue;
      const size = p.r * 16;
      ctx.globalAlpha = a * 0.85;
      ctx.drawImage(glow, p.x - size / 2, p.y - size / 2, size, size);
    }

    // the present nexus — cached aura gradient; breath drives the alpha, so
    // no per-frame gradient allocation
    ctx.globalAlpha = 0.05 + breath * 0.05;
    ctx.fillStyle = auraGradient;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  // ---------- breath ----------
  const BREATH_PERIOD = 11; // seconds, one calm cycle
  let lastBreathLbl = '';
  function breathAt(now) {
    const phase = (now / 1000) % BREATH_PERIOD / BREATH_PERIOD; // 0..1
    const v = (1 - Math.cos(phase * Math.PI * 2)) / 2;          // smooth 0..1..0
    const word = phase < 0.5 ? 'breathe in' : 'breathe out';
    if (word !== lastBreathLbl) { el.breathLbl.textContent = word; lastBreathLbl = word; }
    return v;
  }

  // ---------- main loop ----------
  let lastT = performance.now();
  function frame(t) {
    const now = Date.now();
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;

    // ease canvas accent toward the active lens
    const target = ACCENTS[lens];
    for (let i = 0; i < 3; i++) acc[i] += (target[i] - acc[i]) * 0.05;
    buildGlow();

    const breath = reduceMotion ? 0.5 : breathAt(now);
    el.body.style.setProperty('--breath', breath.toFixed(3));

    updateReadout(now);
    stepField(now, dt, breath);

    requestAnimationFrame(frame);
  }

  // ---------- lens switching ----------
  function setLens(key) {
    if (!ACCENTS[key]) return;
    lens = key;
    el.body.dataset.lens = key;
    for (const btn of el.lenses.querySelectorAll('.lens')) {
      btn.classList.toggle('is-active', btn.dataset.lens === key);
    }
    applyLensCopy();
    writeURL(); // keep the lens shareable
  }

  el.lenses.addEventListener('click', (e) => {
    const btn = e.target.closest('.lens');
    if (btn) setLens(btn.dataset.lens);
  });
  addEventListener('keydown', (e) => {
    if (e.target.matches('input')) return;
    if (e.key === '1') setLens('life');
    if (e.key === '2') setLens('stillness');
    if (e.key === '3') setLens('anu');
  });

  // ---------- config panel ----------
  // tap anywhere outside the panel (and not on its openers) closes it
  function onOutsidePointer(e) {
    if (!el.panel.contains(e.target) && e.target !== el.cfgToggle && e.target !== el.cfgLink) {
      closePanel();
    }
  }
  function openPanel() {
    el.panel.classList.add('is-open');
    el.panel.setAttribute('aria-hidden', 'false');
    el.cfgToggle.setAttribute('aria-expanded', 'true');
    // defer so the click that opened it doesn't immediately close it
    setTimeout(() => document.addEventListener('pointerdown', onOutsidePointer), 0);
  }
  function closePanel() {
    el.panel.classList.remove('is-open');
    el.panel.setAttribute('aria-hidden', 'true');
    el.cfgToggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutsidePointer);
  }
  function togglePanel() { el.panel.classList.contains('is-open') ? closePanel() : openPanel(); }

  function fillForm() {
    for (const k of Object.keys(DEFAULTS)) {
      const input = el.cfgForm.elements[k];
      if (input) input.value = cfg[k];
    }
    updateNote();
  }

  function updateNote() {
    const m = lensModel('anu');
    const perDay = m.perDay.toFixed(1);
    const yr = new Date(m.horizon).getFullYear();
    el.panelNote.textContent = `together: ${perDay} waking hrs/day · until ${yr} (age ${cfg.togetherToAge})`;
  }

  el.cfgForm.addEventListener('input', () => {
    const next = { ...cfg };
    for (const k of Object.keys(DEFAULTS)) {
      const input = el.cfgForm.elements[k];
      if (!input) continue;
      next[k] = (k === 'herName') ? input.value : input.value;
    }
    cfg = sanitize(next);
    persist();
    applyLensCopy();
    updateNote();
  });

  el.cfgReset.addEventListener('click', () => {
    cfg = { ...DEFAULTS };
    try { localStorage.removeItem(KEY); } catch (_) {}
    writeURL(); // preserves the lens param if non-default
    fillForm();
    applyLensCopy();
  });

  el.cfgToggle.addEventListener('click', togglePanel);
  el.panelClose.addEventListener('click', closePanel);
  el.cfgLink.addEventListener('click', (e) => { e.preventDefault(); openPanel(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

  // ---------- pointer presence ----------
  addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; });
  addEventListener('pointerleave', () => { pointer.on = false; });
  addEventListener('pointerdown', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; });

  // ---------- go ----------
  addEventListener('resize', resize);
  resize();
  buildGlow();
  const startLens = (() => {
    const l = new URLSearchParams(location.search).get('lens');
    if (ACCENTS[l]) return l;
    if (ACCENTS[window.ANICCA_DEFAULT_LENS]) return window.ANICCA_DEFAULT_LENS;
    if (ACCENTS[document.body.dataset.lens]) return document.body.dataset.lens; // initial <body data-lens>, CSP-safe
    return 'anu';
  })();
  setLens(startLens);
  fillForm();
  requestAnimationFrame((t) => { lastT = t; frame(t); });
})();
