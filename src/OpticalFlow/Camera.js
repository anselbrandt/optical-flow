import React, { useRef, useEffect } from "react";

export default function Camera(props) {
  const { width, height } = props;
  const videoRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      });
  }, []);
  return (
    <React.Fragment>
      <video
        ref={videoRef}
        style={{ transform: "scale(-1,1" }}
        width={width}
        height={height}
      ></video>
    </React.Fragment>
  );
}
