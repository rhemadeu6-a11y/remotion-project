import {Composition} from 'remotion';
import {MyVideo} from './MyVideo';
import {SketchVideo, SKETCH_FPS, SKETCH_DURATION_FRAMES} from './SketchVideo';

export const Root: React.FC = () => {
  return (
    <>
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
