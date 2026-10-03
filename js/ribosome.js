/*
 * The home page's pixel scene: the mRNA is a railway; a ribosome rides it
 * from 5' to 3', calls out each amino acid, collects tRNAs and trails its
 * peptide, which floats off at the stop codon. The hills behind follow a
 * nanopore signal. Drawn on a small canvas (<canvas data-scene="ribosome">)
 * that CSS scales up with image-rendering: pixelated, at 12 frames a second.
 *
 * Under prefers-reduced-motion it shows one still frame instead, partway
 * along with some peptide grown, and follows the setting if it changes.
 *
 * Loaded with defer, from _includes/hero.html, only on pages with a hero.
 */
(() => {
  'use strict';

  const BASE = { A: '#2e9a3e', C: '#2b6ca3', G: '#e08a00', U: '#d23630' };

  // 3x5 pixel font, five rows of three: what the amino acid names need
  const FONT = {
    A: '.#. #.# ### #.# #.#', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.', E: '### #.. ##. #.. ###',
    F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#', I: '### .#. .#. .#. ###',
    K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###', M: '#.# ### ### #.# #.#', N: '### #.# #.# #.# #.#',
    O: '.#. #.# #.# #.# .#.', P: '##. #.# ##. #.. #..', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.',
    T: '### .#. .#. .#. .#.', U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#.# #.# ### ### #.#',
    Y: '#.# #.# .#. .#. .#.', 5: '### #.. ##. ..# ##.', "'": '.#. .#. ... ... ...', ' ': '... ... ... ... ...'
  };
  Object.keys(FONT).forEach((k) => { FONT[k] = FONT[k].replace(/ /g, ''); });

  function text(ctx, str, x, y, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]] || FONT[' '];
      for (let p = 0; p < 15; p++) if (g[p] === '#') ctx.fillRect(x + i * 4 + (p % 3), y + Math.floor(p / 3), 1, 1);
    }
  }
  function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  // A small fixed-seed generator, so the scene is the same on every visit.
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function randomBases(r, n) { let out = ''; for (let i = 0; i < n; i++) out += 'ACGU'[Math.floor(r() * 4)]; return out; }

  // The standard genetic code, codons in ACGU order.
  const CODE = 'KNKNTTTTRSRSIIMIQHQHPPPPRRRRLLLLEDEDAAAAGGGGVVVV*Y*YSSSS*CWCLFLF';
  const THREE = { A: 'ALA', R: 'ARG', N: 'ASN', D: 'ASP', C: 'CYS', Q: 'GLN', E: 'GLU', G: 'GLY', H: 'HIS', I: 'ILE',
    L: 'LEU', K: 'LYS', M: 'MET', F: 'PHE', P: 'PRO', S: 'SER', T: 'THR', W: 'TRP', Y: 'TYR', V: 'VAL' };
  function translate(codon) { let i = 0; for (let j = 0; j < 3; j++) i = i * 4 + 'ACGU'.indexOf(codon[j]); return CODE[i]; }

  // One scene of width w (in scene pixels); returns its draw(ctx, t).
  function make(w, h) {
    const r = rng(11), rail = 56, start = 14, nCodons = Math.max(8, Math.floor((w - 60) / 9));
    let seq = 'AUG';
    while (seq.length < (nCodons - 1) * 3) { const cd = randomBases(r, 3); if (translate(cd) !== '*') seq += cd; }
    seq += 'UAA';
    const end = start + seq.length * 3, far = [], near = [];
    let lv = 34;
    for (let x = 0; x < w; x++) {
      if (x % 6 === 0) lv = 30 + Math.floor(r() * 9);          // distant hills: a nanopore signal
      far.push(lv); near.push(42 + Math.round(Math.sin(x * 0.05) * 3 + Math.sin(x * 0.13) * 2));
    }
    let pos = start, chain = [], label = '', labelT = 0, drop = null, lastCodon = -1, float = null, splitT = 0;
    // Two stops on the way: a surprise a third of the way along the CDS, a
    // puzzle at two thirds. mood is the face; pauseT counts the frames left.
    const PAUSE = 10;                                            // 0.8 s at 12 frames a second
    const surpriseAt = Math.round(start + (end - start) / 3) - 7;
    const puzzleAt = Math.round(start + (end - start) * 2 / 3) - 7;
    let mood = '', pauseT = 0;
    const clouds = [];
    for (let i = 0; i < Math.max(2, Math.floor(w / 90)); i++) clouds.push({ x: r() * w, y: 4 + Math.floor(r() * 14), s: 0.15 + r() * 0.2 });

    function cloud(ctx, cx, cy) {
      rect(ctx, cx + 3, cy, 6, 1, '#ffffff'); rect(ctx, cx + 1, cy + 1, 11, 2, '#ffffff'); rect(ctx, cx, cy + 3, 14, 1, '#f4f5fe');
    }
    // The large subunit, 20 wide, with a face: blinking as a rule, startled
    // (wide eyes, open mouth) or puzzled (brow up, one eye narrowed, mouth to
    // one side) when it stops.
    function large(ctx, x, top, t, face) {
      const W = '#ffffff';
      rect(ctx, x - 3, top + 1, 20, 10, '#6b5fd3'); rect(ctx, x - 1, top, 16, 1, '#6b5fd3');
      rect(ctx, x - 2, top + 2, 2, 2, '#8a7fe3');
      if (face === 'surprised') {
        rect(ctx, x + 3, top + 3, 2, 3, W); rect(ctx, x + 10, top + 3, 2, 3, W);
        rect(ctx, x + 6, top + 7, 3, 2, W);
      } else if (face === 'puzzled') {
        rect(ctx, x + 2, top + 2, 4, 1, W);
        rect(ctx, x + 3, top + 4, 2, 2, W); rect(ctx, x + 10, top + 5, 2, 1, W);
        rect(ctx, x + 8, top + 8, 3, 1, W);
      } else {
        const blink = (t % 30) < 2;
        rect(ctx, x + 3, top + 4, 2, blink ? 1 : 2, W); rect(ctx, x + 10, top + 4, 2, blink ? 1 : 2, W);
        rect(ctx, x + 6, top + 8, 3, 1, W);
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
      [['#1a1f3a', 1], ['#ffc21a', 0]].forEach(([color, off]) => {
        rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') rect(ctx, x + i + off, y + j + off - lift, 1, 1, color); });
      });
    }

    function draw(ctx, t) {
      rect(ctx, 0, 0, w, h, '#e8ebfb');
      clouds.forEach((c) => { c.x += c.s; if (c.x > w) c.x = -16; cloud(ctx, Math.round(c.x), c.y); });
      for (let x = 0; x < w; x++) { rect(ctx, x, far[x], 1, h - far[x], '#d6daf7'); rect(ctx, x, near[x], 1, h - near[x], '#c3caf2'); }
      rect(ctx, 0, rail + 5, w, h - rail - 5, '#b3bbe9');
      for (let i = 0; i < seq.length; i++) rect(ctx, start + i * 3, rail, 2, 5, BASE[seq[i]]);   // one tie per base
      for (let a = 0; a < 9; a++) rect(ctx, end + a * 3, rail, 2, 5, BASE.A);                     // poly(A)
      rect(ctx, 0, rail, w, 1, '#1a1f3a'); rect(ctx, 0, rail + 4, w, 1, '#1a1f3a');
      // the 5' cap, wearing its name: a little cap on the first base
      rect(ctx, start - 6, rail - 3, 7, 3, '#e08a00'); rect(ctx, start - 5, rail - 5, 5, 2, '#e08a00'); rect(ctx, start + 1, rail - 1, 3, 1, '#b86f00');
      text(ctx, "5'", 2, rail - 12, '#1a1f3a');
      text(ctx, 'AAAA', Math.min(w - 18, end + 30), rail - 8, BASE.A);

      if (splitT > 0) {                                          // terminated: the subunits part, the protein drifts off
        const s = splitT++;                                      // 1 on the first frame after the stop: a pixel at a time
        if (float) { float.y -= 1; float.beads.forEach((b, k) => { rect(ctx, float.x + Math.round(Math.sin(k + t * 0.3) * 3), float.y - k * 2, 2, 2, b); }); }
        large(ctx, pos, rail - 11 - s, t, '');                   // up and away, still itself
        small(ctx, pos + Math.max(0, s - 4) * 2, rail + 1 + Math.min(s, 4));   // drops off the rail, rolls away
        if (splitT > 56) { pos = start; chain = []; splitT = 0; float = null; lastCodon = -1; mood = ''; pauseT = 0; }
        return;
      }
      if (pauseT > 0) {                                          // stopped at a ! or a ?
        pauseT--;
        if (pauseT === 0) mood = '';
      } else {
        pos += 1;
        if (pos === surpriseAt) { mood = 'surprised'; pauseT = PAUSE; }
        else if (pos === puzzleAt) { mood = 'puzzled'; pauseT = PAUSE; }
      }
      const codonIdx = Math.floor((pos - start + 6) / 9);
      if (codonIdx !== lastCodon && codonIdx >= 0 && codonIdx < seq.length / 3) {
        lastCodon = codonIdx;
        const aa = translate(seq.substr(codonIdx * 3, 3));
        if (drop) { chain.unshift(drop.color); drop = null; }   // the previous tRNA docks at once
        if (aa === '*') {
          // The stop codon: this frame still shows the whole ribosome with its
          // peptide (returning here instead left one frame without them), and
          // the parting starts with the next.
          splitT = 1; float = { x: pos + 2, y: rail - 16, beads: chain.slice() };
        } else {
          label = THREE[aa]; labelT = 10;
          drop = { y: 0, color: ['#e08a00', '#2e9a3e', '#2b6ca3', '#d23630', '#8a5cc4'][codonIdx % 5] };
        }
      }
      if (drop) {                                                // a tRNA dropping in with its amino acid
        drop.y += 7;
        const dx = pos + 9, dy = Math.min(drop.y, rail - 18);
        rect(ctx, dx, dy, 2, 6, '#f2a541'); rect(ctx, dx - 2, dy + 4, 4, 2, '#f2a541'); rect(ctx, dx, dy - 2, 2, 2, drop.color);
        if (drop.y >= rail - 18) { chain.unshift(drop.color); drop = null; }
      }
      for (let k = 0; k < chain.length; k++) {                   // the peptide, trailing from the exit tunnel
        const bx = pos - 3 - k * 2, by = rail - 14 - Math.round(k * 0.8) + Math.round(Math.sin(k * 0.7 + t * 0.25) * 2);
        if (by > 0) rect(ctx, bx, by, 2, 2, chain[k]);
      }
      large(ctx, pos, rail - 11, t, mood);
      small(ctx, pos, rail + 1);
      if (mood) mark(ctx, pos + 19, rail - 21, mood === 'surprised' ? '!' : '?', pauseT);
      if (labelT > 0) { labelT--; text(ctx, label, pos + 7 - label.length * 2, rail - 28, '#1a1f3a'); }
      if (pos > end + 30) pos = start;
    }
    // For the still frame: how far along the CDS (0 to 1), and whether the
    // last frame is a tidy one -- tRNA docked, amino acid named, eyes open.
    draw.progress = () => (pos - start) / (end - start);
    draw.tidy = (t) => !drop && !mood && labelT > 0 && t % 30 >= 2;
    return draw;
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  function start(canvas) {
    const ctx = canvas.getContext('2d');
    let draw, t = 0, lastW = 0, lastScale = 0, timer = null;
    // One scene pixel is as many screen pixels as the CSS height has room for
    // (4, 3 or 2: css/main.scss picks the height by window size). Rebuilt only
    // when the width or that scale changes: phones fire resize while scrolling.
    function size() {
      const cssW = canvas.clientWidth || (canvas.parentNode && canvas.parentNode.clientWidth) || 1280;
      const scale = Math.max(1, Math.round((canvas.clientHeight || 288) / 72));
      if (cssW === lastW && scale === lastScale) return;
      lastW = cssW;
      lastScale = scale;
      canvas.width = Math.ceil(cssW / scale);
      canvas.height = 72;
      ctx.imageSmoothingEnabled = false;
      draw = make(canvas.width, canvas.height);
      if (still.matches) {                                      // the still: a tidy frame just short of halfway
        for (let i = 0; i < 2000 && (draw.progress() < 0.45 || !draw.tidy(t - 1)); i++) draw(ctx, t++);
      } else {
        for (let i = 0; i < 30; i++) draw(ctx, t++);            // open on a frame with the ribosome under way
      }
    }
    function run() {
      clearInterval(timer);
      timer = null;
      if (still.matches) { lastW = 0; size(); }                 // redrawn as the still
      else timer = setInterval(() => { size(); draw(ctx, t++); }, 1000 / 12);
    }
    size();
    run();
    window.addEventListener('resize', size);
    still.addEventListener('change', run);
  }

  document.querySelectorAll('canvas[data-scene="ribosome"]').forEach(start);
})();
