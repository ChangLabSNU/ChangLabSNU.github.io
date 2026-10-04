/*
 * The hidden game on the home page's pixel scene. js/ribosome.js fetches this
 * file the first time someone presses Space on a desktop with the scene in
 * view, then calls the factory below with the scene's state and drawing
 * helpers (`api`); the object it returns answers the scene's calls.
 *
 * Space sends the ribosome running at the stop codon. Jump clear of it and
 * the codon is read through: the RNA grows on past its old 3' end, without
 * end, from sense codons only, and hairpins and RNA-binding proteins rise out
 * of it to be jumped (hold Space to jump higher). Past 75000 Da come pairs of
 * hairpins too far apart for one jump and too close for comfort, closer
 * still past 100000. The score is the weight of the peptide made since the
 * readthrough, in daltons; the best one stays in this browser (localStorage).
 * A crash ends it with the scene's own termination. Space plays again; Esc,
 * or scrolling the scene away, goes back to the scene.
 *
 * Distances are in scene pixels and times in steps, 60 a second.
 */
window.qbioRibosomeGame = (api) => {
  'use strict';
  const { S, RAIL, START, PAUSE, INK, WHITE, BASE, rect, text, hash, translate } = api;
  const ACCENT = '#4b3fc4', MUTED = '#7b80a0';

  const JUMP_V = 4.2, G_HOLD = 0.22, G = 0.5;                  // take-off speed; gravity while Space is held on the way up, and otherwise
  const RUN_SPEED = 2.2, SPEED0 = 1.8, SPEED_MAX = 4.0, ACCEL = 0.0003;   // about 2.7 by 75000 Da, 2.9 by 100000
  // Obstacles take shape this far ahead of the ribosome whatever the window's width, so a wide
  // window gives no more warning than a narrow one; the ribosome stands far enough left for that
  // stretch to be on screen.
  const LOOK = 180;
  function anchor() { return Math.max(16, Math.min(S.W * 0.25, S.W - LOOK - 12)); }

  // Average residue masses in daltons; a peptide weighs their sum plus one water.
  const MASS = { A: 71.08, R: 156.19, N: 114.10, D: 115.09, C: 103.14, E: 129.12, Q: 128.13, G: 57.05, H: 137.14, I: 113.16,
    L: 113.16, K: 128.17, M: 131.19, F: 147.18, P: 97.12, S: 87.08, T: 101.10, W: 186.21, Y: 163.18, V: 99.13 };
  const WATER = 18.02;
  // The endless reading frame past the old 3' end: any of the 61 sense codons, never a stop.
  const SENSE = [];
  for (let i = 0; i < 64; i++) {
    const c = 'ACGU'[i >> 4] + 'ACGU'[(i >> 2) & 3] + 'ACGU'[i & 3];
    if (translate(c) !== '*') SENSE.push(c);
  }
  function endlessCodon(k) { return SENSE[Math.floor(hash(k * 7 + 3) * SENSE.length)]; }
  function daltons(n) { return Math.round(n) + ' Da'; }

  const KEY = 'qbio.ribosomeRun.best';
  let best = 0;
  try { best = parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch (e) { best = 0; }
  const hud = { score: -1, best: -1, text: '', hi: '' };      // the score's strings, rebuilt only when it changes

  function jump() { if (S.yoff === 0 && S.vy === 0) S.vy = JUMP_V; }
  function physics() {
    if (S.yoff > 0 || S.vy !== 0) {
      S.yoff += S.vy;
      S.vy -= (S.held && S.vy > 0) ? G_HOLD : G;
      if (S.yoff <= 0) { S.yoff = 0; S.vy = 0; }
    }
  }

  // Space in the scene: the ribosome jumps and runs at the stop codon.
  function begin() {
    S.mode = 'runup'; S.mood = ''; S.pauseT = 0;
    if (S.drop) { S.chain.unshift(S.drop.color); S.drop = null; }
    jump();
  }
  // Jumped clear of the stop codon: it is read through, and the RNA grows on past its old end.
  function startEndless() {
    Object.assign(S, { mode: 'game', read: true, flash: 18, growX: S.end + 27, speed: Math.max(SPEED0, RUN_SPEED * 0.9),
      score: 0, mass: 0, residues: 0, record: false, obstacles: [], nextObs: S.pos + 170, labelT: 0, banner: { text: 'READTHROUGH', t: 80 } });
  }
  // Space on the game-over screen: a new run from where the camera stands.
  function restart() {
    const pos = S.cam + anchor();
    Object.assign(S, { mode: 'game', pos, chain: [], float: null, splitT: 0, mood: '', pauseT: 0, yoff: 0, vy: 0, speed: SPEED0,
      lastCodon: Math.floor((pos - START + 6) / 9), score: 0, mass: 0, residues: 0, record: false, obstacles: [], nextObs: pos + 170,
      banner: null, crashT: 0, overT: 0 });
  }

  // Two hairpins too far apart for one jump however long, near enough to need two short ones.
  // One jump clears up to about 26.9 x speed - 19.5 px between them (worked out step by step with
  // this physics); past 75000 Da a pair stands 12 px beyond that, past 100000 Da only 3, which
  // leaves about 10 and 6 steps to time the second jump.
  function pairSpacing(hard) { return Math.ceil(26.9 * (S.speed + 0.05) - 19.5) + (hard ? 3 : 12); }
  function hairpinAt(x, h, lead) { return { kind: 'hairpin', x, w: 7, h, seed: Math.floor(Math.random() * 1e6), form: 0, lead }; }
  function spawn() {
    const x = S.nextObs, gap = 80 + S.speed * 26;
    if (S.score >= 75000 && Math.random() < (S.score >= 100000 ? 0.45 : 0.35)) {
      const d = pairSpacing(S.score >= 100000), first = hairpinAt(x, 10);
      S.obstacles.push(first, hairpinAt(x + d, 10, first));   // the second takes shape with the first: one obstacle
      S.nextObs = x + d + gap + Math.random() * gap;
      return;
    }
    const roll = Math.random();
    if (roll < 0.5) S.obstacles.push(hairpinAt(x, 9 + Math.floor(Math.random() * 4)));
    else if (roll < 0.8 || S.residues <= 25) S.obstacles.push({ kind: 'protein', x, w: 9, h: 8, form: 0 });
    else S.obstacles.push(hairpinAt(x, 15 + Math.floor(Math.random() * 2)));           // a tall one: hold Space
    if (S.residues > 50 && Math.random() < 0.3) S.obstacles.push(hairpinAt(x + 13, 9 + Math.floor(Math.random() * 3)));   // a wide one: one long jump
    S.nextObs += gap + Math.random() * gap;
  }
  function hits() {
    const x1 = S.pos - 2, x2 = S.pos + 15, bottom = RAIL + 6 - S.yoff;   // the ribosome's box, a pixel inside its outline
    for (let i = 0; i < S.obstacles.length; i++) {
      const o = S.obstacles[i];
      if (o.form < 0.6) continue;
      if (o.x > x2) break;                                     // in x order: the rest are further on
      const hp = o.kind === 'hairpin', ox1 = hp ? o.x + 1 : o.x, ox2 = hp ? o.x + 5 : o.x + o.w - 1;
      if (x2 >= ox1 && x1 <= ox2 && bottom >= RAIL - Math.round(o.h * (hp ? o.form : 1)) + 1) return true;
    }
    return false;
  }

  function step() {
    S.frame++;
    if (S.mode === 'runup') {
      S.pos += RUN_SPEED;
      physics();
      if (api.readCodon(false) === 'stop') {
        if (S.yoff > 8) startEndless();
        else { S.mode = 'ambient'; S.pos = Math.round(S.pos); api.terminate(); }   // not jumped: translation ends as always
      }
      if (S.labelT > 0) S.labelT -= 0.2;
      for (let i = 0; i < S.clouds.length; i++) { const c = S.clouds[i]; c.x += c.s / 5; if (c.x > S.W) c.x = -16; }
    } else if (S.mode === 'game') {
      S.speed = Math.min(SPEED_MAX, S.speed + ACCEL);
      S.pos += S.speed;
      physics();
      S.cam += S.speed + (S.pos - anchor() - S.cam) * 0.06;   // keeps pace, and eases into place after the readthrough
      api.readCodon(false);
      S.growX = Math.max(S.growX + 6, S.cam + S.W + 40);
      while (S.nextObs < S.cam + S.W + 30) spawn();
      while (S.obstacles.length && S.obstacles[0].x <= S.cam - 20) S.obstacles.shift();
      for (let i = 0; i < S.obstacles.length; i++) {
        const o = S.obstacles[i];
        if (o.form < 1 && (o.x - S.pos <= LOOK || (o.lead && o.lead.form > 0))) o.form = Math.min(1, o.form + 0.1);
      }
      if (S.flash > 0) S.flash--;
      if (S.banner && --S.banner.t <= 0) S.banner = null;
      if (hits()) {
        S.mode = 'crash'; S.crashT = 0; S.mood = 'surprised'; S.pauseT = PAUSE;
        S.banner = null; S.flash = 0;                          // READTHROUGH and its flash give way to GAME OVER
        for (let i = 0; i < S.obstacles.length; i++) if (S.obstacles[i].form > 0) S.obstacles[i].form = 1;   // nothing left half-formed
        if (S.score > best) {
          best = S.score; S.record = true;
          try { localStorage.setItem(KEY, String(best)); } catch (e) { /* private window: this visit only */ }
        }
      }
    } else if (S.mode === 'crash') {
      physics();
      S.crashT++;
      if (S.crashT % 5 === 0 && S.pauseT > 0) S.pauseT--;
      if (S.crashT >= 36 && S.yoff === 0) { S.mode = 'over'; S.overT = 0; S.mood = ''; S.pauseT = 0; api.terminate(); }
    }
  }
  // The game-over screen, 12 times a second: the scene's termination plays out, and SPACE blinks.
  // Returns whether anything changed, so an idle screen is not redrawn.
  function slow() {
    S.overT += 5;
    let changed = false;
    if (S.splitT < 60) { S.splitT++; if (S.float) S.float.y -= 1; changed = true; }
    const blink = S.overT > 30 && (S.overT % 40) < 28;
    if (blink !== S.blink) { S.blink = blink; changed = true; }
    return changed;
  }
  function press() {
    if (S.mode === 'runup' || S.mode === 'game') jump();
    else if (S.mode === 'over' && S.overT > 30) restart();
  }
  function playing() { return S.mode === 'runup' || S.mode === 'game' || S.mode === 'crash'; }

  // The track past the stop codon: its flash when jumped, then the endless RNA as far as it has grown.
  function tie(i) {
    if (i >= S.stopTie && i < S.stopTie + 3 && S.flash > 0) return WHITE;
    if (i < S.seq.length + 9) return undefined;                // the scene's own sequence and tail
    if (START + i * 3 > S.growX) return null;
    return BASE[endlessCodon(Math.floor(i / 3))[i % 3]];
  }
  // A codon read after the readthrough adds its residue; the old poly(A) reads as lysines.
  function codon(idx) {
    if (idx <= S.stopCodon) return;
    const c = idx < S.seq.length / 3 + 3 ? 'AAA' : endlessCodon(idx);
    S.mass += MASS[translate(c)];
    S.residues++;
    S.score = Math.round(S.mass + WATER);
  }
  function tailX() { return S.growX + 3; }

  // A hairpin: an RNA stem-loop rising from the track, its base pairs in the base colours.
  function hairpin(ctx, x, h, seed) {
    const top = RAIL - h;
    rect(ctx, x + 2, top, 3, 1, INK);
    rect(ctx, x + 1, top + 1, 1, 2, INK); rect(ctx, x + 5, top + 1, 1, 2, INK);
    rect(ctx, x + 1, top + 3, 1, RAIL - top - 3, INK); rect(ctx, x + 5, top + 3, 1, RAIL - top - 3, INK);
    for (let y = top + 4, k = 0; y < RAIL - 1; y += 2, k++) {
      const pair = ['AU', 'GC', 'CG', 'UA'][Math.floor(hash(seed + k) * 4)];
      rect(ctx, x + 2, y, 1, 1, BASE[pair[0]]); rect(ctx, x + 3, y, 1, 1, WHITE); rect(ctx, x + 4, y, 1, 1, BASE[pair[1]]);
    }
  }
  // An RNA-binding protein sitting on the track, with a stern face; it lands from above.
  function protein(ctx, x, dy) {
    const top = RAIL - 8 + dy, P = '#2a9d8f', P2 = '#1f7a6f';
    rect(ctx, x + 2, top, 5, 1, P); rect(ctx, x + 1, top + 1, 7, 1, P); rect(ctx, x, top + 2, 9, 5, P); rect(ctx, x + 1, top + 7, 7, 1, P2);
    rect(ctx, x + 2, top + 3, 1, 2, WHITE); rect(ctx, x + 6, top + 3, 1, 2, WHITE); rect(ctx, x + 1, top + 2, 2, 1, P2); rect(ctx, x + 6, top + 2, 2, 1, P2);
    rect(ctx, x + 3, top + 6, 3, 1, P2);
  }
  function drawWorld(ctx, cam) {
    for (let i = 0; i < S.obstacles.length; i++) {
      const o = S.obstacles[i], ox = o.x - cam;
      if (ox < -10 || ox > S.W || o.form === 0) continue;
      if (o.kind === 'hairpin') hairpin(ctx, ox, Math.max(3, Math.round(o.h * o.form)), o.seed);
      else protein(ctx, ox, Math.round((1 - o.form) * -24));
    }
  }
  function drawOverlay(ctx, cam) {
    const W = S.W;
    if (S.mode === 'runup' && (S.frame % 30) < 20) {           // a nudge: jump the stop codon
      const stopX = START + S.stopTie * 3 - cam;
      text(ctx, 'SPACE', stopX - 7, RAIL - 34, ACCENT);
      rect(ctx, stopX + 3, RAIL - 27, 3, 1, ACCENT); rect(ctx, stopX + 4, RAIL - 26, 1, 1, ACCENT);
    }
    if (S.mode === 'game' || S.mode === 'crash' || S.mode === 'over') {   // the score, and the best on this browser
      if (hud.score !== S.score || hud.best !== best) {
        hud.score = S.score; hud.best = best;
        hud.text = daltons(S.score); hud.hi = 'HI ' + daltons(Math.max(best, S.score));
      }
      text(ctx, hud.text, W - 4 - hud.text.length * 4, 4, INK);
      text(ctx, hud.hi, W - 12 - (hud.text.length + hud.hi.length) * 4, 4, MUTED);
    }
    if (S.banner) text(ctx, S.banner.text, Math.round(W / 2 - S.banner.text.length * 2), 14, ACCENT);
    if (S.mode === 'over') {                                   // the protein's weight, under GAME OVER
      const lines = [['GAME OVER', INK], [daltons(S.score), INK]];
      if (S.record) lines.push(['NEW HI', ACCENT]);
      lines.push(['SPACE', S.blink ? MUTED : null]);
      // Centred, unless the ribosome stopped near the middle: then beside it, clear of the
      // subunits and the peptide rising from where it stopped.
      const rib = S.pos - cam + 7;
      let cx = W / 2;
      if (Math.abs(rib - cx) < 44) cx = rib + 72 + 22 < W ? rib + 72 : rib - 72;
      for (let k = 0; k < lines.length; k++) if (lines[k][1]) text(ctx, lines[k][0], Math.round(cx - lines[k][0].length * 2), 12 + k * 8, lines[k][1]);
    }
  }

  return { begin, press, playing, step, slow, tie, codon, tailX, drawWorld, drawOverlay };
};
