import style from './style.module.scss';
import {Recording} from "../../types";
import {useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown, faChevronUp, faSpinner, faTrash} from "@fortawesome/free-solid-svg-icons";

export function Clip({recording, deleteRecording}: { recording: Recording, deleteRecording: (r: string) => void }) {
    const [showing, setShowing] = useState<boolean>(false);

    return <div className={style['clip-card']} key={recording.label}>
        <div className={style['heading']}>
            <h3>
                {recording.label}
            </h3>
            <button onClick={() => deleteRecording(recording.label)}>
                <FontAwesomeIcon icon={faTrash} size={"sm"}/>
            </button>
        </div>
        <div className={style['transcript']}>
            {
                recording.transcriptionStatus === "done" ?
                    <>
                        <button className="link"
                                onClick={() => setShowing(s => !s)}>
                            {showing ? 'Hide' : 'Show'} transcript
                            <FontAwesomeIcon style={{paddingLeft: ".2rem"}} icon={showing ? faChevronUp : faChevronDown}
                                             size={"sm"}/>
                        </button>
                        <p hidden={!showing}>
                            {recording.transcription}
                        </p>
                    </> :
                    <>
                        {recording.transcriptionStatus === "in-progress" ?
                            <div>
                                <FontAwesomeIcon icon={faSpinner} size={"sm"} spin style={{paddingRight: ".2rem"}}/>
                                Transcription in progress...
                            </div> :
                            <div>
                                Transcription unavailable while offline.
                            </div>
                    }
                    </>
            }
        </div>
        <audio key={recording.url} controls src={recording.url}/>
    </div>;
}