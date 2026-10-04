/*
 * The home page's pixel scene: the mRNA is a railway; a ribosome rides it
 * from 5' to 3', calls out each amino acid, collects tRNAs and trails its
 * peptide, which floats off at the stop codon. The hills behind follow a
 * nanopore signal. Drawn on a small canvas (<canvas data-scene="ribosome">)
 * that CSS scales up with image-rendering: pixelated, at 12 frames a second.
 *
 * Under prefers-reduced-motion it shows one still frame instead, partway
 * along with some peptide grown, and follows the setting if it changes. It
 * draws nothing while the scene is out of view or the tab is hidden.
 *
 * A hidden game lives in js/ribosome-game.js. On a desktop, Space while the
 * scene is in view (and keyboard focus is on the page or in the masthead)
 * sends the ribosome running at the stop codon; jump it and the RNA grows on
 * without end. That file is fetched only then, from the canvas's data-game
 * address with its data-game-integrity hash, and this one hands it the scene
 * through `api` below.
 *
 * Loaded with defer, from _includes/hero.html, only on pages with a hero.
 */
(() => {
  'use strict';

  const BASE = { A: '#2e9a3e', C: '#2b6ca3', G: '#e08a00', U: '#d23630' };
  const INK = '#1a1f3a', WHITE = '#ffffff', SKY = '#e8ebfb';
  const DROPS = ['#e08a00', '#2e9a3e', '#2b6ca3', '#d23630', '#8a5cc4'];
  const H = 72, RAIL = 56, START = 14, PAUSE = 10;

  // 3x5 pixel font, five rows of three: what the amino acid names and the game's score need
  const FONT = {
    A: '.#. #.# ### #.# #.#', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.', E: '### #.. ##. #.. ###',
    F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#', I: '### .#. .#. .#. ###',
    K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###', M: '#.# ### ### #.# #.#', N: '### #.# #.# #.# #.#',
    O: '.#. #.# #.# #.# .#.', P: '##. #.# ##. #.. #..', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.',
    T: '### .#. .#. .#. .#.', U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#.# #.# ### ### #.#',
    Y: '#.# #.# .#. .#. .#.', "'": '.#. .#. ... ... ...', ' ': '... ... ... ... ...',
    0: '### #.# #.# #.# ###', 1: '.#. ##. .#. .#. ###', 2: '##. ..# .#. #.. ###', 3: '##. ..# .#. ..# ##.',
    4: '#.# #.# ### ..# ..#', 5: '### #.. ##. ..# ##.', 6: '.## #.. ### #.# ###', 7: '### ..# .#. .#. .#.',
    8: '### #.# ### #.# ###', 9: '### #.# ### ..# ##.', a: '... ##. .## #.# ###'
  };
  Object.keys(FONT).forEach((k) => { FONT[k] = FONT[k].replace(/ /g, ''); });

  // Text comes from a sheet of the glyphs drawn once per colour: one drawImage a character.
  const GLYPH = {};
  Object.keys(FONT).forEach((k, i) => { GLYPH[k] = i; });
  const sheets = {};
  function sheet(color) {
    if (sheets[color]) return sheets[color];
    const c = document.createElement('canvas');
    c.width = Object.keys(FONT).length * 4; c.height = 5;
    const g = c.getContext('2d');
    g.fillStyle = color;
    Object.keys(FONT).forEach((k, i) => { for (let p = 0; p < 15; p++) if (FONT[k][p] === '#') g.fillRect(i * 4 + (p % 3), Math.floor(p / 3), 1, 1); });
    return (sheets[color] = c);
  }
  function text(ctx, str, x, y, color) {
    const sh = sheet(color);
    x = Math.round(x); y = Math.round(y);
    for (let i = 0; i < str.length; i++) {
      const gi = GLYPH[str[i]];
      if (gi !== undefined && str[i] !== ' ') ctx.drawImage(sh, gi * 4, 0, 3, 5, x + i * 4, y, 3, 5);
    }
  }
  // The fill colour is set only when it changes (ctx.lastFill remembers it).
  function rect(ctx, x, y, w, h, color) {
    if (ctx.lastFill !== color) { ctx.fillStyle = color; ctx.lastFill = color; }
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  // A small fixed-seed generator, so the scene is the same on every visit.
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function randomBases(r, n) { let out = ''; for (let i = 0; i < n; i++) out += 'ACGU'[Math.floor(r() * 4)]; return out; }
  // A fixed hash of an integer, for terrain and bases that must not change as they scroll back into view.
  function hash(i) {
    let x = (Math.imul(i | 0, 374761393) + 668265263) | 0;
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  }

  // The standard genetic code, codons in ACGU order.
  const CODE = 'KNKNTTTTRSRSIIMIQHQHPPPPRRRRLLLLEDEDAAAAGGGGVVVV*Y*YSSSS*CWCLFLF';
  const THREE = { A: 'ALA', R: 'ARG', N: 'ASN', D: 'ASP', C: 'CYS', Q: 'GLN', E: 'GLU', G: 'GLY', H: 'HIS', I: 'ILE',
    L: 'LEU', K: 'LYS', M: 'MET', F: 'PHE', P: 'PRO', S: 'SER', T: 'THR', W: 'TRP', Y: 'TYR', V: 'VAL' };
  function translate(codon) { let i = 0; for (let j = 0; j < 3; j++) i = i * 4 + 'ACGU'.indexOf(codon[j]); return CODE[i]; }

  // The two ranges of hills (the far one a nanopore signal), drawn once into strips that repeat
  // every TILE pixels (a multiple of the far range's 6-px steps, and whole periods of the near
  // range's two waves), then copied in at the camera's parallax offsets.
  const TILE = 1020;
  function strip(color, level) {
    const c = document.createElement('canvas');
    c.width = TILE; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = color;
    for (let x = 0; x < TILE; x++) { const y = level(x); g.fillRect(x, y, 1, H - y); }
    return c;
  }
  const FAR = strip('#d6daf7', (x) => 30 + Math.floor(hash(Math.floor(x / 6) + 7) * 9));
  const NEAR = strip('#c3caf2', (x) => 42 + Math.round(Math.sin(2 * Math.PI * 8 * x / TILE) * 3 + Math.sin(2 * Math.PI * 21 * x / TILE) * 2));
  function hills(ctx, tile, offset, width) {
    for (let x = -(((Math.round(offset) % TILE) + TILE) % TILE); x < width; x += TILE) ctx.drawImage(tile, x, 0);
  }

  function cloud(ctx, cx, cy) {
    rect(ctx, cx + 3, cy, 6, 1, WHITE); rect(ctx, cx + 1, cy + 1, 11, 2, WHITE); rect(ctx, cx, cy + 3, 14, 1, '#f4f5fe');
  }
  // The large subunit, 20 wide, with a face: blinking as a rule, startled
  // (wide eyes, open mouth) or puzzled (brow up, one eye narrowed, mouth to
  // one side) when it stops.
  function large(ctx, x, top, t, face) {
    rect(ctx, x - 3, top + 1, 20, 10, '#6b5fd3'); rect(ctx, x - 1, top, 16, 1, '#6b5fd3');
    rect(ctx, x - 2, top + 2, 2, 2, '#8a7fe3');
    if (face === 'surprised') {
      rect(ctx, x + 3, top + 3, 2, 3, WHITE); rect(ctx, x + 10, top + 3, 2, 3, WHITE);
      rect(ctx, x + 6, top + 7, 3, 2, WHITE);
    } else if (face === 'puzzled') {
      rect(ctx, x + 2, top + 2, 4, 1, WHITE);
      rect(ctx, x + 3, top + 4, 2, 2, WHITE); rect(ctx, x + 10, top + 5, 2, 1, WHITE);
      rect(ctx, x + 8, top + 8, 3, 1, WHITE);
    } else {
      const blink = (t % 30) < 2;
      rect(ctx, x + 3, top + 4, 2, blink ? 1 : 2, WHITE); rect(ctx, x + 10, top + 4, 2, blink ? 1 : 2, WHITE);
      rect(ctx, x + 6, top + 8, 3, 1, WHITE);
    }
  }
  function small(ctx, x, top) {                                // the small subunit, under the rail
    rect(ctx, x - 2, top, 18, 6, '#9e95ef'); rect(ctx, x, top + 6, 14, 1, '#8a7fe3');
  }
  // A yellow ! or ? beside the ribosome, with a dark shadow so it reads on
  // the pale sky; it pops up a pixel for its first two frames.
  function mark(ctx, x, y, glyph, left) {
    const rows = glyph === '!' ? ['###', '###', '###', '###', '###', '...', '###', '###']
                               : ['.####.', '##..##', '....##', '...##.', '..##..', '......', '..##..', '..##..'];
    const lift = left > PAUSE - 2 ? 1 : 0;
    [[INK, 1], ['#ffc21a', 0]].forEach(([color, off]) => {
      rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') rect(ctx, x + i + off, y + j + off - lift, 1, 1, color); });
    });
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  // The game is for a keyboard and a large screen.
  const desktop = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 800px)');

  function start(canvas) {
    const ctx = canvas.getContext('2d');
    const masthead = canvas.closest('.masthead') || canvas.parentNode;
    const S = { frame: 0 };
    let game = null, loading = false, pending = null;

    // The mRNA for a scene this wide: AUG, sense codons, UAA; and where the ribosome pauses.
    function setupWorld(w) {
      const r = rng(11);
      const nCodons = Math.max(8, Math.floor((w - 60) / 9));
      let seq = 'AUG';
      while (seq.length < (nCodons - 1) * 3) { const cd = randomBases(r, 3); if (translate(cd) !== '*') seq += cd; }
      seq += 'UAA';
      S.seq = seq;
      S.end = START + seq.length * 3;
      S.stopTie = seq.length - 3;                              // first tie of the stop codon
      S.stopCodon = seq.length / 3 - 1;
      // Two stops on the way: a surprise a third of the way along the CDS, a puzzle at two thirds.
      S.surpriseAt = Math.round(START + (S.end - START) / 3) - 7;
      S.puzzleAt = Math.round(START + (S.end - START) * 2 / 3) - 7;
      S.aaaaX = Math.min(w - 18, S.end + 30);
      S.clouds = [];
      for (let i = 0; i < Math.max(2, Math.floor(w / 90)); i++) S.clouds.push({ x: r() * w, y: 4 + Math.floor(r() * 14), s: 0.15 + r() * 0.2 });
    }
    // Back to a ribosome at the 5' end, and none of the game's state.
    function resetAmbient() {
      Object.assign(S, { mode: 'ambient', pos: START, chain: [], label: '', labelT: 0, drop: null, lastCodon: -1, float: null,
        splitT: 0, mood: '', pauseT: 0, yoff: 0, vy: 0, held: false, cam: 0, read: false, growX: 0, flash: 0, banner: null,
        obstacles: [], nextObs: 0, speed: 0, score: 0, mass: 0, residues: 0, record: false, crashT: 0, overT: 0, blink: false });
    }
    // For the still frame: how far along the CDS (0 to 1), and whether the frame is a tidy one:
    // tRNA docked, amino acid named, eyes open.
    function progress() { return (S.pos - START) / (S.end - START); }
    function tidy() { return !S.drop && !S.mood && S.labelT > 0 && Math.floor(S.frame / 5) % 30 >= 2; }
    // A fresh scene: the still, a tidy frame just short of halfway; or a frame with the ribosome under way.
    function fresh() {
      resetAmbient();
      if (still.matches) { for (let i = 0; i < 2000 && (progress() < 0.45 || !tidy()); i++) ambientTick(); }
      else for (let i = 0; i < 30; i++) ambientTick();
    }

    // One scene pixel is as many screen pixels as the CSS height has room for (4, 3 or 2:
    // css/main.scss picks the height by window size). Rebuilt only when the width or that scale
    // changes: phones fire resize while scrolling.
    function size() {
      const scale = Math.max(1, Math.round((canvas.clientHeight || 288) / H));
      const w = Math.ceil((canvas.clientWidth || (canvas.parentNode && canvas.parentNode.clientWidth) || 1280) / scale);
      if (w === S.W && scale === S.scale) return;
      S.W = w; S.scale = scale;
      canvas.width = w; canvas.height = H;                     // which also resets the context's state
      ctx.imageSmoothingEnabled = false;
      ctx.lastFill = null;
      if (!S.mode || S.mode === 'ambient') { setupWorld(w); fresh(); }
    }

    // Track colours: the coding sequence, then nine A's of tail; past them, only the game's RNA.
    function tieColor(i) {
      if (i < 0) return null;
      if (S.read && game) { const c = game.tie(i); if (c !== undefined) return c; }
      if (i < S.seq.length) return BASE[S.seq[i]];
      if (i < S.seq.length + 9) return BASE.A;
      return null;
    }

    // A codon reached: the tRNA that brought it docks, and the next drops in with its amino acid
    // (or, while running, docks at once); the stop codon ends translation unless jumped.
    function readCodon(withDrops) {
      const idx = Math.floor((S.pos - START + 6) / 9);
      if (idx === S.lastCodon || idx < 0) return null;
      S.lastCodon = idx;
      if (S.drop) { S.chain.unshift(S.drop.color); S.drop = null; }
      if (!S.read) {
        if (idx >= S.stopCodon) return idx === S.stopCodon ? 'stop' : null;
        S.label = THREE[translate(S.seq.substr(idx * 3, 3))]; S.labelT = 10;
      } else if (game) game.codon(idx);
      if (withDrops) S.drop = { y: 0, color: DROPS[idx % 5] };
      else S.chain.unshift(DROPS[idx % 5]);
      if (S.chain.length > 80) S.chain.length = 80;
      return 'codon';
    }

    // Terminated: the subunits part and the protein drifts off.
    function terminate() {
      S.splitT = 1;
      S.float = { x: S.pos + 2, y: RAIL - 16 - S.yoff, beads: S.chain.slice(0, 40) };
      S.chain = [];
    }

    // The scene as it always runs, at 12 frames a second.
    function ambientTick() {
      S.frame += 5;
      if (S.splitT > 0) {
        S.splitT++;
        if (S.float) S.float.y -= 1;
        if (S.splitT > 56) resetAmbient();
        return;
      }
      if (S.pauseT > 0) {                                      // stopped at a ! or a ?
        S.pauseT--;
        if (!S.pauseT) S.mood = '';
      } else {
        S.pos += 1;
        if (S.pos === S.surpriseAt) { S.mood = 'surprised'; S.pauseT = PAUSE; }
        else if (S.pos === S.puzzleAt) { S.mood = 'puzzled'; S.pauseT = PAUSE; }
      }
      if (readCodon(true) === 'stop') terminate();
      if (S.drop) { S.drop.y += 7; if (S.drop.y >= RAIL - 18) { S.chain.unshift(S.drop.color); S.drop = null; } }
      if (S.labelT > 0) S.labelT--;
      for (let i = 0; i < S.clouds.length; i++) { const c = S.clouds[i]; c.x += c.s; if (c.x > S.W) c.x = -16; }
    }

    function draw() {
      const W = S.W, cam = Math.round(S.cam), tick = Math.floor(S.frame / 5);
      rect(ctx, 0, 0, W, H, SKY);
      const span = W + 16;
      for (let i = 0; i < S.clouds.length; i++) {
        const c = S.clouds[i];
        cloud(ctx, ((Math.round(c.x - cam * 0.15) % span) + span) % span - 16, c.y);
      }
      hills(ctx, FAR, cam * 0.35, W);
      hills(ctx, NEAR, cam * 0.6, W);
      rect(ctx, 0, RAIL + 5, W, H - RAIL - 5, '#b3bbe9');
      const i0 = Math.floor((cam - START) / 3) - 1;              // one tie per base
      for (let i = Math.max(0, i0); i <= i0 + W / 3 + 3; i++) {
        const c = tieColor(i);
        if (c) rect(ctx, START + i * 3 - cam, RAIL, 2, 5, c);
      }
      rect(ctx, 0, RAIL, W, 1, INK); rect(ctx, 0, RAIL + 4, W, 1, INK);
      if (cam < START + 10) {                                    // the 5' cap, wearing its name: a little cap on the first base
        rect(ctx, START - 6 - cam, RAIL - 3, 7, 3, '#e08a00'); rect(ctx, START - 5 - cam, RAIL - 5, 5, 2, '#e08a00');
        rect(ctx, START + 1 - cam, RAIL - 1, 3, 1, '#b86f00');
        text(ctx, "5'", 2 - cam, RAIL - 12, INK);
      }
      const tail = S.read && game ? game.tailX() : S.aaaaX;    // the 3' end, carried off as the game's RNA grows
      if (tail - cam < W) text(ctx, 'AAAA', tail - cam, RAIL - 8, BASE.A);
      if (game) game.drawWorld(ctx, cam);

      const sx = Math.round(S.pos - cam), yo = Math.round(S.yoff);
      if (S.splitT > 0) {                                        // terminated: the subunits part, the protein drifts off
        const s = Math.floor(S.splitT);
        if (S.float) {
          for (let k = 0; k < S.float.beads.length; k++) {
            rect(ctx, S.float.x - cam + Math.round(Math.sin(k + tick * 0.3) * 3), S.float.y - k * 2, 2, 2, S.float.beads[k]);
          }
        }
        large(ctx, sx, RAIL - 11 - yo - s, tick, '');            // up and away, still itself
        small(ctx, sx + Math.max(0, s - 4) * 2, RAIL + 1 + Math.min(s, 4) - yo);   // drops off the rail, rolls away
      } else {
        for (let k = 0; k < Math.min(S.chain.length, 60); k++) {   // the peptide, trailing from the exit tunnel
          const bx = sx - 3 - k * 2;
          const by = RAIL - 14 - Math.round(k * 0.8) + Math.round(Math.sin(k * 0.7 + tick * 0.25) * 2) - Math.round(S.yoff * Math.max(0, 1 - k / 10));
          if (by > 0 && bx > -2) rect(ctx, bx, by, 2, 2, S.chain[k]);
        }
        if (S.drop) {                                            // a tRNA dropping in with its amino acid
          const dx = sx + 9, dy = Math.min(S.drop.y, RAIL - 18);
          rect(ctx, dx, dy, 2, 6, '#f2a541'); rect(ctx, dx - 2, dy + 4, 4, 2, '#f2a541'); rect(ctx, dx, dy - 2, 2, 2, S.drop.color);
        }
        large(ctx, sx, RAIL - 11 - yo, tick, S.mood);
        small(ctx, sx, RAIL + 1 - yo);
        if (S.mood) mark(ctx, sx + 19, RAIL - 21 - yo, S.mood === 'surprised' ? '!' : '?', S.pauseT);
        if (S.labelT > 0 && S.label) text(ctx, S.label, sx + 7 - S.label.length * 2, RAIL - 28 - yo, INK);
      }
      if (game) game.drawOverlay(ctx, cam);
    }

    // ---- Clocks ----------------------------------------------------------------
    // The scene (and the game's game-over screen) runs on a 12-a-second timer; the game runs on
    // animation frames, stepping 60 times a second whatever the display's rate and drawing only
    // the frames in which it stepped. Nothing runs while the scene is out of view or the tab is
    // hidden, nor for the still under reduced motion; a game left that way waits until it is back.
    const STEP = 1000 / 60;
    let raf = 0, timer = 0, last = 0, acc = 0, inView = true;
    function playing() { return !!game && game.playing(); }
    function schedule() {
      cancelAnimationFrame(raf); clearInterval(timer); raf = 0; timer = 0;
      if (!inView || document.hidden) return;
      if (playing()) { last = performance.now(); acc = 0; raf = requestAnimationFrame(frame); }
      else if (S.mode !== 'ambient' || !still.matches) timer = setInterval(slowTick, 1000 / 12);
    }
    function slowTick() {
      if (S.mode === 'ambient') { ambientTick(); draw(); }
      else if (game) { S.frame += 5; if (game.slow()) draw(); }
    }
    function frame(now) {
      acc += Math.min(100, now - last);
      last = now;
      let stepped = false;
      while (acc >= STEP && playing()) { acc -= STEP; game.step(); stepped = true; }
      if (stepped) draw();
      if (playing()) { raf = requestAnimationFrame(frame); return; }
      if (S.mode === 'ambient' && still.matches) { fresh(); draw(); }   // missed the stop codon: the still again
      schedule();                                              // game over, or the scene again: the slow clock
    }
    function backToAmbient() { fresh(); draw(); schedule(); }

    new IntersectionObserver((entries) => {
      const ratio = entries[entries.length - 1].intersectionRatio;
      const away = S.mode === 'over' && ratio < 0.3;           // the game-over screen scrolled away: the scene again
      if (away) { fresh(); draw(); }
      const was = inView;
      inView = ratio > 0;
      if (away || inView !== was) schedule();
    }, { threshold: [0, 0.3] }).observe(canvas);
    document.addEventListener('visibilitychange', schedule);
    still.addEventListener('change', () => { if (S.mode === 'ambient') { fresh(); draw(); } schedule(); });
    window.addEventListener('resize', () => { size(); draw(); });

    // ---- The game: fetched on first use ---------------------------------------
    const api = { S, RAIL, START, PAUSE, INK, WHITE, BASE, rect, text, hash, translate, readCodon, terminate };
    function withGame(then) {
      if (game) { then(); return; }
      pending = then;
      if (loading) return;
      loading = true;
      const s = document.createElement('script');
      s.src = canvas.dataset.game;
      s.integrity = canvas.dataset.gameIntegrity;
      s.onload = () => {
        if (typeof window.qbioRibosomeGame !== 'function') return;
        game = window.qbioRibosomeGame(api);
        const run = pending;
        pending = null;
        if (run) run();
      };
      s.onerror = () => { loading = false; };                  // try again on the next Space
      document.head.appendChild(s);
    }
    // Space starts the game while the scene is mostly in view and keyboard focus is on the page
    // itself or somewhere in the masthead; anywhere else (a form field, the page further down, a
    // phone) it keeps its usual job.
    function shownFraction() {
      const r = canvas.getBoundingClientRect();
      return Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)) / (r.height || 1);
    }
    function canStart() {
      if (!desktop.matches || !canvas.dataset.game || shownFraction() < 0.6) return false;
      const a = document.activeElement;
      if (!a || a === document.body || a === document.documentElement) return true;
      return masthead.contains(a) && !a.matches('input, textarea, select, button, [contenteditable]');
    }
    window.addEventListener('keydown', (e) => {
      const space = e.code === 'Space' || e.key === ' ';
      if (e.key === 'Escape' && S.mode !== 'ambient') { backToAmbient(); return; }
      if (!space) return;
      if (S.mode === 'ambient') {
        if (!canStart()) return;
        e.preventDefault();
        if (e.repeat || S.splitT > 0) return;
        S.held = true;
        withGame(() => { if (S.mode === 'ambient' && S.splitT === 0) { game.begin(); schedule(); } });
        return;
      }
      e.preventDefault();
      if (e.repeat || !game) return;
      S.held = true;
      game.press();
      if (playing() && !raf) schedule();                       // Space on the game-over screen: back to the game clock
    });
    window.addEventListener('keyup', (e) => { if (e.code === 'Space' || e.key === ' ') S.held = false; });

    size();
    draw();
    schedule();
  }

  document.querySelectorAll('canvas[data-scene="ribosome"]').forEach(start);
})();
