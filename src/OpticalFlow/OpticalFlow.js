import React, { useEffect, useRef, useState } from "react";
import styles from "../App.module.css";
import { GPU } from "gpu.js/dist/gpu-browser.min";
import getDirectionalColor from "./getDirectionalColor";

export default function (props) {
  const {
    videoRef,
    flowRef,
    width,
    height,
    quality,
    maxFlow,
    minFlow,
    transparency,
    monochrome,
    histogram,
  } = props;
  const qualityRef = useRef();
  const maxFlowRef = useRef();
  const minFlowRef = useRef();
  const transparencyRef = useRef();
  const monochromeRef = useRef();
  const histogramRef = useRef();
  const lastPixels = useRef();
  const zonesRef = useRef();

  const [zonesLength, setZonesLength] = useState();

  useEffect(() => {
    qualityRef.current = quality;
    maxFlowRef.current = maxFlow;
    minFlowRef.current = minFlow;
    transparencyRef.current = transparency;
    monochromeRef.current = monochrome;
    histogramRef.current = histogram;

    function zonesGenerator(width, height, quality) {
      let zones = [];
      for (let y = 0; y < height; y += quality) {
        for (let x = 0; x < width; x += quality) {
          const array = new Float32Array(4);
          array[0] = x;
          array[1] = y;
          array[2] = 1;
          array[3] = 1;
          zones.push(array);
        }
      }
      return zones;
    }

    zonesRef.current = zonesGenerator(width, height, qualityRef.current);

    setZonesLength(zonesRef.current.length);

    const videoElement = videoRef.current;
    videoElement.width = width;
    videoElement.height = height;
    const flowCanvas = flowRef.current;
    flowCanvas.width = width;
    flowCanvas.height = height;
    const flowContext = flowCanvas.getContext("2d");

    const gpu = new GPU({});

    const render = () => {
      if (!videoElement.paused) {
        flowContext.drawImage(
          videoElement,
          0,
          0,
          videoElement.videoWidth,
          videoElement.videoHeight,
          0,
          0,
          flowCanvas.width,
          flowCanvas.height
        );
        const image = flowContext.getImageData(
          0,
          0,
          flowCanvas.width,
          flowCanvas.height
        );
        const pixels = image.data;

        if (lastPixels.current && pixels) {
          const kernel = gpu
            .createKernel(
              `function (lastPixels, pixels, zones, quality, width) {
              const x = zones[this.thread.x][0];
              const y = zones[this.thread.x][1];
              let A2 = 0;
              let A1B2 = 0;
              let B1 = 0;
              let C1 = 0;
              let C2 = 0;
              let u = 0;
              let v = 0;
              for (let localY = -quality; localY <= quality; localY++) {
                for (let localX = -quality; localX <= quality; localX++) {
                  const address = (y + localY) * width + x + localX;
                  const gradX =
                    pixels[(address - 1) * 4] - pixels[(address + 1) * 4];
                  const gradY =
                    pixels[(address - width) * 4] -
                    pixels[(address + width) * 4];
                  const gradT = lastPixels[address * 4] - pixels[address * 4];
                  A2 += gradX * gradX;
                  A1B2 += gradX * gradY;
                  B1 += gradY * gradY;
                  C2 += gradX * gradT;
                  C1 += gradY * gradT;
                }
              }
              const delta = A1B2 * A1B2 - A2 * B1;
              if (delta !== 0) {
                /* system is not singular - solving by Kramer method */
                const iDelta = quality / delta;
                const deltaX = -(C1 * A1B2 - C2 * B1);
                const deltaY = -(A1B2 * C2 - A2 * C1);
                u = deltaX * iDelta;
                v = deltaY * iDelta;
              } else {
                /* singular system - find optical flow in gradient direction */
                const norm =
                  (A1B2 + A2) * (A1B2 + A2) + (B1 + A1B2) * (B1 + A1B2);
                if (norm !== 0) {
                  const iGradNorm = quality / norm;
                  const temp = -(C1 + C2) * iGradNorm;
                  u = (A1B2 + A2) * temp;
                  v = (B1 + A1B2) * temp;
                }
              }
              if (-quality > u && u > quality && -quality > v && v > quality) {
                u = 10;
                v = 10;
              }
              return [x, y, u, v];
            }`
            )
            .setOutput([zonesRef.current.length])
            .setTactic("balanced");

          const flow = kernel(
            lastPixels.current,
            pixels,
            zonesRef.current,
            qualityRef.current,
            flowCanvas.width
          );

          flowContext.beginPath();
          flowContext.rect(0, 0, flowCanvas.width, flowCanvas.height);
          flowContext.fillStyle = `rgba(0, 0, 0, ${transparencyRef.current})`;
          flowContext.fill();

          let scalers = Array(width).fill(0);

          for (let i = 0; i < flow.length; i++) {
            const zone = flow[i];
            const x = zone[0];
            const y = zone[1];
            const u = zone[2];
            const v = zone[3];
            const scaler = Math.sqrt(u * u + v * v);

            if (scaler < maxFlowRef.current && scaler > minFlowRef.current) {
              if (monochromeRef.current) {
                flowContext.strokeStyle = "#FF6347";
              } else {
                flowContext.strokeStyle = getDirectionalColor(u, v);
              }
              flowContext.beginPath();
              flowContext.moveTo(x, y);
              flowContext.lineTo(x - u, y + v);
              flowContext.stroke();
            }

            if (histogramRef.current) {
              const index = +parseInt(
                (flowCanvas.width / (maxFlowRef.current - minFlowRef.current)) *
                  scaler -
                  flowCanvas.width / (maxFlowRef.current - minFlowRef.current)
              );
              scalers[index] = scalers[index] + 1;
              flowContext.strokeStyle = "#FF6347";
              flowContext.beginPath();
              flowContext.moveTo(index, flowCanvas.height);
              flowContext.lineTo(index, flowCanvas.height - scalers[index]);
              flowContext.stroke();
            }
          }
          gpu.destroy();
          kernel.destroy();
        }
        lastPixels.current = pixels;
      }
      requestAnimationFrame(render);
    };
    videoElement.addEventListener("loadeddata", () => {
      requestAnimationFrame(render);
    });
    return () => {
      videoElement.removeEventListener("loadeddata", () => {
        cancelAnimationFrame(render);
      });
    };
  }, [
    videoRef,
    flowRef,
    width,
    height,
    quality,
    maxFlow,
    minFlow,
    transparency,
    monochrome,
    histogram,
  ]);
  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <video
          ref={videoRef}
          id="video"
          src={process.env.PUBLIC_URL + "test.mp4"}
          type="video/mp4"
          autoPlay
          loop
          muted
          playsInline
          controls
        ></video>
      </div>
      <div className="container">
        <canvas ref={flowRef} id="scene"></canvas>
      </div>
      <div>Flow Points {zonesLength}</div>
    </div>
  );
}
