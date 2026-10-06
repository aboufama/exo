// A sagittal-plane walking gait from normative joint-angle curves (degrees over the gait cycle, right side;
// the left side runs half a cycle behind). Segment lengths are Winter's fractions of body height. The pelvis
// moves forward so that the stance ankle stays put on the ground.
const H = 1.75;
const L = {thigh: .245 * H, shank: .246 * H, torso: .288 * H, upper: .186 * H, fore: .146 * H, hand: .108 * H,
  neck: .07 * H, head: .065 * H, heel: .05, toe: .2, ankleY: .039 * H};

// [percent, degrees] keypoints, periodic
const HIP = [[0, 30], [10, 25], [20, 18], [30, 8], [40, 0], [50, -8], [55, -10], [60, -5], [65, 5], [70, 15], [75, 23], [80, 28], [85, 32], [90, 33], [95, 31]];
const KNEE = [[0, 5], [5, 12], [10, 17], [15, 18], [20, 15], [30, 8], [40, 5], [45, 6], [50, 12], [55, 22], [60, 37], [65, 52], [70, 60], [73, 62], [80, 55], [85, 40], [90, 20], [95, 6]];
const ANKLE = [[0, 0], [5, -5], [10, -3], [20, 4], [30, 8], [40, 10], [45, 10], [50, 5], [55, -5], [60, -15], [62, -18], [65, -15], [70, -8], [80, 0], [90, 2]];

function periodic(keys) {
  // Catmull-Rom through periodic keypoints
  const P = keys.map(([p, v]) => [p / 100, v]);
  return t => {
    t = ((t % 1) + 1) % 1;
    let i = P.findIndex((k, n) => t >= k[0] && t < (n + 1 < P.length ? P[n + 1][0] : 1));
    const n = P.length, at = k => { const m = ((k % n) + n) % n, wrap = Math.floor(k / n); return [P[m][0] + wrap, P[m][1]]; };
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const u = (t - p1[0]) / (p2[0] - p1[0]);
    const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * (p2[0] - p1[0]), m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * (p2[0] - p1[0]);
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p1[1] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[1] + (u3 - u2) * m2;
  };
}
const hip = periodic(HIP), knee = periodic(KNEE), ankle = periodic(ANKLE);
const rad = d => d * Math.PI / 180;
const down = (a, len) => [Math.sin(a) * len, -Math.cos(a) * len]; // rotate the down vector forward by a

// One leg relative to the hip joint at phase t.
function leg(t, lean) {
  const th = rad(hip(t) - 10) + lean, sh = th - rad(knee(t)), ft = sh + rad(90 + ankle(t)); // hip angles are taken from a pelvis tilted ~10° forward
  const k = down(th, L.thigh), a = [k[0] + down(sh, L.shank)[0], k[1] + down(sh, L.shank)[1]];
  const dir = [Math.sin(ft), -Math.cos(ft)]; // foot direction (forward when standing)
  const toe = [a[0] + dir[0] * L.toe, a[1] + dir[1] * L.toe];
  const heel = [a[0] - dir[0] * L.heel, a[1] - dir[1] * L.heel];
  // sole points sit below the ankle by the ankle height, along the foot's normal
  const nrm = [dir[1], -dir[0]]; // pointing down-ish
  const drop = L.ankleY;
  return {knee: k, ankle: a, toe: [toe[0] + nrm[0] * drop, toe[1] + nrm[1] * drop], heel: [heel[0] + nrm[0] * drop, heel[1] + nrm[1] * drop]};
}

// Frames of the whole body over [t0, t1] cycles, n samples. The stance foot is the one in the first half of its
// cycle; it touches the ground at its heel until 35% of the cycle, then at its toe. The pelvis sits so that point
// is at y = 0, and moves forward by however much that point would otherwise slide back, so stance feet stay put.
const phase = t => ((t % 1) + 1) % 1;
function contact(t, R, Lf) {
  const right = phase(t) < .5, p = right ? phase(t) : phase(t + .5), F = right ? R : Lf;
  return {key: (right ? 'r' : 'l') + (p < .35 ? 'h' : 't'), point: p < .35 ? F.heel : F.toe};
}
function walk(t0, t1, n, {lean = rad(4)} = {}) {
  const frames = [], sub = 16, total = (Math.max(n, 2) - 1) * sub;
  let x = 0, last = null;
  for (let s = 0; s <= total; s++) {
    const t = t0 + (t1 - t0) * s / total;
    const R = leg(t, 0), Lf = leg(t + .5, 0), pts = {rh: R.heel, rt: R.toe, lh: Lf.heel, lt: Lf.toe};
    const {key, point} = contact(t, R, Lf);
    if (last) x -= point[0] - last[key][0];
    last = pts;
    const y = -Math.min(...Object.values(pts).map(p => p[1]));
    if (s % sub === 0) frames.push(body(t, x, y, R, Lf, lean));
  }
  return frames;
}

function body(t, x, y, R, Lf, lean) {
  const P = [x, y];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sh = add(P, [Math.sin(lean) * L.torso, Math.cos(lean) * L.torso]);
  const neck = add(sh, [Math.sin(lean) * L.neck, Math.cos(lean) * L.neck]);
  const head = add(neck, [Math.sin(lean) * L.head * 1.1, Math.cos(lean) * L.head * 1.1]);
  const arm = (phase) => {
    const s = rad(-18 * Math.cos(2 * Math.PI * phase) - 2), e = rad(22 + 14 * Math.cos(2 * Math.PI * (phase + .5)));
    const elbow = add(sh, down(s, L.upper)), wrist = add(elbow, down(s + e, L.fore)), hand = add(wrist, down(s + e + rad(4), L.hand));
    return {shoulder: sh, elbow, wrist, hand};
  };
  const leg = F => ({hip: P, knee: add(P, F.knee), ankle: add(P, F.ankle), toe: add(P, F.toe), heel: add(P, F.heel)});
  return {t, pelvis: P, shoulder: sh, neck, head, right: {...leg(R), ...arm(t)}, left: {...leg(Lf), ...arm(t + .5)}};
}

window.walk = walk; window.HEIGHT = H; window.GAIT_L = L;
