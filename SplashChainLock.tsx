import React, { useEffect, useRef } from 'react';

interface SplashProps {
  onFinish?: () => void;
  isStandalonePreview?: boolean;
}

export const SplashChainLock: React.FC<SplashProps> = ({ onFinish, isStandalonePreview = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const $ = (id: string) => container.querySelector<SVGElement | HTMLElement>(`#${id}`);
    const D = Math.PI / 180;
    const ARC = 46 * 290 * D;
    const PL = [104.3, 158.1];
    const PR = [191.7, 158.1];
    const uL = [Math.cos(32.5 * D), Math.sin(32.5 * D)];
    const uR = [-uL[0], uL[1]];
    const SLOW = 1.25; // >1 = slower overall
    const S_R_MID = 130;
    const S_L_END = 120.4;
    const S_R_END = 247.8;

    function ez(x: number) {
      x = Math.max(0, Math.min(1, x));
      return x * x * (3 - 2 * x);
    }

    function q(s: number) {
      if (s <= ARC) {
        const t = (-40 - s / 46 / D) * D;
        return [150 + 46 * Math.cos(t), 150 + 46 * Math.sin(t)];
      }
      if (s <= ARC + 21) return [189.8, 173 - (s - ARC)];
      return [189.8 - (s - ARC - 21), 152];
    }

    function aDeg(s: number) {
      return -130 - s / 46 / D;
    }

    function pose(s: number, P: number[], phi: number, u: number[], off: number, add: number) {
      const r = phi - aDeg(s) + add;
      const c = Math.cos(r * D);
      const n = Math.sin(r * D);
      const p = q(s);
      const x = p[0] - 150;
      const y = p[1] - 150;
      return {
        r: r,
        x: P[0] + u[0] * off - 150 - (x * c - y * n),
        y: P[1] + u[1] * off - 150 - (x * n + y * c),
      };
    }

    function map(pt: number[], ps: { r: number; x: number; y: number }) {
      const c = Math.cos(ps.r * D);
      const n = Math.sin(ps.r * D);
      const x = pt[0] - 150;
      const y = pt[1] - 150;
      return [150 + x * c - y * n + ps.x, 150 + x * n + y * c + ps.y];
    }

    // ================= CHAIN PHYSICS =================
    const nx = -Math.sin(32.5 * D);
    const ny = Math.cos(32.5 * D);
    const P_DIST = 32;
    const N = 44;
    const DT = 1 / 120;
    const DAMP = 0.975;
    const GRAV = 700;
    const KSLACK = 80;
    const KTAUT = 420;
    const NS = 'http://www.w3.org/2000/svg';
    const AL = [PL[0] - 1100 * uL[0], PL[1] - 1100 * uL[1]];
    const AR = [296 - AL[0], AL[1]];

    interface SideState {
      A: number[];
      x: number[];
      y: number[];
      qx: number[];
      qy: number[];
    }

    function mkSide(A: number[]): SideState {
      const o: SideState = { A: A, x: [], y: [], qx: [], qy: [] };
      for (let i = 0; i <= N; i++) {
        o.x.push(0);
        o.y.push(0);
        o.qx.push(0);
        o.qy.push(0);
      }
      return o;
    }

    const SL = mkSide(AL);
    const SR = mkSide(AR);
    const EL: { a: SVGElement[]; b: SVGElement[] } = { a: [], b: [] };
    const ER: { a: SVGElement[]; b: SVGElement[] } = { a: [], b: [] };

    const chainsGroup = $('chains');
    if (chainsGroup) {
      chainsGroup.innerHTML = '';
      function mk(clip: boolean) {
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', '-22');
        r.setAttribute('y', '-13');
        r.setAttribute('width', '44');
        r.setAttribute('height', '26');
        r.setAttribute('rx', '13');
        r.setAttribute('fill', 'none');
        r.setAttribute('stroke', 'url(#mt)');
        r.setAttribute('stroke-width', '6');
        if (clip) r.setAttribute('clip-path', 'url(#top)');
        return r;
      }
      [EL, ER].forEach((E) => {
        for (let i = N; i >= 1; i--) {
          E.a[i] = mk(false);
          chainsGroup.appendChild(E.a[i]);
        }
      });
      [EL, ER].forEach((E) => {
        for (let i = 1; i <= N; i++) {
          E.b[i] = mk(true);
          chainsGroup.appendChild(E.b[i]);
        }
      });
    }

    function stepChain(S: SideState, E: number[], K: number, axb: number[], w: number) {
      const X = S.x;
      const Y = S.y;
      const QX = S.qx;
      const QY = S.qy;
      const A = S.A;
      const dt2 = DT * DT;
      X[0] = E[0];
      Y[0] = E[1];
      QX[0] = E[0];
      QY[0] = E[1];
      let tx = A[0] - E[0];
      let ty = A[1] - E[1];
      const tl = Math.hypot(tx, ty);
      tx /= tl;
      ty /= tl;
      let rx = E[0];
      let ry = E[1];
      for (let i = 1; i <= N; i++) {
        const mix = w * (1 - (i >= 8 ? 1 : ez(i / 8)));
        const dx = tx * (1 - mix) + axb[0] * mix;
        const dy = ty * (1 - mix) + axb[1] * mix;
        const dl = Math.hypot(dx, dy);
        rx += (dx / dl) * P_DIST;
        ry += (dy / dl) * P_DIST;
        const ki = K * (0.6 + (2.4 * i) / N);
        const vx = (X[i] - QX[i]) * DAMP;
        const vy = (Y[i] - QY[i]) * DAMP;
        QX[i] = X[i];
        QY[i] = Y[i];
        X[i] += vx + ki * (rx - X[i]) * dt2;
        Y[i] += vy + (ki * (ry - Y[i]) + GRAV) * dt2;
        const ex = X[i] - X[i - 1];
        const ey = Y[i] - Y[i - 1];
        const el = Math.hypot(ex, ey) || 1;
        X[i] = X[i - 1] + (ex * P_DIST) / el;
        Y[i] = Y[i - 1] + (ey * P_DIST) / el;
      }
    }

    function kick(S: SideState, v: number, nxv: number, nyv: number) {
      for (let i = 1; i <= N; i++) {
        const f = v * Math.exp(-i / 10);
        S.qx[i] -= nxv * f * DT;
        S.qy[i] -= nyv * f * DT;
      }
    }

    function lay(
      S: SideState,
      E: number[],
      eb: { a: SVGElement[]; b: SVGElement[] },
      _axisDeg: number,
      _wAxis: number
    ) {
      const X = S.x;
      const Y = S.y;
      X[0] = E[0];
      Y[0] = E[1];
      for (let i = 1; i <= N; i++) {
        const j = i < N ? i + 1 : i;
        let ang = Math.atan2(Y[i - 1] - Y[j], X[i - 1] - X[j]) / D;
        if (i === N) ang = Math.atan2(Y[N - 1] - Y[N], X[N - 1] - X[N]) / D;
        const tr = 'translate(' + X[i].toFixed(2) + ' ' + Y[i].toFixed(2) + ') rotate(' + ang.toFixed(2) + ')';
        eb.a[i]?.setAttribute('transform', tr);
        eb.b[i]?.setAttribute('transform', tr);
      }
    }

    function endAngle(S: SideState, axisDeg: number, w: number) {
      const tg = Math.atan2(S.y[0] - S.y[2], S.x[0] - S.x[2]) / D;
      const d = (((axisDeg - tg + 540) % 360) - 180);
      return tg + d * w;
    }

    // ---- choreography (real seconds, before the global SLOW factor) ----
    const ZOOM = 1.1;
    const S0 = 3.4;
    const TP = 1.0;
    const TC = 1.5;
    const TB = 1.75;
    const TG0 = TB + 0.4;
    const GDUR = 2.0;
    const KG = 4.5 / GDUR;
    const TEND = TG0 + (7.2 - 2.5) / KG;
    const K0 = -22;
    const K1 = -13;
    const JX = 148;
    const JY = PL[1] + K0 * ny;
    const CY = PL[1] + K1 * ny;
    const VREL = ((K1 - K0) * 2) / (TB - TP);

    function kAt(t: number) {
      if (t < TP) return K0 + 3 * Math.sin(t * 8) * (1 - t / TP);
      if (t < TB) {
        const p = (t - TP) / (TB - TP);
        return K0 + (K1 - K0) * p * p + 1.5 * Math.sin(80 * t) * 4 * p * (1 - p);
      }
      const s = t - TB;
      const kk = Math.exp(-4 * s) * (K1 * Math.cos(9 * s) + ((VREL + 4 * K1) / 9) * Math.sin(9 * s));
      const tt = 2.5 + (t - TG0) * KG;
      return kk * (1 - ez((tt - 2.5) / 0.65));
    }

    let feL = { x: 0, y: 0, vx: 0, vy: 0 };
    let feR = { x: 0, y: 0, vx: 0, vy: 0 };
    let feOn = false;
    const KEQ = 8;

    function feInit() {
      const px = PL[0] + K1 * nx;
      const py = PL[1] + K1 * ny;
      feL = { x: px, y: py, vx: VREL * nx + 8 * uL[0], vy: VREL * ny + 8 * uL[1] };
      feR = { x: 296 - px, y: py, vx: -(0.85 * VREL * nx - 5 * uL[0]), vy: 0.85 * VREL * ny - 5 * uL[1] };
      feOn = true;
    }

    function feStep(
      f: { x: number; y: number; vx: number; vy: number },
      sg: number,
      w: number,
      c: number,
      tn: number,
      ph: number
    ) {
      const rx = sg > 0 ? PL[0] + KEQ * nx : 296 - (PL[0] + KEQ * nx);
      const ry = PL[1] + KEQ * ny;
      const fo = 90 * Math.sin(2.0 * tn + ph);
      const ax = -w * w * (f.x - rx) - c * f.vx + fo * sg * nx;
      const ay = -w * w * (f.y - ry) - c * f.vy + fo * ny;
      f.vx += ax * DT;
      f.vy += ay * DT;
      f.x += f.vx * DT;
      f.y += f.vy * DT;
    }

    function drv(t: number) {
      const k = kAt(t);
      let TL = [PL[0] + k * nx, PL[1] + k * ny];
      let TR = [296 - TL[0], TL[1]];
      const tt = 2.5 + (t - TG0) * KG;
      let gp: { r: number; x: number; y: number } | null = null;
      if (t >= TB && feOn) {
        TL = [feL.x, feL.y];
        TR = [feR.x, feR.y];
      }
      if (t >= TG0) {
        const offR = 90 * (1 - ez((tt - 2.5) / 0.65));
        const sRs = S_R_MID * ez((tt - 2.95) / 1.6);
        const wL = ez((tt - 4.15) / 1.05);
        const offL = 90 * (1 - ez((tt - 4.15) / 1.05));
        const kS = ez((tt - 5.0) / 1.35);
        const sL = S_L_END * kS;
        const sR = tt < 5.0 ? sRs : S_R_MID + (S_R_END - S_R_MID) * kS;
        const a = pose(sR, PR, 147.5, uR, offR, 0);
        if (wL > 0) {
          const b = pose(sL, PL, 32.5, uL, offL, 360);
          gp = { r: a.r + (b.r - a.r) * wL, x: a.x + (b.x - a.x) * wL, y: a.y + (b.y - a.y) * wL };
        } else {
          gp = a;
        }
        const k3 = ez((tt - 6.2) / 0.8);
        if (k3 > 0) {
          gp = { r: gp.r + (720 - gp.r) * k3, x: gp.x * (1 - k3), y: gp.y * (1 - k3) };
        }
        const wR = ez((tt - 2.5) / 0.65);
        const wC = ez((tt - 4.45) / 0.75);
        TR = [TR[0] * (1 - wR) + PR[0] * wR, TR[1] * (1 - wR) + PR[1] * wR];
        TL = [TL[0] * (1 - wC) + PL[0] * wC, TL[1] * (1 - wC) + PL[1] * wC];
        if (tt >= 3.15) TR = map(q(sR), gp);
        if (tt >= 5.3) TL = map(q(sL), gp);
      }
      let tp: number;
      let tl2 = 0.1 + 0.5 * ez((tt - 4.4) / 1.3) + 0.4 * ez((tt - 5.8) / 1.4);
      let tr2 = 0.1 + 0.5 * ez((tt - 2.7) / 1.4) + 0.4 * ez((tt - 5.8) / 1.4);
      if (t < TP) tp = 0.1;
      else if (t < TB) {
        const p = (t - TP) / (TB - TP);
        tp = 0.1 + 0.9 * p * p;
      } else {
        tp = 0.1;
      }
      if (t < TB) {
        tl2 = tr2 = tp;
      }
      return {
        TL: TL,
        TR: TR,
        gp: gp,
        tt: tt,
        tenL: tl2,
        tenR: tr2,
        wAxL: ez((tt - 4.9) / 0.4),
        wAxR: ez((tt - 2.8) / 0.4),
      };
    }

    let simT = 0;
    let kC = false;
    let kS = false;
    const TCATCH = TG0 + (3.0 - 2.5) / KG;
    const TSNAP = TG0 + (7 - 2.5) / KG;
    const AXL = [-uL[0], -uL[1]];
    const AXR = [-uR[0], -uR[1]];

    function simStep() {
      const tn = simT + DT;
      if (tn >= TB) {
        if (!feOn) feInit();
        feStep(feL, 1, 6.0, 0.9, tn, 0);
        feStep(feR, -1, 6.6, 1.0, tn, 1.7);
      }
      const d = drv(tn);
      stepChain(SL, d.TL, KSLACK + (KTAUT - KSLACK) * d.tenL, AXL, d.wAxL);
      stepChain(SR, d.TR, KSLACK + (KTAUT - KSLACK) * d.tenR, AXR, d.wAxR);
      if (!kC && tn >= TCATCH) {
        kC = true;
        kick(SL, 12, nx, ny);
        kick(SR, -35, -nx, ny);
      }
      if (!kS && tn >= TSNAP) {
        kS = true;
        kick(SL, 70, nx, ny);
        kick(SR, 70, -nx, ny);
      }
      simT = tn;
    }

    function reset() {
      const d = drv(0);
      [
        [SL, d.TL],
        [SR, d.TR],
      ].forEach((pair) => {
        const S = pair[0] as SideState;
        const E = pair[1] as number[];
        let dx = S.A[0] - E[0];
        let dy = S.A[1] - E[1];
        const dl = Math.hypot(dx, dy);
        dx /= dl;
        dy /= dl;
        for (let i = 0; i <= N; i++) {
          S.x[i] = S.qx[i] = E[0] + dx * P_DIST * i;
          S.y[i] = S.qy[i] = E[1] + dy * P_DIST * i;
        }
      });
      simT = 0;
      kC = false;
      kS = false;
      feOn = false;
      const K = KSLACK + (KTAUT - KSLACK) * d.tenL;
      for (let i = 0; i < 200; i++) {
        stepChain(SL, d.TL, K, AXL, 0);
        stepChain(SR, d.TR, K, AXR, 0);
      }
      kick(SL, 50, nx, ny);
      kick(SR, -30, -nx, ny);
    }

    let inited = false;
    let fired = false;

    function render(t: number) {
      if (!inited || t < simT - 1e-6) {
        reset();
        inited = true;
      }
      while (simT + DT <= t + 1e-9) simStep();
      const d = drv(t);
      const TL = d.TL;
      const TR = d.TR;
      const gp = d.gp;
      const tt = d.tt;

      SL.x[0] = TL[0];
      SL.y[0] = TL[1];
      SR.x[0] = TR[0];
      SR.y[0] = TR[1];
      lay(SL, TL, EL, 0, 0);
      lay(SR, TR, ER, 0, 0);

      const aL = endAngle(SL, 32.5, d.wAxL);
      const aR = endAngle(SR, 147.5, d.wAxR);
      const tL = 'translate(' + TL[0] + ' ' + TL[1] + ') rotate(' + aL + ')';
      const tR = 'translate(' + TR[0] + ' ' + TR[1] + ') rotate(' + aR + ')';
      $('eBL')?.setAttribute('transform', tL);
      $('eFL')?.setAttribute('transform', tL);
      $('eBR')?.setAttribute('transform', tR);
      $('eFR')?.setAttribute('transform', tR);

      // joint link and broken halves
      if (t < TB) {
        $('jg')?.setAttribute('visibility', 'visible');
        $('jg')?.setAttribute('transform', 'translate(' + (TL[0] + TR[0]) / 2 + ' ' + (TL[1] + TR[1]) / 2 + ')');
        $('crack')?.setAttribute('opacity', ez((t - TC) / 0.1).toString());
        $('hL')?.setAttribute('visibility', 'hidden');
        $('hR')?.setAttribute('visibility', 'hidden');
      } else {
        const s2 = t - TB;
        const f = 1 - ez(s2 / 0.45);
        const g = 520 * s2 * s2 + 25 * s2;
        const base = 'translate(' + JX + ' ' + CY + ') ';
        $('jg')?.setAttribute('visibility', 'hidden');
        $('hL')?.setAttribute('visibility', f > 0 ? 'visible' : 'hidden');
        $('hR')?.setAttribute('visibility', f > 0 ? 'visible' : 'hidden');
        $('hL')?.setAttribute('opacity', f.toString());
        $('hR')?.setAttribute('opacity', f.toString());
        $('hL')?.setAttribute('transform', 'translate(' + -60 * s2 + ' ' + g + ') ' + base + 'rotate(' + -300 * s2 + ' -11 0)');
        $('hR')?.setAttribute('transform', 'translate(' + 60 * s2 + ' ' + g + ') ' + base + 'rotate(' + 300 * s2 + ' 11 0)');
      }

      // the G
      if (!gp) {
        $('g')?.setAttribute('opacity', '0');
      } else {
        $('g')?.setAttribute('opacity', Math.min(1, (tt - 2.5) / 0.25).toString());
        $('g')?.setAttribute('transform', 'translate(' + gp.x + ' ' + gp.y + ') rotate(' + gp.r + ' 150 150)');
      }

      // camera zoom and pull back
      const e = 1 - Math.pow(1 - Math.min(1, t / ZOOM), 3);
      const sc = S0 + (1 - S0) * e;
      const cx = 150 + (JX - 150) * e;
      const cy = 170 + (JY - 170) * e;
      $('cam')?.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(' + sc + ') translate(' + -JX + ' ' + -JY + ')');

      if (tt >= 7 && !fired) {
        fired = true;
        $('snap')?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }], {
          duration: 260 * SLOW,
        });
        $('pulse')?.animate(
          [
            { opacity: '0.5', transform: 'scale(0.9)' },
            { opacity: '0', transform: 'scale(1.55)' },
          ],
          { duration: 420 * SLOW }
        );
      }
    }

    const HOLD = 200;
    const FADE = 350;
    let t0 = 0;
    let raf = 0;
    const reduce = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function finish() {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setTimeout(() => {
        container?.querySelector('.screen')?.classList.add('out');
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('grip:splash-done'));
          if (onFinish) onFinish();
        }, FADE);
      }, HOLD);
    }

    const TRUN = TEND + 0.45;

    function loop() {
      const t = (performance.now() - t0) / 1000 / SLOW;
      render(Math.min(t, TRUN));
      if (t < TRUN) {
        raf = requestAnimationFrame(loop);
      } else {
        finish();
      }
    }

    if (reduce) {
      fired = true;
      render(TRUN);
      finish();
    } else {
      t0 = performance.now();
      loop();
    }

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [onFinish]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center select-none overflow-hidden"
      dir="rtl"
    >
      <style>{`
        .grip-splash-screen {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          background: radial-gradient(circle at 50% 40%, #E9E3FB 0%, #F8F9FA 64%);
          color: #1F2433;
          transition: opacity 0.35s ease;
        }
        .grip-splash-screen.out {
          opacity: 0;
        }
        .grip-splash-screen svg {
          width: min(94vw, 380px);
          height: auto;
          overflow: visible;
        }
        .grip-splash-screen h1 {
          font-size: 40px;
          letter-spacing: 2px;
          color: #6D28D9;
          margin-top: 2px;
          font-weight: 900;
          font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif;
        }
        .grip-splash-screen .v {
          display: inline-block;
          font-size: 11px;
          color: #6D28D9;
          background: #E9E3FB;
          padding: 2px 9px;
          border-radius: 10px;
          vertical-align: middle;
          margin-inline-start: 8px;
          letter-spacing: 0;
          font-weight: bold;
        }
        .grip-splash-screen .en {
          margin-top: 10px;
          font-size: 16px;
          font-weight: 600;
          color: #1F2433;
          font-family: "Plus Jakarta Sans", sans-serif;
        }
        .grip-splash-screen .ar {
          margin-top: 4px;
          font-size: 15px;
          color: #6B7280;
          font-weight: 700;
          font-family: "Cairo", "Segoe UI", sans-serif;
        }
      `}</style>

      <main className="grip-splash-screen screen">
        <svg
          id="logo"
          viewBox="-40 40 380 260"
          role="img"
          aria-label="سلسلتان معلّقتان تتدلّيان ثم تنفتحان، وحرف G يمرّ داخل حلقتيهما ويلفّ ثم يستقر"
        >
          <defs>
            <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#5B21B6" />
            </linearGradient>
            <linearGradient id="mt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#B8BFD6" />
              <stop offset="1" stopColor="#8C93B0" />
            </linearGradient>
            <clipPath id="half">
              <rect x="0" y="-30" width="40" height="60" />
            </clipPath>
            <clipPath id="top">
              <rect x="-40" y="-30" width="80" height="30" />
            </clipPath>
            <g id="rng">
              <rect x="-22" y="-13" width="44" height="26" rx="13" fill="none" stroke="url(#mt)" strokeWidth="6" />
            </g>
          </defs>

          <g id="cam">
            <g id="chains"></g>
            <g id="cap">
              <g id="jg">
                <rect x="-22" y="-13" width="44" height="26" rx="13" fill="none" stroke="url(#mt)" strokeWidth="6" />
                <path
                  id="crack"
                  d="M0 -17 L3 -13.5 L-2 -12 L1 -9 M0 17 L-3 13.5 L2 12 L-1 9"
                  fill="none"
                  stroke="#4B5068"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0"
                />
              </g>
              <g id="hL" visibility="hidden">
                <path d="M2 -13 H-9 A13 13 0 0 0 -9 13 H-2" fill="none" stroke="url(#mt)" strokeWidth="6" />
              </g>
              <g id="hR" visibility="hidden">
                <path d="M2 -13 H9 A13 13 0 0 1 9 13 H-2" fill="none" stroke="url(#mt)" strokeWidth="6" />
              </g>
            </g>
            <g id="eBL">
              <use href="#rng" />
            </g>
            <g id="eBR">
              <use href="#rng" />
            </g>
            <circle
              id="pulse"
              cx="150"
              cy="150"
              r="58"
              fill="none"
              stroke="#7C3AED"
              strokeWidth="3"
              opacity="0"
              style={{ transformOrigin: '150px 150px' }}
            />
            <g id="snap" style={{ transformOrigin: '150px 150px' }}>
              <g id="g" opacity="0">
                <path
                  d="M185.2 120.4 A46 46 0 1 0 189.8 173 L189.8 152 L154 152"
                  fill="none"
                  stroke="url(#gg)"
                  strokeWidth="15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
            <g id="eFL">
              <use href="#rng" clipPath="url(#half)" />
            </g>
            <g id="eFR">
              <use href="#rng" clipPath="url(#half)" />
            </g>
          </g>
        </svg>

        <h1>
          GRIP<span className="v">v1.0</span>
        </h1>
        <p className="en">Hold your focus. Kill the drift.</p>
        <p className="ar">امسك تركيزك. اقطع التشتت.</p>

        {onFinish && (
          <button
            type="button"
            onClick={() => {
              if (onFinish) onFinish();
            }}
            className="mt-6 px-4 py-1.5 rounded-full text-xs font-bold text-[#6D28D9] bg-[#E9E3FB] hover:bg-[#DDD6FE] transition-colors cursor-pointer shadow-xs"
          >
            تخطي ومتابعة
          </button>
        )}
      </main>
    </div>
  );
};
