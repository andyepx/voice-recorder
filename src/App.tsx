import {useEffect, useState} from 'react'
import style from './app.module.scss'

import OpenAI from 'openai';
import {getObjectStore} from "./utils/objectStore.ts";
import {Recording, RecordingData} from "./types";
import {Clip} from "./components/clip/clip.tsx";
import {Recorder} from "./components/recorder/recorder.tsx";

const openai = new OpenAI({
    apiKey: localStorage.getItem("OPENAI_API_KEY") || "",
    dangerouslyAllowBrowser: true
});

function App() {
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
        if (!online) return;

        if (!blob) {
            getObjectStore().then(os =>
                os.get(clipName).onsuccess = function () {
                    const r = this.result as RecordingData;
                    transcribe(clipName, r.audio);
                }
            );
            return;
        }

        setRecordings(p => [
            ...p.filter(x => x.label !== clipName),
            {
                ...p.find(x => x.label === clipName)!,
                transcriptionStatus: "in-progress"
            }
        ]);

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
                transcription: result.text,
                transcriptionStatus: "done"
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
                        transcription: (r.value as RecordingData).transcription,
                        transcriptionStatus: (r.value as RecordingData).transcription !== "" ? "done" : "unavailable"
                    }]);
                    r.continue();
                }
            };
        });
    }, []);

    const deleteRecording = (key: string) => {
        getObjectStore().then(os => os.delete(key));
        setRecordings(p => p.filter(x => x.label !== key));
    }

    return (
        <>
            <Recorder recordingSaved={(clipName: string, audio: Blob) => {
                setRecordings(p => [...p, {
                    url: window.URL.createObjectURL(audio),
                    label: clipName,
                    transcription: "",
                    transcriptionStatus: online ? "in-progress" : "unavailable"
                }]);

                transcribe(clipName, audio);
            }}/>


            <div className={style['clips']}>
                {recordings
                    .sort((a, b) => b.label.localeCompare(a.label))
                    .map((r, ix) => (
                        <Clip key={r.label} recording={r} deleteRecording={deleteRecording}/>
                    ))}
            </div>
        </>
    )
}

export default App
