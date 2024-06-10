import {useEffect, useState} from 'react'
import './App.css'
import OpenAI from 'openai';
import {getObjectStore} from "./objectStore.ts";
import {Recording, RecordingData} from "./types";
import {DetectFrequency} from "./detectFrequency.tsx";

const openai = new OpenAI({
    apiKey: localStorage.getItem("OPENAI_API_KEY") || "",
    dangerouslyAllowBrowser: true
});

function App() {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const [recordingState, setRecordingState] = useState<RecordingState>("inactive");
    const [online, setOnline] = useState<boolean>(navigator.onLine);

    const [recordings, setRecordings] = useState<Recording[]>([]);

    window.addEventListener("online", () => {
        setOnline(true);
    });

    window.addEventListener("offline", () => {
        setOnline(false);
    });

    useEffect(() => {
        recordings.forEach(r => {
            if (r.transcription === "") {
                transcribe(r.label);
            }
        })
    }, [online]);

    const transcribe = async (clipName: string, blob?: Blob) => {
        if (!blob) {
            getObjectStore().then(os =>
                os.get(clipName).onsuccess = function () {
                    const r = this.result as RecordingData;
                    transcribe(clipName, r.audio);
                }
            );
            return;
        }

        const result = await openai.audio.transcriptions.create({
            file: new File([blob], "audio.ogg"),
            model: "whisper-1",
        });

        getObjectStore().then(os =>
            os.put({
                transcription: result.text,
                audio: blob
            }, clipName)
        );

        setRecordings(p => [
            ...p.filter(x => x.label !== clipName),
            {
                ...p.find(x => x.label === clipName)!,
                transcription: result.text
            }
        ]);
    }

    useEffect(() => {
        getObjectStore().then(os => {
            const query = os.openCursor();
            query.onsuccess = function () {
                const r = this.result;
                if (r) {
                    setRecordings(p => [...p, {
                        url: window.URL.createObjectURL((r.value as RecordingData).audio),
                        label: String(r.key),
                        transcription: (r.value as RecordingData).transcription
                    }]);
                    r.continue();
                }
            };
        });
    }, []);

    const startRecording = () => {
        if (!mediaRecorder) {
            navigator.mediaDevices
                .getUserMedia({audio: true})
                .then((stream) => {
                        const recorder = new MediaRecorder(stream);
                        setStream(stream);

                        let chunks: Blob[] = [];
                        recorder.ondataavailable = (e) => {
                            chunks.push(e.data);
                        };

                        recorder.onstop = () => {
                            console.log("recorder stopped");

                            const clipName = new Date().toString();
                            const blob = new Blob(chunks, {type: "audio/ogg; codecs=opus"});
                            chunks = [];

                            getObjectStore().then(os => {
                                os.put({
                                    transcription: "",
                                    audio: blob
                                }, clipName);

                                if (openai.apiKey && navigator.onLine) {
                                    transcribe(clipName, blob);
                                }

                                os.get(clipName).onsuccess = function () {
                                    const r = this.result as RecordingData;

                                    setRecordings(p => [...p, {
                                        url: window.URL.createObjectURL(r.audio),
                                        label: clipName,
                                        transcription: r.transcription,
                                    }]);
                                };
                            });

                            stream.getTracks().forEach(t => t.stop());
                            setMediaRecorder(null);
                            setStream(null);
                        };

                        recorder.start();
                        setRecordingState(recorder.state);

                        setMediaRecorder(recorder);
                    }
                );
        }
    }

    const stopRecording = () => {
        if (!mediaRecorder) return;
        mediaRecorder.stop();
        setRecordingState(mediaRecorder.state);
    }

    const pauseResumeRecording = () => {
        if (!mediaRecorder) return;

        if (recordingState === "paused") {
            mediaRecorder.resume();
            setRecordingState(mediaRecorder.state);
        } else {
            mediaRecorder.pause();
            setRecordingState(mediaRecorder.state);
        }
    }

    const deleteRecording = (key: string) => {
        getObjectStore().then(os => os.delete(key));
        setRecordings(p => p.filter(x => x.label !== key));
    }

    return (
        <>
            {mediaRecorder ? <div>
                <button onClick={stopRecording}>Stop</button>
                <button onClick={pauseResumeRecording}>
                    {recordingState === "paused" ? "Resume" : "Pause"}
                </button>
            </div> : <div>
                <button onClick={startRecording}>Record</button>
            </div>}

            {stream ? <DetectFrequency stream={stream!}/> : <></>}

            <div>
                <br/>
                {recordings
                    .sort((a, b) => b.label.localeCompare(a.label))
                    .map((r, ix) => (
                        <div key={r.label}>
                            {r.label}
                            <br/>
                            <audio key={ix} controls src={r.url}/>
                            <br/>
                            {
                                r.transcription === "" ?
                                    <button onClick={() => transcribe(r.label)}>Transcribe</button>
                                    : r.transcription
                            }
                            <br/>
                            <button onClick={() => deleteRecording(r.label)}>Delete</button>
                            <hr/>
                        </div>
                    ))}
            </div>
        </>
    )
}

export default App
