import PitchFinder from "pitchfinder";
import { PitchDetector } from "pitchy";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";

const C2 = 65;
const C8 = 4186;

const CREPE_FRAME_SIZE = 1024;
const CREPE_SAMPLE_RATE = 16000;
const CENTS_PER_BIN = 20;
const PITCH_MIN_HZ = 32.70;
const CREPE_CONFIDENCE_THRESHOLD = 0.5;

const CREPE_MODEL_URL = "https://marl.github.io/crepe/model/model.json";

let crepeModel: tf.LayersModel | null = null;

async function loadCrepeModel(): Promise<void> {
    try {
        await tf.setBackend("cpu");
        await tf.ready();
        crepeModel = await tf.loadLayersModel(CREPE_MODEL_URL);
        console.log("[CREPE] 모델 로드 완료");
    } catch (e) {
        console.warn("[CREPE] 모델 로드 실패:", e);
        crepeModel = null;
    }
}

function resampleLinear(frame: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate;
    const outLen = Math.round(frame.length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
        const srcIdx = i * ratio;
        const lo = Math.floor(srcIdx);
        const hi = Math.min(lo + 1, frame.length - 1);
        const t = srcIdx - lo;
        out[i] = frame[lo] * (1 - t) + frame[hi] * t;
    }
    return out;
}

function normalizeRMS(frame: Float32Array): Float32Array {
    const rms = Math.sqrt(frame.reduce((s, v) => s + v * v, 0) / frame.length);
    if (rms < 1e-7) return frame;
    const out = new Float32Array(frame.length);
    for (let i = 0; i < frame.length; i++) out[i] = frame[i] / rms;
    return out;
}

function detectWithCrepe(
    frame: Float32Array,
    sampleRate: number
): { freq: number | null; clarity: number } {
    if (!crepeModel) return { freq: null, clarity: 0 };

    // 1. 리샘플링 + 정규화 + 패딩
    const resampled = sampleRate !== CREPE_SAMPLE_RATE
        ? resampleLinear(frame, sampleRate, CREPE_SAMPLE_RATE)
        : frame;
    const input = new Float32Array(CREPE_FRAME_SIZE);
    input.set(resampled.subarray(0, Math.min(resampled.length, CREPE_FRAME_SIZE)));
    const normed = normalizeRMS(input);

    const tensor = tf.tensor2d(normed, [1, CREPE_FRAME_SIZE]);
    let output: tf.Tensor | null = null;
    try {
        output = crepeModel.predict(tensor) as tf.Tensor;
        const probs = output.dataSync() as Float32Array;

        let maxProb = 0;
        let weightedSum = 0;
        let totalWeight = 0;
        for (let i = 0; i < probs.length; i++) {
            if (probs[i] > maxProb) maxProb = probs[i];
            weightedSum += i * probs[i];
            totalWeight += probs[i];
        }

        if (maxProb < CREPE_CONFIDENCE_THRESHOLD) return { freq: null, clarity: maxProb };

        const centsBin = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const freq = PITCH_MIN_HZ * Math.pow(2, (centsBin * CENTS_PER_BIN) / 1200);

        if (freq < C2 || freq > C8) return { freq: null, clarity: maxProb };
        return { freq, clarity: maxProb };
    } finally {
        tensor.dispose();
        output?.dispose();
    }
}

const modelReady: Promise<void> = loadCrepeModel();

self.onmessage = async (e:MessageEvent<{ frameSize:number, sampleRate:number, audioBuffer: ArrayBuffer, start:number }>) => {
    await modelReady;

    const { frameSize, sampleRate, audioBuffer, start } = e.data;
    const detectPitch = PitchFinder.YIN({ sampleRate });
    const detectPitchDynamic = PitchFinder.DynamicWavelet({ sampleRate });
    const pitchDetector = PitchDetector.forFloat32Array(frameSize);
    const pitchFrames = [] as {freq:number|null, clarity:number}[];
    const arr = new Float32Array(audioBuffer);

    for (let i = 0; i < arr.length; i += frameSize){
        const frame = arr.slice(i, i + frameSize);

        if (frame.length === frameSize) {
            const [pitch1, clarity] = pitchDetector.findPitch(frame, sampleRate);
            if (pitch1 <= C8 && pitch1 >= C2 && clarity >= 0.85){
                pitchFrames.push({freq: pitch1, clarity});
                continue;
            }
        }
        // const mlResult = detectWithCrepe(frame, sampleRate);
        // if (mlResult.freq !== null) {
        //     if (mlResult.freq <= C8 && mlResult.freq >= C2 && mlResult.clarity >= 0.7){
        //         pitchFrames.push(mlResult);
        //         continue;
        //     }
        // }
        const pitch2 = detectPitch(frame);
        if (pitch2 !== null && pitch2 >= C2 && pitch2 <= C8){
            pitchFrames.push({freq: pitch2, clarity: 0.7});
            continue;
        }
        const pitch3 = detectPitchDynamic(frame);
        if (pitch3 !== null && pitch3 >= C2 && pitch3 <= C8){
            pitchFrames.push({freq: pitch3, clarity: 0.2});
            continue;
        }
        pitchFrames.push({freq: null, clarity: 0});
    }
    self.postMessage({ frames: pitchFrames, start: start });
}