'use strict';
/* plans.js — itinéraire de la rubrique Entreprise, façon application Plans.
   Fiche du lieu → aperçu de l'itinéraire → « Y aller » → navigation 3D → arrivée à la mairie → photo.
   Scène WebGL (three.js) : sol, Seine, forêts, villes, rues, A13, bâtiments en relief, itinéraire.
   Carte illustrative : tracés et contours sont simplifiés, les rues et bâtiments sont générés. */
(() => {
 const stage = document.getElementById('travel-stage');
 if (!stage || !window.THREE) return;
 const $ = s => stage.querySelector(s);
 const canvas = $('#plans-map'), photo = $('.mairie-photo'), title = $('.destination-title'), labelLayer = $('.pl-labels');
 const skip = document.getElementById('travel-skip'), replay = document.getElementById('travel-replay');
 const stops = [...document.querySelectorAll('[data-stop]')];
 const ui = {
  banner: $('.pl-banner'), icon: $('.pl-banner .pl-icon path'), dist: $('.pl-banner .pl-dist'), text: $('.pl-banner .pl-text'), lanes: $('.pl-lanes'),
  then: $('.pl-then'), thenIcon: $('.pl-then path'), thenText: $('.pl-then span'),
  eta: $('#pl-eta'), min: $('#pl-min'), km: $('#pl-km'), speed: $('#pl-speed'), compass: $('.pl-compass i'),
  go: $('.pl-route .pl-go'), routeBtn: $('.pl-place .pl-go'), end: $('.pl-arrive .pl-end'), routeTime: $('#pl-route-time'), routeKm: $('#pl-route-km'), routeArrival: $('#pl-route-arrival'), sky: $('.pl-sky')
 };
 const animated = () => !paused; // réglage « Réduire les animations »

 /* ---------- Outils ---------- */
 const clamp = v => Math.max(0, Math.min(1, v)), lerp = (a, b, k) => a + (b - a) * k;
 const span = (t, a, b) => clamp((t - a) / (b - a));
 const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
 const easeSine = k => -(Math.cos(Math.PI * k) - 1) / 2;
 const smoothstep = (a, b, x) => {const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k);};
 let seed = 11; const rand = () => {seed = (seed * 16807) % 2147483647; return seed / 2147483647;};

 /* ---------- Géographie (km, x vers l'est, y vers le nord) ---------- */
 const LON0 = 1.88, LAT0 = 48.95, KX = 111.32 * Math.cos(LAT0 * Math.PI / 180), KY = 110.57;
 const P = ([lon, lat]) => [(lon - LON0) * KX, (lat - LAT0) * KY];
 function smooth(pts, steps = 6) {
  const o = [];
  for (let i = 0; i < pts.length - 1; i++) {
   const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
   for (let s = 0; s < steps; s++) {const t = s / steps, t2 = t * t, t3 = t2 * t; o.push([0, 1].map(k => .5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3)));}
  }
  o.push(pts[pts.length - 1]); return o;
 }
 const line = c => smooth(c.map(P));
 // Coins arrondis pour les rues de Mantes-la-Ville.
 function fillet(pts, r) {
  const o = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
   const a = pts[i - 1], b = pts[i], c = pts[i + 1];
   const u = norm([a[0] - b[0], a[1] - b[1]]), v = norm([c[0] - b[0], c[1] - b[1]]);
   const p = [b[0] + u[0] * r, b[1] + u[1] * r], q = [b[0] + v[0] * r, b[1] + v[1] * r];
   for (let k = 0; k <= 8; k++) {const s = k / 8; o.push([(1 - s) * (1 - s) * p[0] + 2 * (1 - s) * s * b[0] + s * s * q[0], (1 - s) * (1 - s) * p[1] + 2 * (1 - s) * s * b[1] + s * s * q[1]]);}
  }
  o.push(pts[pts.length - 1]); return o;
 }
 function norm(v) {const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l];}
 const cumulate = pts => pts.reduce((acc, p, i) => {acc.push(i ? acc[i - 1] + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0); return acc;}, []);

 const MAIRIE = P([1.7115, 48.9745]);
 const M = ([x, y]) => [MAIRIE[0] + x, MAIRIE[1] + y]; // repère local autour de la mairie
 const ROUTE_LL = [[2.045, 48.929], [2.031, 48.923], [2.011, 48.918], [1.990, 48.915], [1.960, 48.925], [1.925, 48.935], [1.890, 48.945], [1.860, 48.952], [1.830, 48.957], [1.800, 48.960], [1.770, 48.962], [1.745, 48.963]];
 const HIGHWAY_PART = line(ROUTE_LL);
 // Dans Mantes-la-Ville : boulevard en diagonale, puis rues du quadrillage jusqu'à la mairie.
 const TOWN_KEYS = [HIGHWAY_PART[HIGHWAY_PART.length - 1], M([1.70, -.48]), M([.42, -.48]), M([.42, 0]), M([0, 0])];
 const TOWN_PART = fillet(TOWN_KEYS, .03);
 const ROUTE = HIGHWAY_PART.concat(TOWN_PART.slice(1));
 const CUM = cumulate(ROUTE), TOTAL = CUM[CUM.length - 1];
 const JUNCTION = CUM[3 * 6], EXIT = CUM[10 * 6];
 const nearestCum = p => {let best = 0, bd = Infinity; ROUTE.forEach((q, i) => {const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) {bd = d; best = i;}}); return CUM[best];};
 const RAMP_END = CUM[HIGHWAY_PART.length - 1], TURN1 = nearestCum(TOWN_KEYS[1]), TURN2 = nearestCum(TOWN_KEYS[2]), TURN3 = nearestCum(TOWN_KEYS[3]);
 const MINUTES = 27;

 const ROADS = {
  highway: [line([[2.10, 48.875], [2.06, 48.885], [2.02, 48.900], [1.990, 48.915], ...ROUTE_LL.slice(4, 11), [1.745, 48.9615], [1.71, 48.962], [1.68, 48.960], [1.64, 48.958]]), line([[1.990, 48.915], [2.03, 48.905], [2.07, 48.902], [2.13, 48.900]])],
  main: [
   line([[2.02, 48.925], [1.98, 48.930], [1.93, 48.945], [1.88, 48.958], [1.84, 48.962], [1.80, 48.967], [1.75, 48.972], [1.7192, 48.9745]]),
   line([[2.04, 48.935], [2.00, 48.945], [1.97, 48.965], [1.93, 48.982], [1.90, 48.990], [1.86, 48.985], [1.82, 48.982], [1.78, 48.980], [1.74, 48.985], [1.70, 48.988]]),
   line([[2.045, 48.929], [2.06, 48.90], [2.07, 48.88]]),
   line([[1.7058, 48.94], [1.7058, 48.9745], [1.7065, 48.995], [1.715, 49.02]]),
   line([[1.905, 48.985], [1.908, 49.01], [1.91, 49.03]]),
   line([[1.855, 48.960], [1.86, 48.93], [1.87, 48.90]]),
   TOWN_PART, ROUTE.slice(0, 3 * 6 + 1)
  ]
 };
 const SEINE = line([[2.15, 48.955], [2.10, 48.948], [2.06, 48.940], [2.040, 48.936], [2.02, 48.942], [1.995, 48.950], [1.985, 48.960], [1.99, 48.975], [1.96, 48.99], [1.93, 49.000], [1.91, 49.002], [1.885, 48.996], [1.86, 48.990], [1.83, 48.988], [1.80, 48.986], [1.77, 48.988], [1.74, 48.993], [1.72, 48.996], [1.69, 49.002], [1.64, 49.01]]);
 function blob(lon, lat, r, sx = 1, sy = 1, s = 1) {const [cx, cy] = P([lon, lat]), pts = []; for (let i = 0; i < 48; i++) {const a = i / 48 * Math.PI * 2, k = r * (1 + .16 * Math.sin(3 * a + s) + .09 * Math.sin(5 * a + 2 * s) + .05 * Math.sin(8 * a + 3 * s)); pts.push([cx + Math.cos(a) * k * sx, cy + Math.sin(a) * k * sy]);} return pts;}
 // [lon, lat, rayon, étirement x, étirement y, aligné sur la mairie]
 const TOWNS = [[2.040, 48.928, 1.6, 1.25, .85], [1.978, 48.921, .75, 1, 1], [1.912, 48.988, 1.4, 1.3, .75], [1.905, 49.006, .6, 1.2, .8], [1.855, 48.960, 1.05, 1.3, .75], [1.815, 48.955, .75, 1.1, .9], [1.712, 48.986, 1.25, 1.3, .7, 1], [1.712, 48.970, 1.15, 1.15, .85, 1], [1.745, 49.003, .8, 1.2, .8, 1], [1.680, 48.980, .6, 1, 1, 1], [2.004, 48.941, .55, 1.2, .9], [2.004, 48.983, .75, 1.2, .8]]
  .map((t, i) => ({c: P(t), r: t[2], aligned: !!t[5], poly: blob(t[0], t[1], t[2], t[3], t[4], i * 1.7)}));
 const FORESTS = [blob(2.105, 48.925, 2.6, .9, 1.3, 2), blob(1.935, 48.905, 1.9, 1.7, .65, 5), blob(1.965, 48.963, .8, 1.2, .8, 7), blob(1.765, 48.940, 1.4, 1.5, .7, 3), blob(1.840, 48.933, 1.1, 1.2, .8, 9), blob(1.66, 49.03, 1.4, 1.4, .8, 4)];
 const LABELS = [['Mantes-la-Ville', 1.717, 48.965, 1], ['Poissy', 2.045, 48.935, 1], ['Les Mureaux', 1.912, 48.988, 2], ['Mantes-la-Jolie', 1.712, 48.990, 2], ['Aubergenville', 1.855, 48.963, 2], ['Orgeval', 1.978, 48.921, 3], ['Épône', 1.815, 48.955, 3], ['Limay', 1.745, 49.006, 3], ['Meulan', 1.905, 49.008, 3], ['Triel-sur-Seine', 2.004, 48.984, 3], ['Buchelay', 1.680, 48.980, 3]].map(([n, lon, lat, r]) => ({n, p: P([lon, lat]), r}));

 function inside(poly, [x, y]) {let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;} return c;}

 // Points d'échantillonnage des grands axes, pour ne pas poser de bâtiments dessus.
 const hash = new Map(), CELL = .1;
 const addSample = (p, r) => {const k = Math.floor(p[0] / CELL) + ',' + Math.floor(p[1] / CELL); if (!hash.has(k)) hash.set(k, []); hash.get(k).push([p[0], p[1], r]);};
 function sampleLine(pts, r) {for (let i = 1; i < pts.length; i++) {const a = pts[i - 1], b = pts[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .015); for (let k = 0; k <= n; k++) addSample([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)], r);}}
 ROADS.highway.forEach(l => sampleLine(l, .035)); ROADS.main.forEach(l => sampleLine(l, .022)); sampleLine(SEINE, .07);
 function clearOf([x, y], radius) {
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {const list = hash.get((cx + i) + ',' + (cy + j)); if (list) for (const s of list) if (Math.hypot(s[0] - x, s[1] - y) < s[2] + radius) return false;}
  return true;
 }

 // Quadrillage de rues et îlots bâtis de chaque ville.
 const STREETS = [], MAJOR = [], BUILDINGS = [], PARKS = [];
 const PARK_CELLS = new Set(['1,0', '-2,1', '2,-3']);
 TOWNS.forEach(t => {
  const o = t.aligned ? 0 : rand() * Math.PI / 2, origin = t.aligned ? MAIRIE : t.c, sx = t.aligned ? .14 : .13, sy = t.aligned ? .12 : .13;
  const ux = Math.cos(o), uy = Math.sin(o), vx = -uy, vy = ux, R = t.r * 1.75;
  const rel = [t.c[0] - origin[0], t.c[1] - origin[1]], cu = rel[0] * ux + rel[1] * uy, cv = rel[0] * vx + rel[1] * vy;
  const world = (u, v) => [origin[0] + ux * u + vx * v, origin[1] + uy * u + vy * v];
  const clip = (a, b, major) => {
   let run = null; const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .03);
   for (let k = 0; k <= n; k++) {
    const p = [lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)], inn = inside(t.poly, p);
    if (inn) {if (run) run[1] = p; else run = [p, p];}
    if ((!inn || k === n) && run) {if (Math.hypot(run[1][0] - run[0][0], run[1][1] - run[0][1]) > .12) (major ? MAJOR : STREETS).push(run); run = null;}
   }
  };
  const i0 = Math.floor((cu - R) / sx), i1 = Math.ceil((cu + R) / sx), j0 = Math.floor((cv - R) / sy), j1 = Math.ceil((cv + R) / sy);
  for (let i = i0; i <= i1; i++) clip(world(i * sx, j0 * sy), world(i * sx, j1 * sy), i % 4 === 0);
  for (let j = j0; j <= j1; j++) clip(world(i0 * sx, j * sy), world(i1 * sx, j * sy), j % 4 === 0);
  for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) {
   const center = world((i + .5) * sx, (j + .5) * sy);
   if (!inside(t.poly, center)) continue;
   const key = i + ',' + j;
   if (t.aligned && PARK_CELLS.has(key)) {PARKS.push([world(i * sx + .01, j * sy + .01), world((i + 1) * sx - .01, j * sy + .01), world((i + 1) * sx - .01, (j + 1) * sy - .01), world(i * sx + .01, (j + 1) * sy - .01)]); continue;}
   const dCenter = Math.hypot(center[0] - t.c[0], center[1] - t.c[1]) / (t.r * 1.3), tall = Math.max(.25, 1 - dCenter);
   const nx = 1 + Math.floor(rand() * 3), ny = 1 + Math.floor(rand() * 2), inset = .013, gap = .006;
   const w = (sx - 2 * inset - (nx - 1) * gap) / nx, h = (sy - 2 * inset - (ny - 1) * gap) / ny;
   for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) {
    if (rand() < .1) continue;
    const bw = w * (.72 + rand() * .28), bh = h * (.72 + rand() * .28);
    const cxu = i * sx + inset + a * (w + gap) + w / 2, cyv = j * sy + inset + b * (h + gap) + h / 2, p = world(cxu, cyv);
    if (!clearOf(p, Math.hypot(bw, bh) / 2) || Math.hypot(p[0] - MAIRIE[0], p[1] - MAIRIE[1]) < .11) continue;
    BUILDINGS.push({p, w: bw, d: bh, h: .006 + Math.pow(rand(), 2) * .024 * tall + .004 * tall, o});
   }
  }
 });

 /* ---------- Profil de conduite ---------- */
 // Sur l'A13 la caméra s'éloigne et le véhicule va plus vite à l'écran ; en ville elle se rapproche.
 const HW = .36;
 const zoomFactor = d => 1 - (1 - HW) * smoothstep(JUNCTION - .5, JUNCTION + 1.2, d) * (1 - smoothstep(EXIT - 1.4, EXIT + .3, d));
 const realSpeed = d => d > TURN1 ? 30 + 20 * smoothstep(TOTAL - .05, TURN1, d) : 50 + 60 * (1 - zoomFactor(d)) / (1 - HW); // km/h simulés
 const N = 800, animT = [0], realT = [0];
 for (let i = 1; i <= N; i++) {const d0 = TOTAL * (i - 1) / N, d1 = TOTAL * i / N, m = (d0 + d1) / 2; animT.push(animT[i - 1] + zoomFactor(m) * (d1 - d0)); realT.push(realT[i - 1] + (d1 - d0) / realSpeed(m));}
 function distanceAt(k) {const target = k * animT[N]; let lo = 0, hi = N; while (hi - lo > 1) {const mid = (lo + hi) >> 1; if (animT[mid] < target) lo = mid; else hi = mid;} return TOTAL * (lo + (target - animT[lo]) / ((animT[hi] - animT[lo]) || 1)) / N;}
 const progressOf = d => {const i = Math.max(0, Math.min(N, Math.round(d / TOTAL * N))); return animT[i] / animT[N];};
 const minutesLeft = d => {const i = Math.max(0, Math.min(N, Math.round(d / TOTAL * N))); return MINUTES * (realT[N] - realT[i]) / realT[N];};
 function at(d) {d = Math.max(0, Math.min(TOTAL, d)); let lo = 0, hi = CUM.length - 1; while (hi - lo > 1) {const m = (lo + hi) >> 1; if (CUM[m] < d) lo = m; else hi = m;} const k = (d - CUM[lo]) / ((CUM[hi] - CUM[lo]) || 1), a = ROUTE[lo], b = ROUTE[hi]; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];}
 function heading(d, w) {const a = at(d - w), b = at(d + w); return Math.atan2(b[0] - a[0], b[1] - a[1]);}
 const angleLerp = (a, b, t) => {const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t;};

 /* ---------- Chronologie (secondes) ---------- */
 const T = {place: 0, pressRoute: 1.45, route: 1.75, reveal: 1.9, pressGo: 3.45, fly: 3.9, drive: 5.2, driveEnd: 14.6, arrive: 14.6, pressEnd: 16.45, fade: 16.7, end: 17.8};
 const driveK = t => clamp((t - T.drive) / (T.driveEnd - T.drive));
 const dAt = t => distanceAt(easeSine(driveK(t)));
 const tOfD = d => {const p = progressOf(d); let lo = 0, hi = 1; for (let i = 0; i < 30; i++) {const m = (lo + hi) / 2; if (easeSine(m) < p) lo = m; else hi = m;} return T.drive + lo * (T.driveEnd - T.drive);};
 const STOP_TIMES = [T.fly, tOfD((JUNCTION + EXIT) / 2), tOfD(EXIT - .8), T.arrive];
 const STILLS = [T.route + 1.4, STOP_TIMES[1], STOP_TIMES[2], T.arrive + 1.6];
 const stopAt = t => t >= T.arrive ? 3 : t >= STOP_TIMES[2] ? 2 : t >= STOP_TIMES[1] ? 1 : 0;

 /* ---------- Palettes ---------- */
 const PALETTES = {
  light: {sky: '#bcd8f2', horizon: '#e9eef2', land: '#f3f0ea', town: '#ebe7e0', forest: '#d2e8c0', park: '#c9e5b2', water: '#a9cff3', street: '#ffffff', streetCase: '#e0dcd4', main: '#ffffff', mainCase: '#d5d0c6', hw: '#fbd168', hwCase: '#e5ae43', route: '#0a84ff', routeCase: '#0563c8', plaza: '#e6e2da', building: '#e9e6e1', mairie: '#f2e3cf', mairieRoof: '#8e9aaa', start: '#ffffff'},
  dark: {sky: '#0b1220', horizon: '#1b2230', land: '#1f2228', town: '#25282f', forest: '#1f3224', park: '#22392a', water: '#173a5c', street: '#3a3f48', streetCase: '#2b2f36', main: '#454b56', mainCase: '#30343c', hw: '#8a6c34', hwCase: '#5e4a26', route: '#2f8fff', routeCase: '#1663c4', plaza: '#2c3038', building: '#343842', mairie: '#4b4334', mairieRoof: '#5d6878', start: '#e8ecf2'}
 };
 const theme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

 /* ---------- Scène WebGL ---------- */
 let gl = null;
 const VERT = `attribute vec2 aSide;attribute float aDist;uniform float uBase,uPx,uMpp;varying float vDist;varying float vFog;
  void main(){float hw=max(uBase,uPx*uMpp);vec3 p=position+vec3(aSide.x,0.,aSide.y)*hw;vDist=aDist;vec4 mv=modelViewMatrix*vec4(p,1.);vFog=-mv.z;gl_Position=projectionMatrix*mv;}`;
 const FRAG = `uniform vec3 uColor,uFogColor;uniform float uFogNear,uFogFar,uOpacity,uFrom,uTo;varying float vDist;varying float vFog;
  void main(){if(vDist<uFrom||vDist>uTo)discard;float f=smoothstep(uFogNear,uFogFar,vFog);gl_FragColor=vec4(mix(uColor,uFogColor,f),uOpacity);}`;
 function build() {
  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 2, .01, 400);
  scene.fog = new THREE.Fog(0xffffff, 1000, 2000);
  const shared = {uFogColor: {value: new THREE.Color()}, uFogNear: {value: 1000}, uFogFar: {value: 2000}, uMpp: {value: .001}};
  const mats = {};
  function material(key, order, base = 0, px = 0) {
   const m = new THREE.ShaderMaterial({uniforms: {...shared, uColor: {value: new THREE.Color()}, uBase: {value: base}, uPx: {value: px}, uOpacity: {value: 1}, uFrom: {value: -1e9}, uTo: {value: 1e9}}, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false});
   m.userData = {key}; mats[key + order] = m; return m;
  }
  const W3 = (p, y = 0) => [p[0], y, -p[1]];
  function ribbon(lines, withDist) {
   const pos = [], side = [], dist = [], idx = []; let base = 0;
   lines.forEach(pts => {
    const cum = cumulate(pts);
    pts.forEach((p, i) => {
     const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
     const d0 = norm([p[0] - a[0], p[1] - a[1]]), d1 = norm([b[0] - p[0], b[1] - p[1]]);
     const tdir = norm([(i ? d0[0] : 0) + (i < pts.length - 1 ? d1[0] : 0), (i ? d0[1] : 0) + (i < pts.length - 1 ? d1[1] : 0)]);
     const n = [-tdir[1], tdir[0]], ref = i ? [-d0[1], d0[0]] : n, miter = 1 / Math.max(.4, n[0] * ref[0] + n[1] * ref[1]);
     for (const s of [1, -1]) {pos.push(...W3(p)); side.push(n[0] * miter * s, -n[1] * miter * s); dist.push(withDist ? cum[i] : 0);}
     if (i) {const v = base + i * 2; idx.push(v - 2, v - 1, v, v - 1, v + 1, v);}
    });
    base += pts.length * 2;
   });
   const g = new THREE.BufferGeometry();
   g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 2)); g.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1)); g.setIndex(idx);
   return g;
  }
  function flat(polys) {
   const geos = polys.map(pts => {const shape = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1]))); const g = new THREE.ShapeGeometry(shape); g.rotateX(-Math.PI / 2); return g;});
   const pos = [], idx = []; let off = 0;
   geos.forEach(g => {const p = g.attributes.position.array; pos.push(...p); const ix = g.index ? g.index.array : [...Array(p.length / 3).keys()]; ix.forEach(i => idx.push(i + off)); off += p.length / 3;});
   const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
   g.setAttribute('aSide', new THREE.Float32BufferAttribute(new Float32Array(off * 2), 2)); g.setAttribute('aDist', new THREE.Float32BufferAttribute(new Float32Array(off), 1)); g.setIndex(idx);
   return g;
  }
  const add = (geo, mat, order) => {const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = order; mesh.frustumCulled = false; scene.add(mesh); return mesh;};
  // Sol
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xffffff, depthWrite: false}));
  ground.renderOrder = -10; scene.add(ground);
  add(flat(FORESTS), material('forest', 1), 1);
  add(flat(TOWNS.map(t => t.poly)), material('town', 2), 2);
  add(flat(PARKS), material('park', 3), 3);
  add(ribbon([SEINE]), material('water', 4, .07, 3.5), 4);
  const streetCase = add(ribbon(STREETS), material('streetCase', 5, .0065, 1.6), 5), street = add(ribbon(STREETS), material('street', 6, .005, 1.1), 6);
  const majorCase = add(ribbon(MAJOR), material('streetCase', 7, .0085, 2), 7), major = add(ribbon(MAJOR), material('street', 8, .0068, 1.5), 8);
  add(flat([[M([-.07, .008]), M([.07, .008]), M([.07, .032]), M([-.07, .032])]]), material('plaza', 9), 9);
  add(ribbon(ROADS.main), material('mainCase', 10, .011, 4.2), 10); add(ribbon(ROADS.main), material('main', 11, .0085, 3), 11);
  add(ribbon(ROADS.highway), material('hwCase', 12, .019, 6), 12); add(ribbon(ROADS.highway), material('hw', 13, .015, 4.4), 13);
  const routeGeo = ribbon([ROUTE], true);
  const routeCase = add(routeGeo, material('routeCase', 20, .0085, 9), 20), routeFill = add(routeGeo, material('route', 21, .0062, 6.2), 21);
  // Bâtiments
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, .5, 0);
  const buildingMat = new THREE.MeshLambertMaterial({color: 0xffffff});
  const buildings = new THREE.InstancedMesh(box, buildingMat, BUILDINGS.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), tint = new THREE.Color();
  BUILDINGS.forEach((b, i) => {q.setFromAxisAngle(up, b.o); m4.compose(new THREE.Vector3(...W3(b.p)), q, new THREE.Vector3(b.w, b.h * 1.4, b.d)); buildings.setMatrixAt(i, m4); const v = .94 + rand() * .06; tint.setRGB(v, v, v); buildings.setColorAt(i, tint);});
  buildings.renderOrder = 15; scene.add(buildings);
  // Mairie : corps de bâtiment, ailes, beffroi
  const mairieMat = new THREE.MeshLambertMaterial({color: 0xffffff}), roofMat = new THREE.MeshLambertMaterial({color: 0xffffff});
  const part = (w, h, d, x, y, z, mat, geo) => {const mesh = new THREE.Mesh(geo || box, mat); mesh.scale.set(w, h, d); const p = M([x, y]); mesh.position.set(p[0], z, -p[1]); mesh.renderOrder = 15; scene.add(mesh); return mesh;};
  part(.08, .022, .03, 0, .052, 0, mairieMat); part(.026, .019, .036, -.056, .052, 0, mairieMat); part(.026, .019, .036, .056, .052, 0, mairieMat);
  part(.016, .044, .016, 0, .04, 0, mairieMat);
  const cone = new THREE.ConeGeometry(.7071, 1, 4); cone.rotateY(Math.PI / 4); cone.translate(0, .5, 0);
  part(.017, .016, .017, 0, .04, .044, roofMat, cone); const gable = new THREE.CylinderGeometry(.5, .5, 1, 3); gable.rotateZ(Math.PI / 2); gable.translate(0, .25, 0); part(.086, .02, .036, 0, .052, .022, roofMat, gable);
  // Véhicule : flèche de navigation posée sur la route
  const arrow = new THREE.Shape([[0, .62], [.46, -.42], [0, -.18], [-.46, -.42]].map(p => new THREE.Vector2(p[0], p[1])));
  const ring = new THREE.Shape(); ring.absarc(0, 0, .92, 0, Math.PI * 2);
  const puck = new THREE.Group();
  const puckMat = (color, opacity = 1) => new THREE.MeshBasicMaterial({color, transparent: true, opacity, depthTest: false, depthWrite: false});
  const halo = new THREE.Mesh(new THREE.ShapeGeometry(ring, 32), puckMat(0x0a84ff, .18));
  const disc = new THREE.Mesh(new THREE.ShapeGeometry((() => {const s = new THREE.Shape(); s.absarc(0, 0, .62, 0, Math.PI * 2); return s;})(), 32), puckMat(0xffffff));
  const head = new THREE.Mesh(new THREE.ShapeGeometry(arrow), puckMat(0x0a84ff));
  // Flèche relevée vers la caméra pour rester lisible quand la vue est rasante.
  [halo, disc, head].forEach((m, i) => {m.rotation.x = -Math.PI / 2 + (i ? .75 : 0); m.position.y = i ? .35 : 0; m.renderOrder = 40 + i; puck.add(m);});
  head.position.z = .001;
  head.scale.set(.82, .82, .82);
  scene.add(puck);
  // Lumières
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a8, .82));
  const sun = new THREE.DirectionalLight(0xffffff, .42); sun.position.set(-.6, 1, .35); scene.add(sun);
  gl = {THREE, renderer, scene, camera, shared, mats, ground, buildingMat, buildings, mairieMat, roofMat, puck, halo, head, routeCase, routeFill, street, streetCase, major, majorCase, themeName: ''};
  applyTheme();
 }
 function applyTheme() {
  if (!gl) return;
  const C = PALETTES[theme()]; if (gl.themeName === theme()) return; gl.themeName = theme();
  Object.values(gl.mats).forEach(m => m.uniforms.uColor.value.set(C[m.userData.key]));
  gl.ground.material.color.set(C.land); gl.buildingMat.color.set(C.building); gl.mairieMat.color.set(C.mairie); gl.roofMat.color.set(C.mairieRoof);
  gl.shared.uFogColor.value.set(C.horizon); gl.scene.fog.color.set(C.horizon);
  gl.head.material.color.set(C.route); gl.halo.material.color.set(C.route);
  stage.style.setProperty('--pl-sky', C.sky); stage.style.setProperty('--pl-horizon', C.horizon);
 }

 /* ---------- Caméra ---------- */
 const V = (x, y, z) => new window.THREE.Vector3(x, y, z);
 const world = (p, y = 0) => V(p[0], y, -p[1]);
 function fitOverview(aspect) {
  const xs = ROUTE.map(p => p[0]), ys = ROUTE.map(p => p[1]);
  const c = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2 - .4];
  const wkm = Math.max(...xs) - Math.min(...xs) + 3, hkm = Math.max(...ys) - Math.min(...ys) + 6, t = Math.tan(20 * Math.PI / 180);
  const dist = Math.max(hkm / 2 / t, wkm / 2 / (t * aspect)), tilt = 18 * Math.PI / 180;
  const target = world(c);
  return {pos: target.clone().add(V(0, dist * Math.cos(tilt), dist * Math.sin(tilt))), target};
 }
 function orbit(center, dist, elev, angle, lift = 0) {
  const e = elev * Math.PI / 180;
  return {pos: center.clone().add(V(Math.sin(angle) * dist * Math.cos(e), dist * Math.sin(e) + lift, Math.cos(angle) * dist * Math.cos(e))), target: center.clone()};
 }
 function navCamera(d) {
  const f = zoomFactor(d), car = at(d), look = .16 + 1.2 * (1 - f);
  const h = heading(Math.min(TOTAL - .02, d + look * .45), look * .45 + .04), dir = V(Math.sin(h), 0, -Math.cos(h));
  // Caméra basse derrière le véhicule : la flèche reste au-dessus de la fiche du bas et l'horizon apparaît en haut.
  const back = lerp(1.5, .46, f), height = lerp(.46, .2, f), ahead = lerp(.22, .05, f);
  const c = world(car);
  return {pos: c.clone().addScaledVector(dir, -back).add(V(0, height, 0)), target: c.clone().addScaledVector(dir, ahead), heading: h};
 }
 const mixCam = (a, b, k) => ({pos: a.pos.clone().lerp(b.pos, k), target: a.target.clone().lerp(b.target, k)});
 function cameraAt(t, aspect) {
  const mairie = world(MAIRIE, .012);
  const place = tt => orbit(mairie, 2.3, 34, .55 - tt * .05);
  if (t < T.route) return place(t);
  const over = fitOverview(aspect);
  if (t < T.fly) return mixCam(place(T.route), over, ease(span(t, T.route, T.route + 1.3)));
  const d = dAt(t);
  if (t < T.drive + .25) {const nav = navCamera(d), k = ease(span(t, T.fly, T.drive + .25)); const m = mixCam(over, nav, k); m.pos.y += Math.sin(Math.PI * k) * .4; return m;}
  if (t < T.arrive) return navCamera(d);
  const nav = navCamera(TOTAL), start = Math.atan2(nav.pos.x - mairie.x, nav.pos.z - mairie.z);
  const k = ease(span(t, T.arrive, T.arrive + 1.5)), ang = start + .9 * easeSine(span(t, T.arrive, T.end));
  return mixCam(nav, orbit(mairie, lerp(.5, .36, k), lerp(30, 34, k), ang), k);
 }

 /* ---------- Étiquettes (noms, bouclier A13, lieux) ---------- */
 const SHIELDS = [JUNCTION + 1.6, (JUNCTION + EXIT) / 2, EXIT - 2.6].map(d => at(d));
 const START = ROUTE[0];
 const labelEls = new Map();
 function labelEl(key, cls, html) {
  let el = labelEls.get(key);
  if (!el) {el = document.createElement('div'); el.className = 'pl-label ' + cls; el.innerHTML = html; labelLayer.append(el); labelEls.set(key, el); el._w = 0;}
  return el;
 }
 function layoutLabels(t, W, H, reserved) {
  const {camera} = gl, boxes = reserved.slice(), v = new gl.THREE.Vector3();
  const shown = new Set();
  const place = (key, cls, html, p, y, opts = {}) => {
   v.copy(world(p, y)).project(camera);
   if (v.z > 1 || v.z < -1) return;
   const x = (v.x + 1) / 2 * W, yy = (1 - v.y) / 2 * H, dist = camera.position.distanceTo(world(p, y));
   if (opts.maxDist && dist > opts.maxDist) return;
   const el = labelEl(key, cls, html);
   if (!el._w) {el._w = el.offsetWidth; el._h = el.offsetHeight;}
   let ax = opts.anchor === 'right' ? x - 13 : x - el._w / 2;
   const ay = opts.anchor === 'right' ? yy - el._h / 2 : yy - el._h / 2;
   if (opts.force) ax = Math.max(6, Math.min(W - el._w - 6, ax)); // le lieu de destination reste toujours à l'écran
   const b = [ax - 2, ay - 2, ax + el._w + 2, ay + el._h + 2];
   if (b[0] < 4 || b[2] > W - 4 || b[1] < 4 || b[3] > H - 4) return;
   if (!opts.force && boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) return;
   boxes.push(b); shown.add(el);
   el.style.transform = `translate(${ax.toFixed(1)}px,${ay.toFixed(1)}px)` + (opts.scale ? ` scale(${opts.scale})` : '');
   el.style.opacity = String(opts.opacity ?? 1);
  };
  const navMode = t >= T.drive;
  // Mairie (lieu de destination), toujours prioritaire
  const big = t >= T.arrive ? 1 + .15 * ease(span(t, T.arrive, T.arrive + .8)) : 1;
  place('dest', 'pl-poi', '<i><svg viewBox="0 0 24 24"><path d="M4 20h16M6 20V10h12v10M5 10l7-5 7 5M9 20v-5h6v5"/></svg></i><span>Mairie de Mantes-la-Ville</span>', M([0, .052]), .07, {anchor: 'right', force: true, scale: big});
  if (t < T.drive + .6) place('start', 'pl-start', '<i></i><span>H3 Campus</span>', START, 0, {anchor: 'right', opacity: 1 - span(t, T.drive, T.drive + .6)});
  SHIELDS.forEach((p, i) => place('a13-' + i, 'pl-shield', 'A13', p, 0, {maxDist: navMode ? 9 : 99}));
  LABELS.filter(l => navMode ? true : l.r <= 2).sort((a, b) => a.r - b.r).forEach(l => place('town-' + l.n, 'pl-town r' + l.r, l.n, l.p, 0, {maxDist: navMode ? (l.r === 1 ? 14 : 8) : 99}));
  place('seine', 'pl-water', 'La Seine', P([1.93, 49.0]), 0, {maxDist: navMode ? 8 : 99});
  labelEls.forEach(el => {if (!shown.has(el)) el.style.opacity = '0';});
 }

 /* ---------- Interface ---------- */
 const ICONS = {
  merge: 'M8 20v-5.5c0-2.6 1.6-4.4 4.2-5.4L17 7.5M13.2 5.6 17 7.5l-1.9 3.8',
  straight: 'M12 20V5M7 10l5-5 5 5',
  exit: 'M9 20v-7.5c0-2.5 1.3-4.4 3.6-5.6L16 5M12 4.5h4.5V9',
  slightLeft: 'M15 20v-6.5L8.5 7M8 12V6.5h5.5',
  right: 'M7 20v-7a4 4 0 0 1 4-4h8M15 5l4 4-4 4',
  left: 'M17 20v-7a4 4 0 0 0-4-4H5M9 5 5 9l4 4',
  pin: 'M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21zm0-8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  flag: 'M6 21V4M6 4h11l-2.5 4L17 12H6'
 };
 const km = d => d < 1 ? `${Math.max(10, Math.round(d * 1000 / (d < .3 ? 10 : 50)) * (d < .3 ? 10 : 50))} m` : d < 10 ? `${d.toFixed(1).replace('.', ',')} km` : `${Math.round(d)} km`;
 function guidance(d, t) {
  if (t >= T.arrive) return {icon: 'flag', dist: 'Vous êtes arrivé', text: 'Mairie de Mantes-la-Ville', then: null};
  if (d < JUNCTION) return {icon: 'merge', dist: km(JUNCTION - d), text: 'Rejoindre l’A13 direction Rouen', then: ['straight', `Puis A13 pendant ${Math.round(EXIT - JUNCTION)} km`]};
  if (d < EXIT - 2.2) return {icon: 'straight', dist: km(EXIT - d), text: 'Continuer sur l’A13', then: ['exit', 'Puis sortie Mantes-la-Ville']};
  if (d < EXIT) return {icon: 'exit', dist: km(EXIT - d), text: 'Sortie Mantes-la-Ville', lanes: true, then: ['slightLeft', 'Puis boulevard vers le centre']};
  if (d < TURN1) return {icon: 'slightLeft', dist: km(TURN1 - d), text: 'Serrer à gauche vers le centre', then: ['right', 'Puis tourner à droite']};
  if (d < TURN2) return {icon: 'right', dist: km(TURN2 - d), text: 'Tourner à droite', then: ['left', 'Puis tourner à gauche']};
  if (d < TURN3) return {icon: 'left', dist: km(TURN3 - d), text: 'Tourner à gauche', then: ['pin', 'Puis destination sur votre droite']};
  return {icon: 'pin', dist: km(TOTAL - d), text: 'Destination sur votre droite', then: null};
 }
 let lastState = '', lastStep = '', lastThen = '', arrivalText = '';
 function stamp() {const t = new Date(Date.now() + MINUTES * 60000); arrivalText = `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`; ui.eta.textContent = arrivalText; ui.routeTime.textContent = `${MINUTES} min`; ui.routeKm.textContent = `${Math.round(TOTAL)} km · Via A13 · le plus rapide`; ui.routeArrival.textContent = `Arrivée à ${arrivalText}`;}
 function setState(name) {
  if (name === lastState) return; lastState = name;
  ['pl-is-place', 'pl-is-route', 'pl-is-nav', 'pl-is-arrive'].forEach(c => stage.classList.toggle(c, c === 'pl-is-' + name));
 }
 function press(el, t, at) {el.classList.toggle('is-pressed', t >= at && t < at + .28);}
 function updateUI(t, d, playing) {
  setState(t < T.route ? 'place' : t < T.fly ? 'route' : t < T.arrive ? 'nav' : 'arrive');
  press(ui.routeBtn, t, T.pressRoute); press(ui.go, t, T.pressGo); press(ui.end, t, T.pressEnd);
  stage.classList.toggle('pl-banner-on', t >= T.drive - .1 && t < T.fade);
  const g = guidance(d, t), step = g.icon + g.text;
  if (step !== lastStep) {
   ui.icon.setAttribute('d', ICONS[g.icon]); ui.icon.setAttribute('fill', g.icon === 'pin' ? 'currentColor' : 'none');
   if (lastStep && playing) {ui.banner.classList.remove('is-swap'); void ui.banner.offsetWidth; ui.banner.classList.add('is-swap');}
   lastStep = step;
  }
  ui.dist.textContent = g.dist; ui.text.textContent = g.text; ui.lanes.hidden = !g.lanes;
  const thenKey = g.then ? g.then.join() : '';
  if (thenKey !== lastThen) {lastThen = thenKey; ui.then.hidden = !g.then; if (g.then) {ui.thenIcon.setAttribute('d', ICONS[g.then[0]]); ui.thenIcon.setAttribute('fill', g.then[0] === 'pin' ? 'currentColor' : 'none'); ui.thenText.textContent = g.then[1];}}
  const left = TOTAL - d, arrived = t >= T.arrive;
  ui.min.textContent = arrived ? '0' : String(Math.max(1, Math.ceil(minutesLeft(d))));
  ui.km.textContent = arrived ? '0' : (left < 1 ? (left * 1000 < 100 ? '0,1' : left.toFixed(1).replace('.', ',')) : left < 10 ? left.toFixed(1).replace('.', ',') : String(Math.round(left)));
  const ramp = clamp(2.2 * Math.sin(Math.PI * driveK(t)));
  ui.speed.textContent = arrived || t < T.drive ? '0' : String(Math.round(realSpeed(d) * ramp));
  stops.forEach((b, i) => {const on = i === stopAt(t); b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));});
 }
 function reservedBoxes(W, H) {
  const r = stage.getBoundingClientRect(), zoom = r.width / W || 1, out = [];
  stage.querySelectorAll('.pl-banner,.pl-then,.pl-card,.pl-speed,.pl-compass,#travel-skip').forEach(el => {
   if (el.hidden || getComputedStyle(el).opacity < .2 || getComputedStyle(el).visibility === 'hidden') return;
   const b = el.getBoundingClientRect(); if (!b.width) return;
   out.push([(b.left - r.left) / zoom, (b.top - r.top) / zoom, (b.right - r.left) / zoom, (b.bottom - r.top) / zoom]);
  });
  return out;
 }

 /* ---------- Rendu ---------- */
 let t = T.end, playing = false, raf = 0, last = null, started = false, waitFrame = 0, failed = false, reserved = [], reservedKey = '';
 function render(time) {
  const W = stage.clientWidth, H = stage.clientHeight, inMap = time < T.end;
  if (!W || !H) {if (!inMap) ['pl-on', 'is-driving', 'pl-banner-on'].forEach(c => stage.classList.remove(c)); return;}
  if (inMap && !gl && !failed) {try {build();} catch (e) {failed = true;}}
  const fade = span(time, T.fade, T.end);
  canvas.style.opacity = ui.sky.style.opacity = inMap && gl ? String(1 - fade) : '0';
  stage.classList.toggle('pl-on', inMap && !!gl && fade < .6);
  stage.classList.toggle('is-driving', inMap && !!gl);
  photo.style.transform = `scale(${lerp(1.07, 1, ease(span(time, T.fade - .2, T.end + .4)))})`;
  title.style.opacity = String(inMap ? span(time, T.end - .5, T.end) : 1);
  if (!inMap || !gl) {stops.forEach((b, i) => {b.classList.toggle('active', i === 3); b.setAttribute('aria-pressed', String(i === 3));}); setState('done'); return;}
  applyTheme();
  const zoom = stage.getBoundingClientRect().width / W || 1, ratio = Math.min(2, (devicePixelRatio || 1) * zoom);
  if (gl.renderer.getPixelRatio() !== ratio) gl.renderer.setPixelRatio(ratio);
  const size = gl.renderer.getSize(new gl.THREE.Vector2());
  if (size.x !== W || size.y !== H) gl.renderer.setSize(W, H, false);
  const cam = cameraAt(time, W / H), {camera, shared} = gl;
  camera.aspect = W / H; camera.position.copy(cam.pos); camera.lookAt(cam.target);
  const dist = cam.pos.distanceTo(cam.target);
  camera.near = Math.max(.004, dist * .02); camera.far = Math.max(60, dist * 40); camera.updateProjectionMatrix();
  shared.uMpp.value = dist * 2 * Math.tan(20 * Math.PI / 180) / H;
  // Brume : forte quand la caméra regarde vers l'horizon, nulle en vue de dessus.
  const dir = cam.target.clone().sub(cam.pos).normalize(), pitch = Math.asin(-dir.y) * 180 / Math.PI, top = smoothstep(38, 70, pitch);
  shared.uFogNear.value = dist * lerp(2.2, 60, top); shared.uFogFar.value = dist * lerp(10, 120, top);
  gl.scene.fog.near = shared.uFogNear.value; gl.scene.fog.far = shared.uFogFar.value;
  // Rues visibles seulement à l'échelle de la ville.
  const streetsOn = clamp((.012 - shared.uMpp.value) / .007);
  [gl.street, gl.streetCase, gl.major, gl.majorCase].forEach(m => {m.material.uniforms.uOpacity.value = streetsOn; m.visible = streetsOn > .01;});
  // Itinéraire : tracé progressif dans l'aperçu, puis la partie parcourue disparaît.
  const d = time >= T.drive ? dAt(time) : 0, reveal = time < T.reveal ? 0 : ease(span(time, T.reveal, T.reveal + 1.3)) * TOTAL;
  const from = time >= T.drive ? d : -1, to = time >= T.arrive ? -2 : reveal;
  [gl.routeCase, gl.routeFill].forEach(m => {m.material.uniforms.uFrom.value = from; m.material.uniforms.uTo.value = to;});
  gl.routeFill.material.uniforms.uOpacity.value = 1;
  // Véhicule
  const carOn = time >= T.fly + .3;
  gl.puck.visible = carOn && time < T.arrive + .6;
  if (gl.puck.visible) {
   const car = at(d), h = heading(Math.min(TOTAL - .01, d + .01), .02);
   gl.puck.position.copy(world(car, .002)); gl.puck.rotation.y = -h;
   const s = shared.uMpp.value * 24 * (1 - span(time, T.arrive, T.arrive + .6)), pulse = (performance.now() / 1600) % 1;
   gl.puck.scale.setScalar(Math.max(1e-4, s)); gl.halo.scale.setScalar(1 + pulse * .5); gl.halo.material.opacity = .22 * (1 - pulse);
  }
  gl.renderer.render(gl.scene, camera);
  // Boussole : tourne avec la carte
  const yaw = Math.atan2(dir.x, -dir.z); ui.compass.style.transform = `rotate(${-yaw}rad)`;
  updateUI(time, d, playing);
  const key = lastState + (stage.classList.contains('pl-banner-on') ? 'b' : '') + (ui.then.hidden ? '' : 't') + W + 'x' + H;
  if (key !== reservedKey) {reservedKey = key; reserved = reservedBoxes(W, H);}
  layoutLabels(time, W, H, reserved);
 }
 function loop(now) {
  if (!playing) return;
  if (last !== null && !document.hidden) t += Math.min(now - last, 100) / 1000;
  last = now; render(Math.min(t, T.end));
  if (t >= T.end) {stop(); return;}
  raf = requestAnimationFrame(loop);
 }
 function stop() {playing = false; cancelAnimationFrame(raf); skip.hidden = true;}
 function play(from = 0) {
  started = true; cancelAnimationFrame(waitFrame);
  if (!animated() || failed) {finish(); return;}
  cancelAnimationFrame(raf); stamp();
  t = from; last = null; playing = true; skip.hidden = false; lastStep = '';
  render(t); raf = requestAnimationFrame(loop);
 }
 function finish() {stop(); cancelAnimationFrame(waitFrame); t = T.end; render(t);}
 function showStop(i) {
  cancelAnimationFrame(waitFrame); stamp();
  if (animated() && !failed) {play(i === 0 ? 0 : STOP_TIMES[i] - (i === 3 ? 0 : .4)); return;}
  stop(); t = i === 3 ? T.end : STILLS[i]; render(t);
 }
 // Démarrage une fois la transition de page et l'introduction terminées.
 function whenVisible(callback) {
  cancelAnimationFrame(waitFrame); const since = performance.now();
  const check = () => {
   const curtain = document.querySelector('.wow-curtain'), shell = document.getElementById('experience-shell');
   const busy = (curtain && getComputedStyle(curtain).visibility !== 'hidden') || shell?.inert;
   if (busy && performance.now() - since < 6000) {waitFrame = requestAnimationFrame(check); return;}
   if (!stage.closest('.route-page')?.hidden) callback();
  };
  waitFrame = requestAnimationFrame(check);
 }

 stops.forEach((b, i) => b.addEventListener('click', () => showStop(i)));
 replay.addEventListener('click', () => play(0));
 skip.addEventListener('click', finish);
 new ResizeObserver(() => {reservedKey = ''; if (!playing) render(t);}).observe(stage);
 window.addEventListener('portfolio:page', e => {
  if (e.detail.id === 'entreprise') {
   if (!started) {
    started = true;
    if (animated()) {stamp(); t = 0; render(0); if (failed) {finish(); return;} whenVisible(() => play(0));}
    else finish();
   } else if (!playing) render(t);
  } else {
   if (!playing && t === 0) started = false; // quitté avant le départ : le trajet se jouera au retour
   cancelAnimationFrame(waitFrame); if (playing || t < T.end) finish();
  }
 });
 window.addEventListener('portfolio:motion', () => {if (paused && playing) finish();});
 window.addEventListener('portfolio:theme', () => {if (gl) {gl.themeName = ''; applyTheme();} if (!playing) render(t);});
 // Accès de contrôle : affiche un instant précis du trajet (utilisé pour vérifier le rendu).
 stage._plansSeek = time => {stop(); started = true; stamp(); t = time; render(t);};
 render(t);
})();
