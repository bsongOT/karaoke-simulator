"use client"

let audioContext = null as AudioContext | null;
let osc = null as OscillatorNode | null;
let gain = null as GainNode | null;

export const context = {
    melodyVolume: 0.5
}

export function getAudioContext(){
    if (audioContext) return audioContext;
    audioContext = new AudioContext();
    return audioContext;
}
export function getOSC(){
    if (osc) return osc;
    osc = getAudioContext().createOscillator();
    return osc;
}
export function getGain(){
    if (gain) return gain;
    gain = getAudioContext().createGain();
    return gain;
}