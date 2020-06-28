import React from "react";

export default function (props) {
  const {
    quality,
    maxFlow,
    minFlow,
    transparency,
    monochrome,
    histogram,
    handleQuality,
    handleMaxFlow,
    handleMinFlow,
    handleTransparency,
    handleMonochrome,
    handleHistogram,
  } = props;
  return (
    <div>
      <div>
        Flow Grid Size
        <input
          type="range"
          min={2}
          max={100}
          value={quality}
          onChange={handleQuality}
        ></input>
        {quality}
      </div>
      <div>
        Max Flow
        <input
          type="range"
          min={10}
          max={2000}
          value={maxFlow}
          onChange={handleMaxFlow}
        ></input>
        {maxFlow}
      </div>
      <div>
        Min Flow
        <input
          type="range"
          min={1}
          max={100}
          value={minFlow}
          onChange={handleMinFlow}
        ></input>
        {minFlow}
      </div>
      <div>
        Transparency
        <input
          type="range"
          min={0}
          max={100}
          value={transparency * 100}
          onChange={handleTransparency}
        ></input>
        {transparency}
      </div>
      <div>
        <div>
          <button onClick={handleMonochrome}>
            {monochrome ? "Multicolor" : "Monochrome"}
          </button>
        </div>
        <div>
          <button onClick={handleHistogram}>
            {histogram ? "No Histogram" : "Histogram"}
          </button>
        </div>
      </div>
    </div>
  );
}
