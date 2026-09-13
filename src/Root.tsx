import {Composition} from 'remotion';
import {MyVideo} from './MyVideo';
import {SketchVideo, SKETCH_FPS, SKETCH_DURATION_FRAMES} from './SketchVideo';
import {KineticMain, KineticVertical, KT_FPS, KT_MAIN_FRAMES, KT_VERT_FRAMES} from './KineticTypo';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="KineticMain"
        component={KineticMain}
        durationInFrames={KT_MAIN_FRAMES}
        fps={KT_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="KineticVertical"
        component={KineticVertical}
        durationInFrames={KT_VERT_FRAMES}
        fps={KT_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Sketch"
        component={SketchVideo}
        durationInFrames={SKETCH_DURATION_FRAMES}
        fps={SKETCH_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{title: 'Hello, Remotion!'}}
      />
    </>
  );
};
