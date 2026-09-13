import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const SKETCH_FPS = 30;
export const SKETCH_DURATION_FRAMES = 30 * 60; // 60초

const PHOTO_COUNT = 15;
const TITLE_FRAMES = 75; // 2.5초
const OUTRO_FRAMES = 120; // 4초
const MONTAGE_FRAMES = SKETCH_DURATION_FRAMES - TITLE_FRAMES - OUTRO_FRAMES; // 1605
const PER_PHOTO_FRAMES = Math.floor(MONTAGE_FRAMES / PHOTO_COUNT); // 107
const CROSSFADE_FRAMES = 18;

// 건마다 바꿔 쓰는 자리. CONNECTED HK 는 폐기된 명의라 현행 제작사 이름으로 둔다.
const PROJECT_TITLE = '미래내일 일경험';
const SUBTITLE = 'RAM STUDIO · 2026';
const OUTRO_LINE_1 = 'Thanks for the moments';
const OUTRO_LINE_2 = 'RAM STUDIO · 미래내일 일경험';

const PAPER_BG =
  'radial-gradient(ellipse at 30% 20%, #fefaf1 0%, #f5ecd7 55%, #e9dcbf 100%)';

const SketchNoise: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.15  0 0 0 0 0.10  0 0 0 0 0.05  0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
      mixBlendMode: 'multiply',
      opacity: 0.35,
      pointerEvents: 'none',
    }}
  />
);

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(30,20,10,0.55) 100%)',
      pointerEvents: 'none',
    }}
  />
);

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inScale = spring({frame, fps, config: {damping: 14, stiffness: 90}});
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const subOpacity = interpolate(frame, [25, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subY = interpolate(frame, [25, 55], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outOpacity = interpolate(
    frame,
    [TITLE_FRAMES - 18, TITLE_FRAMES],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill
      style={{
        background: PAPER_BG,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily:
          "'Apple SD Gothic Neo','Pretendard','Noto Sans KR',system-ui,sans-serif",
        opacity: outOpacity,
      }}
    >
      <SketchNoise />
      <div
        style={{
          position: 'relative',
          transform: `scale(${inScale})`,
          opacity: titleOpacity,
          color: '#2b2118',
          fontSize: 180,
          fontWeight: 900,
          letterSpacing: -6,
          textShadow: '0 4px 0 rgba(0,0,0,0.08)',
        }}
      >
        {PROJECT_TITLE}
        <div
          style={{
            position: 'absolute',
            left: -20,
            right: -20,
            bottom: -14,
            height: 12,
            background:
              'linear-gradient(90deg, transparent 0%, #d1a355 12%, #b8843d 50%, #d1a355 88%, transparent 100%)',
            borderRadius: 6,
            transform: 'skewX(-8deg)',
            opacity: 0.85,
          }}
        />
      </div>
      <div
        style={{
          transform: `translateY(${subY}px)`,
          opacity: subOpacity,
          color: '#6a5540',
          fontSize: 48,
          marginTop: 46,
          letterSpacing: 6,
          fontWeight: 500,
        }}
      >
        {SUBTITLE}
      </div>
    </AbsoluteFill>
  );
};

type PhotoProps = {
  index: number;
};

const PhotoScene: React.FC<PhotoProps> = ({index}) => {
  const frame = useCurrentFrame();
  const localDur = PER_PHOTO_FRAMES + CROSSFADE_FRAMES;

  // Crossfade in/out
  const opacityIn = interpolate(frame, [0, CROSSFADE_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacityOut = interpolate(
    frame,
    [localDur - CROSSFADE_FRAMES, localDur],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const opacity = Math.min(opacityIn, opacityOut);

  // Ken Burns: alternate zoom-in / zoom-out and pan direction
  const zoomStart = index % 2 === 0 ? 1.06 : 1.18;
  const zoomEnd = index % 2 === 0 ? 1.18 : 1.06;
  const scale = interpolate(frame, [0, localDur], [zoomStart, zoomEnd]);

  const panDirections = [
    [-30, -18],
    [24, -22],
    [-26, 20],
    [28, 24],
    [0, -28],
  ];
  const [panX0, panY0] = panDirections[index % panDirections.length];
  const tx = interpolate(frame, [0, localDur], [panX0, -panX0]);
  const ty = interpolate(frame, [0, localDur], [panY0, -panY0]);

  const src = staticFile(`photos/${String(index + 1).padStart(2, '0')}.jpg`);

  const caption = `${String(index + 1).padStart(2, '0')} / ${String(
    PHOTO_COUNT,
  ).padStart(2, '0')}`;

  return (
    <AbsoluteFill style={{background: '#141210', opacity}}>
      <AbsoluteFill
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
        }}
      >
        <Img
          src={src}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
      <Vignette />
      {/* sketch corner marks */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 60,
          width: 90,
          height: 90,
          borderTop: '4px solid rgba(255,246,220,0.85)',
          borderLeft: '4px solid rgba(255,246,220,0.85)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 60,
          bottom: 60,
          width: 90,
          height: 90,
          borderBottom: '4px solid rgba(255,246,220,0.85)',
          borderRight: '4px solid rgba(255,246,220,0.85)',
        }}
      />
      {/* frame index caption */}
      <div
        style={{
          position: 'absolute',
          left: 80,
          bottom: 70,
          color: '#fff6dc',
          fontFamily:
            "'Apple SD Gothic Neo','Pretendard','Noto Sans KR',system-ui,sans-serif",
          fontSize: 34,
          letterSpacing: 8,
          fontWeight: 600,
          textShadow: '0 2px 6px rgba(0,0,0,0.6)',
        }}
      >
        {caption}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 80,
          top: 70,
          color: 'rgba(255,246,220,0.75)',
          fontFamily:
            "'Apple SD Gothic Neo','Pretendard','Noto Sans KR',system-ui,sans-serif",
          fontSize: 26,
          letterSpacing: 4,
          textShadow: '0 2px 6px rgba(0,0,0,0.6)',
        }}
      >
        MIRAE·NAEIL · 일경험
      </div>
    </AbsoluteFill>
  );
};

const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacityIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const outroOut = interpolate(frame, [OUTRO_FRAMES - 30, OUTRO_FRAMES], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line2Y = interpolate(frame, [30, 65], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        background: PAPER_BG,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily:
          "'Apple SD Gothic Neo','Pretendard','Noto Sans KR',system-ui,sans-serif",
        opacity: Math.min(opacityIn, outroOut),
      }}
    >
      <SketchNoise />
      <div
        style={{
          color: '#3a2c1e',
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: -3,
        }}
      >
        {OUTRO_LINE_1}
      </div>
      <div
        style={{
          transform: `translateY(${line2Y}px)`,
          marginTop: 32,
          color: '#7a6448',
          fontSize: 42,
          letterSpacing: 6,
          fontWeight: 500,
        }}
      >
        {OUTRO_LINE_2}
      </div>
    </AbsoluteFill>
  );
};

export const SketchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#0e0b08'}}>
      <Sequence durationInFrames={TITLE_FRAMES}>
        <TitleCard />
      </Sequence>

      {Array.from({length: PHOTO_COUNT}).map((_, i) => {
        const from = TITLE_FRAMES + i * PER_PHOTO_FRAMES - (i === 0 ? 0 : CROSSFADE_FRAMES);
        return (
          <Sequence
            key={i}
            from={from}
            durationInFrames={PER_PHOTO_FRAMES + CROSSFADE_FRAMES}
          >
            <PhotoScene index={i} />
          </Sequence>
        );
      })}

      <Sequence
        from={SKETCH_DURATION_FRAMES - OUTRO_FRAMES}
        durationInFrames={OUTRO_FRAMES}
      >
        <OutroCard />
      </Sequence>
    </AbsoluteFill>
  );
};
