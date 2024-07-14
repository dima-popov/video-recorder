import React, { useState, useRef, useEffect } from "react";
import { xcss, Box } from "@atlaskit/primitives";
import Button from "@atlaskit/button/new";
import CameraTakePictureIcon from "@atlaskit/icon/glyph/camera-take-picture";
import VidPauseIcon from "@atlaskit/icon/glyph/vid-pause";
import EditorTextColorIcon from "@atlaskit/icon/glyph/editor/text-color";
import styled from "styled-components";
import { IconButton } from "@atlaskit/button/new";
import VidPlayIcon from "@atlaskit/icon/glyph/vid-play";
import TrashIcon from "@atlaskit/icon/glyph/trash";
import { token } from "@atlaskit/tokens";

const StartButtonWrapper = styled.div`
  position: absolute;
  inset: 50% 0 0 50%;
  width: 200px;
  height: 60px;
  margin-left: -100px;
  margin-top: -30px;
  text-align: center;
  button {
    background-color: #fff;
  }
`;

const StopButtonWrapper = styled.div`
  position: absolute;
  inset: 100% 0 0 50%;
  width: 200px;
  height: 60px;
  margin-left: -100px;
  margin-top: -60px;
  display: flex;
  gap: ${token("space.200")};
  button {
    background-color: #fff;
  }
`;

const VideoRecorder = ({
  setVideoURL,
}: {
  setVideoURL: (arg: string) => void;
}) => {
  const [recordingState, setRecordingState] = useState("init");
  const [videoDuration, setVideoDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timer = useRef<number>(0);

  async function startStream() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 654, height: 432 },
      audio: true,
    });
    if (videoRef.current) {
      videoRef.current.removeEventListener("ended", videoOnEnd);
      // videoRef.current.removeEventListener("timeupdate", videoOnUpdate);
      videoRef.current.addEventListener("ended", videoOnEnd);
      // videoRef.current.addEventListener("timeupdate", videoOnUpdate);
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "video/webm",
    });

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstart = () => {
      timer.current = setInterval(() => {
        setVideoDuration((val) => val + 1);
      }, 1000);
    };
    mediaRecorderRef.current.onresume = () => {
      timer.current = setInterval(() => {
        setVideoDuration((val) => val + 1);
      }, 1000);
    };
    mediaRecorderRef.current.onpause = () => {
      clearInterval(timer.current);
    };

    mediaRecorderRef.current.onstop = () => {
      clearInterval(timer.current);
    };

    mediaRecorderRef.current.start(1000);
  }

  const startRecording = async () => {
    chunksRef.current = [];

    await startStream();

    setRecordingState("started");
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }

        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
      }
      mediaRecorderRef.current.stop();
      chunksRef.current = [];

      setRecordingState("stopped");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.pause();
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setRecordingState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.resume();
      if (videoRef.current) {
        videoRef.current.play();
      }
      setRecordingState("started");
    }
  };

  function cleanRecording() {
    setVideoDuration(0);
    setRecordingState("init");
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();

      setVideoURL("");
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();

        videoRef.current.src = "";
      }
      chunksRef.current = [];
    }
  }

  const playRecording = () => {
    if (videoRef.current) {
      videoRef.current.play();

      setRecordingState("playing");
    }
  };

  function videoOnEnd() {
    setRecordingState("stopped");
  }

  // function videoOnUpdate() {
  //   if (videoRef.current) {
  //     setVideoDuration(videoRef.current.currentTime);
  //   }
  // }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Number((seconds % 60).toFixed(0));
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  }

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <Box>
      <Box xcss={xcss({ position: "relative" })}>
        <video
          // controls
          ref={videoRef}
          // autoPlay
          muted
          style={{
            backgroundColor: "#FFF4F3",
            width: "654px",
            height: "432px",
          }}
        ></video>
        <VideoControls
          recordingState={recordingState}
          videoDuration={formatTime(videoDuration)}
          recording={{
            pause: pauseRecording,
            resume: resumeRecording,
            start: startRecording,
            stop: stopRecording,
            play: videoRef.current ? playRecording : () => {},
            pausePlaying: () => {
              if (videoRef.current) {
                videoRef.current.pause();
                setRecordingState("stopped");
              }
            },
            clean: cleanRecording,
          }}
        />
      </Box>
    </Box>
  );
};

export default VideoRecorder;

function VideoControls({
  recordingState,
  videoDuration,
  recording,
}: {
  recordingState: string;
  videoDuration: string;
  recording: { [key: string]: () => void };
}) {
  switch (recordingState) {
    case "init":
      return (
        <StartButtonWrapper>
          <Button iconBefore={CameraTakePictureIcon} onClick={recording.start}>
            Start Recording
          </Button>
        </StartButtonWrapper>
      );
    case "stopped":
      return (
        <StopButtonWrapper>
          <IconButton
            icon={TrashIcon}
            label="Delete"
            onClick={recording.clean}
          />
          <IconButton
            icon={VidPlayIcon}
            label="Play"
            onClick={recording.play}
          />
          <Box
            xcss={xcss({
              backgroundColor: "elevation.surface",
              borderRadius: "border.radius.100",
              padding: "space.050",
              height: "32px",
              color: "color.text.subtle",
              fontFamily: "SF Pro",
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: "16px",
              width: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            {videoDuration}
          </Box>
        </StopButtonWrapper>
      );
    case "started":
      return (
        <StopButtonWrapper>
          <IconButton
            icon={EditorTextColorIcon}
            label="Stop"
            onClick={recording.stop}
          />
          <IconButton
            icon={VidPauseIcon}
            label="Pause"
            onClick={recording.pause}
          />
          <Box
            xcss={xcss({
              backgroundColor: "elevation.surface",
              borderRadius: "border.radius.100",
              padding: "space.050",
              height: "32px",
              color: "color.text.subtle",
              fontFamily: "SF Pro",
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: "16px",
              width: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            {videoDuration}
          </Box>
        </StopButtonWrapper>
      );
    case "paused":
      return (
        <StopButtonWrapper>
          <IconButton
            icon={EditorTextColorIcon}
            label="Stop"
            onClick={recording.stop}
          />
          <IconButton
            icon={CameraTakePictureIcon}
            label="Start"
            onClick={recording.resume}
          />
          <Box
            xcss={xcss({
              backgroundColor: "elevation.surface",
              borderRadius: "border.radius.100",
              padding: "space.050",
              height: "32px",
              color: "color.text.subtle",
              fontFamily: "SF Pro",
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: "16px",
              width: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            {videoDuration}
          </Box>
        </StopButtonWrapper>
      );
    case "playing":
      return (
        <StopButtonWrapper>
          <IconButton
            icon={TrashIcon}
            label="Delete"
            onClick={recording.clean}
          />
          <IconButton
            icon={VidPauseIcon}
            label="Pause"
            onClick={recording.pausePlaying}
          />
          <Box
            xcss={xcss({
              backgroundColor: "elevation.surface",
              borderRadius: "border.radius.100",
              padding: "space.050",
              height: "32px",
              color: "color.text.subtle",
              fontFamily: "SF Pro",
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: "16px",
              width: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            {videoDuration}
          </Box>
        </StopButtonWrapper>
      );
    default:
      return <></>;
  }
}
