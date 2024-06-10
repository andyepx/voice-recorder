import {useEffect, useRef, useState} from "react";

// Inspired by https://aerik.github.io/NoteDetector.htm
// interesting:  http://www.phy.mtu.edu/~suits/Physicsofmusic.html
// Human voice:
const notes: { n: string, h: number, power?: number }[] = [
    // {n: 'C0', h: 16.35},
    // {n: 'C#0/Db0', h: 17.32},
    // {n: 'D0', h: 18.35},
    // {n: 'D#0/Eb0', h: 19.45},
    // {n: 'E0', h: 20.6},
    // {n: 'F0', h: 21.83},
    // {n: 'F#0/Gb0', h: 23.12},
    // {n: 'G0', h: 24.5},
    // {n: 'G#0/Ab0', h: 25.96},
    // {n: 'A0', h: 27.5},
    // {n: 'A#0/Bb0', h: 29.14},
    // {n: 'B0', h: 30.87},
    // {n: 'C1', h: 32.7},
    // {n: 'C#1/Db1', h: 34.65},
    // {n: 'D1', h: 36.71},
    // {n: 'D#1/Eb1', h: 38.89},
    // {n: 'E1', h: 41.2},
    // {n: 'F1', h: 43.65},
    // {n: 'F#1/Gb1', h: 46.25},
    {n: 'G1', h: 49},
    {n: 'G#1/Ab1', h: 51.91},
    {n: 'A1', h: 55},
    {n: 'A#1/Bb1', h: 58.27},
    {n: 'B1', h: 61.74},
    {n: 'C2', h: 65.41},
    {n: 'C#2/Db2', h: 69.3},
    {n: 'D2', h: 73.42},
    {n: 'D#2/Eb2', h: 77.78},
    {n: 'E2', h: 82.41},
    {n: 'F2', h: 87.31},
    {n: 'F#2/Gb2', h: 92.5},
    {n: 'G2', h: 98},
    {n: 'G#2/Ab2', h: 103.83},
    {n: 'A2', h: 110},
    {n: 'A#2/Bb2', h: 116.54},
    {n: 'B2', h: 123.47},
    {n: 'C3', h: 130.81},
    {n: 'C#3/Db3', h: 138.59},
    {n: 'D3', h: 146.83},
    {n: 'D#3/Eb3', h: 155.56},
    {n: 'E3', h: 164.81},
    {n: 'F3', h: 174.61},
    {n: 'F#3/Gb3', h: 185},
    {n: 'G3', h: 196},
    {n: 'G#3/Ab3', h: 207.65},
    {n: 'A3', h: 220},
    {n: 'A#3/Bb3', h: 233.08},
    {n: 'B3', h: 246.94},
    {n: 'C4', h: 261.63},
    {n: 'C#4/Db4', h: 277.18},
    {n: 'D4', h: 293.66},
    {n: 'D#4/Eb4', h: 311.13},
    {n: 'E4', h: 329.63},
    {n: 'F4', h: 349.23},
    {n: 'F#4/Gb4', h: 369.99},
    {n: 'G4', h: 392},
    {n: 'G#4/Ab4', h: 415.3},
    {n: 'A4', h: 440},
    {n: 'A#4/Bb4', h: 466.16},
    {n: 'B4', h: 493.88},
    {n: 'C5', h: 523.25},
    {n: 'C#5/Db5', h: 554.37},
    {n: 'D5', h: 587.33},
    {n: 'D#5/Eb5', h: 622.25},
    {n: 'E5', h: 659.25},
    {n: 'F5', h: 698.46},
    {n: 'F#5/Gb5', h: 739.99},
    {n: 'G5', h: 783.99},
    {n: 'G#5/Ab5', h: 830.61},
    {n: 'A5', h: 880},
    // {n: 'A#5/Bb5', h: 932.33},
    // {n: 'B5', h: 987.77},
    // {n: 'C6', h: 1046.5},
    // {n: 'C#6/Db6', h: 1108.73},
    // {n: 'D6', h: 1174.66},
    // {n: 'D#6/Eb6', h: 1244.51},
    // {n: 'E6', h: 1318.51},
    // {n: 'F6', h: 1396.91},
    // {n: 'F#6/Gb6', h: 1479.98},
    // {n: 'G6', h: 1567.98},
    // {n: 'G#6/Ab6', h: 1661.22},
    // {n: 'A6', h: 1760},
    // {n: 'A#6/Bb6', h: 1864.66},
    // {n: 'B6', h: 1975.53},
    // {n: 'C7', h: 2093},
    // {n: 'C#7/Db7', h: 2217.46},
    // {n: 'D7', h: 2349.32},
    // {n: 'D#7/Eb7', h: 2489.02},
    // {n: 'E7', h: 2637.02},
    // {n: 'F7', h: 2793.83},
    // {n: 'F#7/Gb7', h: 2959.96},
    // {n: 'G7', h: 3135.96},
    // {n: 'G#7/Ab7', h: 3322.44},
    // {n: 'A7', h: 3520},
    // {n: 'A#7/Bb7', h: 3729.31},
    // {n: 'B7', h: 3951.07},
    // {n: 'C8', h: 4186.01},
    // {n: 'C#8/Db8', h: 4434.92},
    // {n: 'D8', h: 4698.63},
    // {n: 'D#8/Eb8', h: 4978.03},
    // {n: 'E8', h: 5274.04},
    // {n: 'F8', h: 5587.65},
    // {n: 'F#8/Gb8', h: 5919.91},
    // {n: 'G8', h: 6271.93},
    // {n: 'G#8/Ab8', h: 6644.88},
    // {n: 'A8', h: 7040},
    // {n: 'A#8/Bb8', h: 7458.62},
    // {n: 'B8', h: 7902.13}
];

export function FrequencyChart({mediaRecorder}: { mediaRecorder: MediaRecorder | null }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [intervalId, setIntervalId] = useState<number | null>(null);

    let analyser: AnalyserNode | null = null;
    let hertzBinSize = 1;
    let frequencyData = new Uint8Array(1);

    useEffect(() => {
        if (mediaRecorder) {
            clearCanvas();

            const audioCtx = new AudioContext();
            analyser = audioCtx.createAnalyser();
            analyser.smoothingTimeConstant = 0.2; //default is 0.8, less is more responsive
            analyser.minDecibels = -95; //-100 is default and is more sensitive (more noise)
            analyser.fftSize = 8192 * 4; //need at least 8192 to detect differences in low notes
            const sampleRate = audioCtx.sampleRate;
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            hertzBinSize = sampleRate / analyser.fftSize;
            frequencyData = new Uint8Array(analyser.frequencyBinCount);

            const micSource = audioCtx.createMediaStreamSource(mediaRecorder.stream);
            micSource.connect(gainNode);
            micSource.connect(analyser);

            setIntervalId(setInterval(getTones, 50) as unknown as number);
        } else {
            if (intervalId) {
                clearInterval(intervalId);
            }
            clearCanvas();
        }
    }, [mediaRecorder]);


    function getTones() {
        if (!analyser) {
            clearCanvas();
            return;
        }

        const buflen = frequencyData.length;
        analyser.getByteFrequencyData(frequencyData);
        let count = 0;
        let total = 0;
        let sum = 0;
        const cutoff = 20;//redundant with decibels?
        let nPtr = 0; //notePointer
        for (let i = 0; i < buflen; i++) {
            const fdat = frequencyData[i];
            const freq = i * hertzBinSize;//freq in hertz for this sample
            const curNote = notes[nPtr];
            const nextNote = notes[nPtr + 1];
            //cut off halfway into the next note
            const hzLimit = curNote.h + ((nextNote.h - curNote.h) / 2);
            if (freq < hzLimit) {
                if (fdat > cutoff) {
                    sum += i;//bin numbers
                    count++;
                    total += fdat;
                }
            } else {
                if (count > 0) {
                    const binNum = sum / count;
                    //round up
                    let power = frequencyData[Math.ceil(binNum)];
                    if (binNum > 0) {
                        //round down
                        power = (power + frequencyData[Math.floor(binNum)]) / 2;
                    }
                    //notes[nPtr].power = power;
                    //seems like it rounds the values too much?
                    notes[nPtr].power = total / count;
                    sum = 0;
                    count = 0;
                    total = 0;
                } else {
                    notes[nPtr].power = 0;
                }
                //next note
                if (nPtr < notes.length - 2) {
                    nPtr++;
                }
            }
        }

        drawNotes();
    }

    function drawNotes() {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current!.getContext("2d")!;
        canvasRef.current!.height = 300;
        canvasRef.current!.width = 1000;

        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        const scaleX = canvasRef.current!.width / (notes[notes.length - 1].h - notes[0].h);

        ctx.strokeStyle = "#4058F2";
        ctx.beginPath();
        ctx.moveTo(notes[0].h * scaleX, canvasRef.current!.height / 2);
        notes.forEach((n, i) => {
            if (i > 0) {
                ctx.lineTo(n.h * scaleX, (canvasRef.current!.height / 2 - (n.power || 0) * 0.5));
            }
        });
        ctx.stroke();

        ctx.strokeStyle = "rgba(64,88,242,.3)";
        ctx.beginPath();
        ctx.moveTo(notes[0].h * scaleX, canvasRef.current!.height / 2);
        notes.forEach((n, i) => {
            if (i > 0) {
                ctx.lineTo(n.h * scaleX, (canvasRef.current!.height / 2 + (n.power || 0) * 0.5));
            }
        });
        ctx.stroke();

        ctx.strokeStyle = "rgb(233,81,209)";
        ctx.beginPath();
        ctx.moveTo(notes[0].h * scaleX, canvasRef.current!.height / 2);
        notes.forEach((n, i) => {
            if (i > 0) {
                ctx.lineTo(n.h * scaleX - 8, (canvasRef.current!.height / 2 - (n.power || 0) * 0.5));
            }
        });
        ctx.stroke();

        ctx.strokeStyle = "rgba(233,81,209,.3)";
        ctx.beginPath();
        ctx.moveTo(notes[0].h * scaleX, canvasRef.current!.height / 2);
        notes.forEach((n, i) => {
            if (i > 0) {
                ctx.lineTo(n.h * scaleX - 8, (canvasRef.current!.height / 2 + (n.power || 0) * 0.5));
            }
        });
        ctx.stroke();

        ctx.strokeStyle = "rgb(116,196,248)";
        ctx.beginPath();
        ctx.moveTo(notes[0].h * scaleX, canvasRef.current!.height / 2);
        notes.forEach((n, i) => {
            if (i > 0) {
                ctx.lineTo(n.h * scaleX + 8, (canvasRef.current!.height / 2 - (n.power || 0) * 0.5));
            }
        });
        ctx.stroke();

        ctx.strokeStyle = "rgba(116,196,248,.3)";
        ctx.beginPath();
        ctx.moveTo(notes[0].h * scaleX, canvasRef.current!.height / 2);
        notes.forEach((n, i) => {
            if (i > 0) {
                ctx.lineTo(n.h * scaleX + 8, (canvasRef.current!.height / 2 + (n.power || 0) * 0.5));
            }
        });
        ctx.stroke();
    }

    function clearCanvas() {
        const ctx = canvasRef.current!.getContext("2d")!;
        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }

    return <>
        <canvas ref={canvasRef}></canvas>
    </>;
}