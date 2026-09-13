// 프레임 스냅샷 + 프레이밍 검사기
//   node scripts/stills.mjs <compId> <outDir> <frame>...   스틸 뽑기
//   node scripts/stills.mjs --check                        정면 레이어 센터링·화면 밖 잘림 검사
// 회전 레이어에서 translate(-50%) 가 transform-origin 과 겹쳐 가로로 밀린 적이 두 번 있다.
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const SCALE = 0.5;

const render = async (serveUrl, id, frames, dir) => {
  const composition = await selectComposition({serveUrl, id});
  const out = [];
  for (const f of frames) {
    const output = path.join(dir, `f${String(f).padStart(5, '0')}.png`);
    await renderStill({composition, serveUrl, output, frame: f, overwrite: true, scale: SCALE});
    out.push({frame: f, output, w: composition.width * SCALE, h: composition.height * SCALE});
  }
  return out;
};

/** 밝은 픽셀(글자) 바운딩 박스 */
const bbox = (file, w, h, thr = 140) => {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], {
    maxBuffer: 1 << 28,
  });
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (raw[y * w + x] > thr) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : {x0, x1, y0, y1};
};

const [a, b, ...rest] = process.argv.slice(2);

if (a === '--check') {
  // 카메라 정면(lat 0)에 놓인 레이어만 고른다 — 화면 정중앙에 와야 한다
  const CHECKS = [
    {id: 'KineticMain', frames: [60, 300, 1440, 1600, 1780, 2300, 2470]},
    {id: 'KineticVertical', frames: [40, 160, 460, 550, 640, 730, 860]},
  ];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kt-check-'));
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  let bad = 0;
  for (const c of CHECKS) {
    for (const r of await render(serveUrl, c.id, c.frames, dir)) {
      const bx = bbox(r.output, r.w, r.h);
      if (!bx) {
        console.error(`FAIL ${c.id} f${r.frame}: 글자 없음`);
        bad++;
        continue;
      }
      const off = (bx.x0 + bx.x1) / 2 - r.w / 2;
      const clipped = bx.x0 <= 2 || bx.x1 >= r.w - 3 || bx.y0 <= 2 || bx.y1 >= r.h - 3;
      if (Math.abs(off) > 8 || clipped) {
        console.error(`FAIL ${c.id} f${r.frame}: 중심 ${off.toFixed(1)}px${clipped ? ' · 화면 밖 잘림' : ''}`);
        bad++;
      } else {
        console.log(`ok   ${c.id} f${r.frame} 중심 ${off.toFixed(1)}px`);
      }
    }
  }
  fs.rmSync(dir, {recursive: true, force: true});
  if (bad) {
    console.error(`\n${bad}건 실패`);
    process.exit(1);
  }
  console.log('\n프레이밍 이상 없음');
} else {
  if (!a || !b || rest.length === 0) {
    console.error('usage: node scripts/stills.mjs <compId> <outDir> <frame>...  |  --check');
    process.exit(1);
  }
  fs.mkdirSync(b, {recursive: true});
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  for (const r of await render(serveUrl, a, rest.map(Number), b)) console.log('ok', r.output);
}
