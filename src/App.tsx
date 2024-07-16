import { useState } from "react";
import "./App.css";
import AppProvider from "@atlaskit/app-provider";
import VideoRecorder from "./VideoRecorder";
import reactLogo from "./assets/react.svg";

function App() {
  const [url, setUrl] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);

  return (
    <AppProvider>
      <a href="https://react.dev" target="_blank">
        <img src={reactLogo} className="logo react" alt="React logo" />
      </a>{" "}
      <VideoRecorder setVideoURL={setUrl} setVideoBlob={setBlob} />
      {url.length > 0 ? (
        <a href={url} download>
          Download
        </a>
      ) : (
        ""
      )}
    </AppProvider>
  );
}

export default App;
