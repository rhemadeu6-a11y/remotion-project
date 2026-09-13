/**
 * 람스튜디오 키네틱 타이포 소개영상 (기획안 V3 — CGV Introduction 레퍼런스)
 * 3D 텍스트 공간을 카메라가 컷 없이 이동한다. CSS 3D + 카메라 역변환.
 * 팔레트 01 INK & LIGHT / 서체 Pretendard + Archivo (브랜드가이드 v2.0)
 */
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export const KT_FPS = 30;
export const KT_MAIN_FRAMES = 30 * 90; // 90초
export const KT_VERT_FRAMES = 30 * 30; // 30초

// ---------- 팔레트 (01 INK & LIGHT) ----------
const INK = '#191A1D';
const GRAPHITE = '#4A4D52';
const KEY_LIGHT = '#C08442'; // 다크 그라운드 전용 강조. 페이퍼 위에는 쓰지 않는다
const LINE = '#DEDCD7';
const PAPER = '#F3F2EF';

const KR = "'Pretendard', sans-serif";
const EN = "'Archivo', sans-serif";

// ---------- 3D 헬퍼 ----------
const P = 1400; // perspective
const RAD = Math.PI / 180;
type V3 = [number, number, number];

const fwd = (yaw: number): V3 => [-Math.sin(yaw * RAD), 0, -Math.cos(yaw * RAD)];
const rgt = (yaw: number): V3 => [Math.cos(yaw * RAD), 0, -Math.sin(yaw * RAD)];

/** 카메라 스테이션 기준으로 월드 좌표를 잡는다. up 은 화면 위쪽(+) */
const place = (cam: V3, yaw: number, d: number, lat = 0, up = 0): V3 => {
  const f = fwd(yaw);
  const r = rgt(yaw);
  return [cam[0] + f[0] * d + r[0] * lat, cam[1] - up, cam[2] + f[2] * d + r[2] * lat];
};

/** 카메라 전방 거리. 음수면 뒤에 있다 */
const depthOf = (p: V3, cam: V3, yaw: number) => {
  const f = fwd(yaw);
  return (p[0] - cam[0]) * f[0] + (p[2] - cam[2]) * f[2];
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type CamKey = {f: number; pos: V3; yaw: number; pitch?: number};

const camAt = (frame: number, keys: CamKey[]) => {
  let i = 0;
  while (i < keys.length - 2 && frame >= keys[i + 1].f) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const raw = b.f === a.f ? 1 : (frame - a.f) / (b.f - a.f);
  const t = easeInOut(Math.max(0, Math.min(1, raw)));
  const mix = (x: number, y: number) => x + (y - x) * t;
  return {
    pos: [mix(a.pos[0], b.pos[0]), mix(a.pos[1], b.pos[1]), mix(a.pos[2], b.pos[2])] as V3,
    yaw: mix(a.yaw, b.yaw),
    pitch: mix(a.pitch ?? 0, b.pitch ?? 0),
  };
};

// ---------- 레이어 ----------
type Layer = {
  key: string;
  pos: V3;
  ry: number;
  in: number;
  out?: number;
  eyebrow?: string; // Archivo 소형 라벨
  head?: string;
  count?: {from: number; to: number; s: number; e: number; suffix: string};
  eng?: string; // Archivo 디스플레이 단어
  sub?: string;
  size?: number;
  subSize?: number;
  accent?: boolean;
  scale?: number; // 세로판 1.4배
};

const TextLayer: React.FC<{L: Layer; cam: V3; yaw: number; frame: number}> = ({L, cam, yaw, frame}) => {
  const depth = depthOf(L.pos, cam, yaw);

  // 안개 · 피사계심도 (카메라 거리로만 계산)
  const fog = interpolate(depth, [4000, 5600], [1, 0], clamp) * interpolate(depth, [260, 860], [0, 1], clamp);
  const blur = Math.min(
    12,
    interpolate(depth, [4200, 6200], [0, 9], clamp) + interpolate(depth, [480, 1150], [8, 0], clamp)
  );

  // 등장 · 퇴장
  const enter = easeOut(interpolate(frame, [L.in, L.in + 20], [0, 1], clamp));
  const exit = L.out === undefined ? 1 : interpolate(frame, [L.out, L.out + 18], [1, 0], clamp);
  const opacity = fog * enter * exit;
  if (opacity < 0.004) return null;

  const s = L.scale ?? 1;
  const rise = (1 - enter) * 34;
  const track = interpolate(enter, [0, 1], [0.13, -0.035]); // 브랜드: 큰 제목은 음수 자간
  const color = L.accent ? KEY_LIGHT : PAPER;
  const num =
    L.count &&
    Math.round(interpolate(frame, [L.count.s, L.count.e], [L.count.from, L.count.to], clamp)).toLocaleString('en-US');

  // 회전 레이어는 크기 0 피벗 + 자식 센터링으로 잡는다.
  // 한 div 에 rotateY 와 translate(-50%) 를 같이 걸면 transform-origin 때문에
  // w/2*(1-cos) 만큼 가로로 밀린다.
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 0,
        height: 0,
        transform: `translate3d(${L.pos[0]}px, ${L.pos[1]}px, ${L.pos[2]}px) rotateY(${L.ry}deg)`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 'max-content',
          opacity,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          transform: `translate(-50%, -50%) translateY(${rise}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22 * s,
          whiteSpace: 'nowrap',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {L.eyebrow && (
          <div
            style={{
              fontFamily: EN,
              fontSize: 40 * s,
              fontWeight: 600,
              letterSpacing: '0.34em',
              color: KEY_LIGHT,
              paddingLeft: '0.34em',
            }}
          >
            {L.eyebrow}
          </div>
        )}
        {L.eng && (
          <div
            style={{
              fontFamily: EN,
              fontSize: (L.size ?? 150) * s,
              fontWeight: 800,
              letterSpacing: `${track + 0.02}em`,
              color,
              lineHeight: 1,
            }}
          >
            {L.eng}
          </div>
        )}
        {(L.head || num) && (
          <div
            style={{
              fontFamily: KR,
              fontSize: (L.size ?? 150) * s,
              fontWeight: 800,
              letterSpacing: `${track}em`,
              color,
              lineHeight: 1.08,
            }}
          >
            {num ? `${num}${L.count!.suffix}` : L.head}
          </div>
        )}
        {L.sub && (
          <div
            style={{
              fontFamily: KR,
              fontSize: (L.subSize ?? 52) * s,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: LINE,
              opacity: 0.72,
              lineHeight: 1.4,
            }}
          >
            {L.sub}
          </div>
        )}
      </div>
    </div>
  );
};

/** 도면 그리드 바닥 — 브랜드 그래픽 언어(그리드·치수선) */
const GridFloor: React.FC<{center: V3; size: number}> = ({center, size}) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: size,
      height: size,
      transform: `translate3d(${center[0]}px, ${center[1]}px, ${center[2]}px) rotateX(90deg) translate(-50%, -50%)`,
      backgroundImage: `repeating-linear-gradient(0deg, ${GRAPHITE} 0 2px, transparent 2px 420px),
        repeating-linear-gradient(90deg, ${GRAPHITE} 0 2px, transparent 2px 420px)`,
      opacity: 0.2,
      maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 62%)',
      WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 62%)',
    }}
  />
);

const Stage: React.FC<{layers: Layer[]; keys: CamKey[]; floor?: {center: V3; size: number}}> = ({
  layers,
  keys,
  floor,
}) => {
  const frame = useCurrentFrame();
  const {pos, yaw, pitch} = camAt(frame, keys);
  return (
    <AbsoluteFill style={{backgroundColor: INK, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 42%, #23252A 0%, ${INK} 55%, #0D0E10 100%)`,
        }}
      />
      <AbsoluteFill style={{perspective: P, perspectiveOrigin: '50% 50%'}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transform: `translateZ(${P}px) rotateX(${pitch}deg) rotateY(${-yaw}deg) translate3d(${-pos[0]}px, ${-pos[1]}px, ${-pos[2]}px)`,
          }}
        >
          {floor && <GridFloor center={floor.center} size={floor.size} />}
          {layers.map((L) => (
            <TextLayer key={L.key} L={L} cam={pos} yaw={yaw} frame={frame} />
          ))}
        </div>
      </AbsoluteFill>
      {/* 비네트 + 엔드 페이드 (스크린 공간) */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 78% 70% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// =====================================================================
// 16:9 · 90초 본편
// =====================================================================
const C2: V3 = [0, 0, -4400]; // 챕터2 회전 피벗
const C3: V3 = place(C2, -70, 1700); // 챕터3 시작
const C4: V3 = place(C3, -70, 8000); // 챕터4·5 기준

const mainKeys: CamKey[] = [
  {f: 0, pos: [0, 0, 1600], yaw: 0},
  {f: 90, pos: [0, 0, 780], yaw: 0},
  {f: 240, pos: C2, yaw: 0},
  {f: 300, pos: C2, yaw: 48},
  {f: 370, pos: C2, yaw: 48},
  {f: 430, pos: C2, yaw: 0},
  {f: 490, pos: C2, yaw: 0},
  {f: 550, pos: C2, yaw: -48},
  {f: 610, pos: C2, yaw: -48},
  {f: 720, pos: C3, yaw: -70},
  {f: 840, pos: place(C3, -70, 1700), yaw: -70, pitch: 12},
  {f: 1020, pos: place(C3, -70, 4200), yaw: -70, pitch: 12},
  {f: 1120, pos: place(C3, -70, 5000), yaw: -70, pitch: 4},
  {f: 1170, pos: place(C3, -70, 6200), yaw: -70, pitch: 3},
  {f: 1260, pos: place(C3, -70, 7600), yaw: -70, pitch: 2},
  {f: 1320, pos: C4, yaw: -70},
  {f: 1400, pos: [C4[0], -2400, C4[2]], yaw: -70, pitch: -2},
  {f: 1500, pos: [C4[0], -2400, C4[2]], yaw: -70, pitch: -2},
  {f: 1590, pos: [C4[0], -700, C4[2]], yaw: -70, pitch: -2},
  {f: 1690, pos: [C4[0], -700, C4[2]], yaw: -70, pitch: -2},
  {f: 1790, pos: [C4[0], 1000, C4[2]], yaw: -70},
  {f: 1920, pos: [C4[0], 1000, C4[2]], yaw: -70},
  {f: 1990, pos: place([C4[0], 140, C4[2]], -70, -280), yaw: -70},
  {f: 2040, pos: place([C4[0], 60, C4[2]], -70, -700), yaw: -70},
  {f: 2160, pos: place(C4, -70, -1400), yaw: -70},
  {f: 2280, pos: place(C4, -70, -2050), yaw: -70},
  {f: 2400, pos: place(C4, -70, -2600), yaw: -70},
  {f: 2700, pos: place(C4, -70, -3100), yaw: -70},
];

const L = (o: Layer) => o;

const mainLayers: Layer[] = [
  // 카피의 숫자·이름은 전부 0_공통자료/람스튜디오-회사정보.md 에서 가져왔다.
  // 금지: 금액 · 대표 실명 · 협력사명 · "만족도 100%"(금지 카피) · 미보유 장비(LED월·음향·트러스)

  // --- 챕터 1 오프닝 ---
  L({key: 'o1', pos: [0, 0, -1200], ry: 0, in: 20, out: 190, eyebrow: 'RAM STUDIO', head: '람스튜디오', size: 260}),
  L({key: 'o2', pos: [0, -90, -3000], ry: 0, in: 88, out: 200, head: '경기도 파주, 2023년부터', size: 155}),
  L({key: 'o3', pos: [0, 80, -6000], ry: 0, in: 146, out: 232, head: '공간을 만들고, 장면을 기록하고', size: 130}),

  // --- 챕터 2 우리는 ---
  L({key: 'c21', pos: place(C2, 48, 2400), ry: 48, in: 250, out: 700, head: '촬영이 필요할 때', size: 190}),
  L({key: 'c22', pos: place(C2, 0, 2400), ry: 0, in: 372, out: 700, head: '무대가 필요할 때', size: 190}),
  L({key: 'c23', pos: place(C2, -48, 2400), ry: -48, in: 492, out: 600, head: '둘 다 필요할 때', size: 190}),
  L({key: 'c24', pos: place(C2, -70, 3600), ry: -70, in: 596, out: 742, head: '한 팀이면 됩니다', size: 230, accent: true}),

  // --- 챕터 3 숫자로 (전부 실측치) ---
  L({
    key: 'n1',
    pos: place(C3, -70, 2950, 380, 430),
    ry: -54,
    in: 718,
    out: 896,
    count: {from: 0, to: 150, s: 722, e: 838, suffix: '평'},
    size: 300,
    sub: '단독건물 무주 호리존 · 496㎡',
    subSize: 72,
  }),
  L({
    key: 'n2',
    pos: place(C3, -70, 5350, -380, 430),
    ry: -86,
    in: 866,
    out: 1042,
    count: {from: 0, to: 35, s: 872, e: 975, suffix: 'kW'},
    size: 300,
    sub: '단독 급전 · 높이 5m 호리존 · 전동바텐',
    subSize: 72,
  }),
  L({
    key: 'n3',
    pos: place(C3, -70, 7900, 340, 300),
    ry: -58,
    in: 1048,
    out: 1166,
    eyebrow: 'OWNED',
    head: '64종 110점',
    size: 230,
    sub: '카메라 5대 · 무빙 40대 · 연속광 LED',
    subSize: 72,
  }),
  L({
    key: 'n4',
    pos: place(C3, -70, 9900),
    ry: -70,
    in: 1196,
    out: 1338,
    count: {from: 0, to: 1700, s: 1204, e: 1300, suffix: '석'},
    size: 260,
    sub: '대형 무대 현장까지',
    subSize: 72,
  }),

  // --- 챕터 4 세 기둥 (브랜드 3축) ---
  L({
    key: 'p1',
    pos: place(C4, -70, 2100, 0, 2400),
    ry: -70,
    in: 1330,
    out: 1560,
    eng: 'STUDIO',
    size: 230,
    sub: '촬영과 무대를 같은 공간에서',
    subSize: 84,
  }),
  L({
    key: 'p2',
    pos: place(C4, -70, 2100, 0, 700),
    ry: -70,
    in: 1520,
    out: 1740,
    eng: 'VIDEO PRODUCTION',
    size: 180,
    sub: '브랜드 필름 · 기업 홍보 · 인터뷰 · 기록',
    subSize: 84,
  }),
  L({
    key: 'p3',
    pos: place(C4, -70, 2100, 0, -1000),
    ry: -70,
    in: 1700,
    out: 1940,
    eng: 'STAGE SYSTEM',
    size: 205,
    sub: '설계부터 현장 운영까지',
    subSize: 84,
  }),

  // --- 챕터 5 왜 우리인가 (검증 가능한 지표만) ---
  L({
    key: 'w1',
    pos: place(C4, -70, 1600, -150, 300),
    ry: -70,
    in: 1930,
    out: 2150,
    head: '작업 44건 · 평점 5.0',
    size: 120,
    sub: '리뷰 40건',
    subSize: 70,
  }),
  L({key: 'w3', pos: place(C4, -70, 200, 240, 20), ry: -70, in: 2164, out: 2258, head: '현장을 아는 팀이 촬영도 합니다', size: 150}),
  L({
    key: 'w4',
    pos: C4,
    ry: -70,
    in: 2276,
    out: 2424,
    head: '기획 · 촬영 · 무대 · 송출',
    size: 185,
    accent: true,
    sub: '람스튜디오',
    subSize: 92,
  }),

  // --- 클로징 ---
  L({
    key: 'z1',
    pos: place(C4, -70, -1500, 0, 260),
    ry: -70,
    in: 2436,
    eyebrow: 'CATCH YOUR HIGHEST MOMENT',
    head: '람스튜디오',
    size: 215,
  }),
  L({
    key: 'z2',
    pos: place(C4, -70, -1500, 0, -300),
    ry: -70,
    in: 2544,
    head: '010-3400-9279 · 카카오톡 문의',
    size: 74,
    sub: 'ramstudio.kr · 07:00~23:00 평균 30분 내 응답',
    subSize: 58,
  }),
];

export const KineticMain: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 16], [0, 1], clamp);
  const fadeOut = interpolate(frame, [KT_MAIN_FRAMES - 20, KT_MAIN_FRAMES], [1, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: fadeIn * fadeOut}}>
        <Stage layers={mainLayers} keys={mainKeys} floor={{center: [C3[0], 900, C3[2] - 2000], size: 26000}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// =====================================================================
// 9:16 · 30초 컷다운 — 카메라 Y축 이동만, 텍스트 1.4배
// =====================================================================
const VS = 1.65;
const VZ = -2400;
const vy = (i: number) => i * 1500;

const vertKeys: CamKey[] = [
  {f: 0, pos: [0, vy(0), 0], yaw: 0},
  {f: 84, pos: [0, vy(0), 0], yaw: 0},
  {f: 120, pos: [0, vy(1), -60], yaw: 0},
  {f: 228, pos: [0, vy(1), -60], yaw: 0},
  {f: 264, pos: [0, vy(2), -120], yaw: 0},
  {f: 318, pos: [0, vy(2), -120], yaw: 0},
  {f: 354, pos: [0, vy(3), -180], yaw: 0},
  {f: 408, pos: [0, vy(3), -180], yaw: 0},
  {f: 444, pos: [0, vy(4), -240], yaw: 0},
  {f: 498, pos: [0, vy(4), -240], yaw: 0},
  {f: 534, pos: [0, vy(5), -300], yaw: 0},
  {f: 588, pos: [0, vy(5), -300], yaw: 0},
  {f: 624, pos: [0, vy(6), -360], yaw: 0},
  {f: 678, pos: [0, vy(6), -360], yaw: 0},
  {f: 714, pos: [0, vy(7), -420], yaw: 0},
  {f: 768, pos: [0, vy(7), -420], yaw: 0},
  {f: 804, pos: [0, vy(8), -480], yaw: 0},
  {f: 900, pos: [0, vy(8), -560], yaw: 0},
];

const vl = (i: number, o: Omit<Layer, 'pos' | 'ry' | 'scale'>): Layer => ({
  ...o,
  pos: [0, vy(i), VZ - i * 60],
  ry: 0,
  scale: VS,
});

const vertLayers: Layer[] = [
  vl(0, {key: 'v0', in: 6, out: 96, eyebrow: 'RAM STUDIO', head: '람스튜디오 · 파주', size: 118}),
  vl(1, {key: 'v1', in: 96, out: 234, head: '한 팀이면 됩니다', size: 130, accent: true}),
  vl(2, {
    key: 'v2',
    in: 240,
    out: 324,
    count: {from: 0, to: 150, s: 244, e: 312, suffix: '평'},
    size: 200,
    sub: '단독건물 무주 호리존',
    subSize: 54,
  }),
  vl(3, {
    key: 'v3',
    in: 330,
    out: 414,
    count: {from: 0, to: 1700, s: 334, e: 402, suffix: '석'},
    size: 200,
    sub: '대형 무대 현장까지',
    subSize: 54,
  }),
  vl(4, {key: 'v4', in: 420, out: 504, head: '장비 64종 110점', size: 108, sub: '카메라 5대 · 무빙 40대', subSize: 54}),
  vl(5, {key: 'v5', in: 510, out: 594, eng: 'STUDIO', size: 130}),
  vl(6, {key: 'v6', in: 600, out: 684, eng: 'VIDEO PRODUCTION', size: 88}),
  vl(7, {key: 'v7', in: 690, out: 774, eng: 'STAGE SYSTEM', size: 110}),
  vl(8, {
    key: 'v8',
    in: 780,
    eyebrow: 'CATCH YOUR HIGHEST MOMENT',
    head: '람스튜디오',
    size: 128,
    sub: '010-3400-9279 · ramstudio.kr',
    subSize: 50,
  }),
];

export const KineticVertical: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 14], [0, 1], clamp);
  const fadeOut = interpolate(frame, [KT_VERT_FRAMES - 18, KT_VERT_FRAMES], [1, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: fadeIn * fadeOut}}>
        <Stage layers={vertLayers} keys={vertKeys} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
