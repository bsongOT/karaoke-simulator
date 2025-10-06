import PitchFinder from "pitchfinder";
import { PitchDetector } from "pitchy";

const C2 = 65;
const C8 = 4186;
self.onmessage = (e:MessageEvent<{ frameSize:number, sampleRate:number, audioBuffer: ArrayBuffer, start:number }>) => {
    const { frameSize, sampleRate, audioBuffer, start } = e.data;
    const detectPitch = PitchFinder.YIN({ sampleRate });
    const detectPitchACF2PLUS = PitchFinder.ACF2PLUS({ sampleRate });
    const detectPitchDynamic = PitchFinder.DynamicWavelet({ sampleRate });
    const pitchDetector = PitchDetector.forFloat32Array(frameSize);
    const pitchFrames = [] as {freq:number|null}[];
    const arr = new Float32Array(audioBuffer);

    for (let i = 0; i < arr.length; i += frameSize){
        const frame = arr.slice(i, i + frameSize);
        if (frame.length === frameSize) {
            const [pitch1, clarity] = pitchDetector.findPitch(frame, sampleRate);
            if (pitch1 <= C8 && pitch1 >= C2 && clarity >= 0.85){
                pitchFrames.push({freq: pitch1});
                continue;
            }
        }
        const pitch2 = detectPitch(frame);
        if (pitch2 !== null && pitch2 >= C2 && pitch2 <= C8){
            pitchFrames.push({freq: pitch2});
            continue;
        }
        const pitch3 = detectPitchDynamic(frame);
        if (pitch3 !== null && pitch3 >= C2 && pitch3 <= C8){
            pitchFrames.push({freq: pitch3});
            continue;
        }
        const pitch4 = detectPitchACF2PLUS(frame);
        if (pitch4 !== null && pitch4 >= C2 && pitch4 <= C8){
            pitchFrames.push({freq: pitch4});
            continue;
        }
        pitchFrames.push({freq: null});
    }
    self.postMessage({ frames: pitchFrames, start: start });
}