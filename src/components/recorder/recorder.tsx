import style from './style.module.scss';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {FrequencyChart} from "../frequencyChart/frequencyChart.tsx";
import {useEffect, useState} from "react";
import {getObjectStore} from "../../utils/objectStore.ts";
import {faCircle, faMicrophone, faPause, faStop} from "@fortawesome/free-solid-svg-icons";

export function Recorder({recordingSaved}: { recordingSaved: (clipName: string, audio: Blob) => void }) {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const [recordingState, setRecordingState] = useState<RecordingState>("inactive");

    const [recordingTime, setRecordingTime] = useState<number>(0);

    const startRecording = () => {
        if (recordingState !== "inactive") return;

        if (!mediaRecorder) {
            navigator.mediaDevices
                .getUserMedia({audio: true})
                .then((stream) => {
                        const recorder = new MediaRecorder(stream);

                        let chunks: Blob[] = [];
                        recorder.ondataavailable = (e) => {
                            chunks.push(e.data);
                        };

                        recorder.onstop = () => {
                            const date = new Date();
                            const clipName = date.toDateString() + " " + date.toLocaleTimeString();
                            const blob = new Blob(chunks, {type: "audio/ogg; codecs=opus"});
                            chunks = [];

                            getObjectStore().then(os => {
                                os.put({
                                    transcription: "",
                                    audio: blob
                                }, clipName);

                                os.get(clipName).onsuccess = function () {
                                    recordingSaved(clipName, blob);
                                };
                            });

                            stream.getTracks().forEach(t => t.stop());
                            setMediaRecorder(null);
                        };

                        recorder.start();
                        setRecordingState(recorder.state);
                        setRecordingTime(1);

                        setMediaRecorder(recorder);
                    }
                );
        }
    }

    useEffect(() => {
        if (recordingTime > 0 && recordingState === "recording") {
            setTimeout(() => setRecordingTime(recordingTime + 1), 1000);
        }
    }, [recordingTime, recordingState]);

    const stopRecording = () => {
        if (!mediaRecorder) return;
        mediaRecorder.stop();
        setRecordingState(mediaRecorder.state);
        setRecordingTime(0);
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

    return <div className={style['recorder']}>
        <button className={style['small']} onClick={pauseResumeRecording}
                hidden={mediaRecorder === null}>
            <FontAwesomeIcon icon={recordingState === "recording" ? faPause : faCircle} size={"sm"}/>
        </button>
        <button>
            {
                recordingState === "recording" || recordingState === "paused" ?
                    <span>
                        {(recordingTime / 60).toFixed(0).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>
                    : <FontAwesomeIcon icon={faMicrophone} size={"xl"} onClick={startRecording}/>
            }
        </button>
        <button className={style['small']}
                hidden={mediaRecorder === null}>
            <FontAwesomeIcon icon={faStop} size={"sm"} onClick={stopRecording}/>
        </button>

        <FrequencyChart mediaRecorder={mediaRecorder}/>
    </div>;
}