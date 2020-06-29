import React, { useRef, useState } from "react";
import styles from "./App.module.css";
import useGetViewport from "./useGetViewport";
import OpticalFlow from "./OpticalFlow/OpticalFlow";
import Legend from "./OpticalFlow/Legend";
import Controls from "./Controls/Controls";

function App() {
  const [quality, setQuality] = useState(10);
  const [maxFlow, setMaxFlow] = useState(100);
  const [minFlow, setMinFlow] = useState(0);
  const [transparency, setTransparency] = useState(1);
  const [monochrome, setMonochrome] = useState(false);
  const [histogram, setHistogram] = useState(true);
  const videoRef = useRef();
  const flowRef = useRef();
  const { width } = useGetViewport();

  const handleQuality = (event) => {
    setQuality(+event.target.value);
  };

  const handleMaxFlow = (event) => {
    setMaxFlow(+event.target.value);
  };

  const handleMinFlow = (event) => {
    setMinFlow(+event.target.value);
  };

  const handleTransparency = (event) => {
    setTransparency(+(event.target.value / 100));
  };

  const handleMonochrome = () => {
    setMonochrome(!monochrome);
  };
  const handleHistogram = () => {
    setHistogram(!histogram);
  };
  return (
    <div className={styles.app}>
      <OpticalFlow
        videoRef={videoRef}
        flowRef={flowRef}
        width={width > 640 ? 640 : +parseInt(width)}
        height={width > 640 ? 480 : +parseInt(width * 0.75)}
        quality={quality}
        maxFlow={maxFlow}
        minFlow={minFlow}
        transparency={transparency}
        monochrome={monochrome}
        histogram={histogram}
      />
      <Legend />
      <Controls
        quality={quality}
        maxFlow={maxFlow}
        minFlow={minFlow}
        transparency={transparency}
        monochrome={monochrome}
        histogram={histogram}
        handleQuality={handleQuality}
        handleMaxFlow={handleMaxFlow}
        handleMinFlow={handleMinFlow}
        handleTransparency={handleTransparency}
        handleMonochrome={handleMonochrome}
        handleHistogram={handleHistogram}
      />
    </div>
  );
}

export default App;
