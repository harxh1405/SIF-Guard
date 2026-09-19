import React, { useState } from 'react';

interface JamieReaderPrismProps {
  theme?: 'dark' | 'light';
  onExploreFacility?: () => void;
}

export const JamieReaderPrism: React.FC<JamieReaderPrismProps> = ({
  theme: _theme,
  onExploreFacility: _onExploreFacility,
}) => {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 12, y: x * 14 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Dynamic stack transform based on active sheet + mouse tilt
  const getStackTransform = () => {
    if (activeTab === 0) {
      return `rotateX(${12 + tilt.x}deg) rotateY(${-19 + tilt.y}deg) rotateZ(-7deg)`;
    } else if (activeTab === 1) {
      return `rotateX(${3 + tilt.x}deg) rotateY(${-9 + tilt.y}deg) rotateZ(-3deg)`;
    } else {
      return `rotateX(${-4 + tilt.x}deg) rotateY(${10 + tilt.y}deg) rotateZ(4deg)`;
    }
  };

  const getSheetStyle = (sheetIndex: 0 | 1 | 2) => {
    let opacity = 0.46;
    let transform = 'translate3d(20%, -15%, -75px)';
    let borderColor = 'rgba(233, 235, 239, 0.2)';

    if (activeTab === sheetIndex) {
      opacity = 1;
      transform = 'translate3d(-2%, 1%, 65px)';
      borderColor = '#e9ebef';
    } else if (
      (activeTab === 0 && sheetIndex === 1) ||
      (activeTab === 1 && sheetIndex === 2) ||
      (activeTab === 2 && sheetIndex === 0)
    ) {
      opacity = 0.75;
      transform = 'translate3d(9%, -7%, -5px)';
      borderColor = 'rgba(233, 235, 239, 0.45)';
    }

    return { opacity, transform, borderColor };
  };

  return (
    <div className="ReaderPrism-prism" data-reader={activeTab}>
      {/* 3D Stage with Tilt & Orbit */}
      <div
        className="ReaderPrism-stage"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="ReaderPrism-orbit" />

        <div
          className="ReaderPrism-stack"
          style={{ transform: getStackTransform() }}
        >
          {/* SHEET 0: Field Narrative / Human Perspective */}
          <div
            className="ReaderPrism-sheet ReaderPrism-human"
            style={getSheetStyle(0)}
            onClick={() => setActiveTab(0)}
          >
            <div className="ReaderPrism-paperTop">
              <span>sif-guard.ai</span>
              <span>↗</span>
            </div>

            <div className="ReaderPrism-paperHeadline">
              Predict the
              <br />
              incident.
              <br />
              <span>Before it becomes one.</span>
            </div>

            {/* Field Streamlines SVG */}
            <div className="ReaderPrism-paperField">
              <svg viewBox="0 0 360 120" fill="none">
                <path d="M-20 30 C80 140, 200 -70, 380 48" />
                <path d="M-20 36 C80 136, 200 -64, 380 52" />
                <path d="M-20 42 C80 132, 200 -58, 380 56" />
                <path d="M-20 48 C80 128, 200 -52, 380 60" />
                <path d="M-20 54 C80 124, 200 -46, 380 64" />
                <path d="M-20 60 C80 120, 200 -40, 380 68" />
                <path d="M-20 66 C80 116, 200 -34, 380 72" />
                <path d="M-20 72 C80 112, 200 -28, 380 76" />
                <path d="M-20 78 C80 108, 200 -22, 380 80" />
                <path d="M-20 84 C80 104, 200 -16, 380 84" />
                <path d="M-20 90 C80 100, 200 -10, 380 88" />
              </svg>
            </div>

            <div className="ReaderPrism-paperFoot">
              <span>Precursor intelligence · Oil India</span>
              <span>PS-165</span>
            </div>
          </div>

          {/* SHEET 1: Structured Schema / Model Inference */}
          <div
            className="ReaderPrism-sheet ReaderPrism-search"
            style={getSheetStyle(1)}
            onClick={() => setActiveTab(1)}
          >
            <div className="ReaderPrism-codeTop">
              <span>application/ld+json</span>
              <span>{`{ }`}</span>
            </div>
            <pre>{`{
  "@context": "https://oilindia.in/sif",
  "@type": "PrecursorIncident",
  "sif_potential": 0.94,
  "lsr_rule": "Energy Isolation",
  "zone": "Wellhead #14",
  "confidence": "98.7%"
}`}</pre>
            <div className="ReaderPrism-codeFoot">
              Identity, made explicit.
            </div>
          </div>

          {/* SHEET 2: Operational Barrier Action / Automated Dispatch */}
          <div
            className="ReaderPrism-sheet ReaderPrism-agents"
            style={getSheetStyle(2)}
            onClick={() => setActiveTab(2)}
          >
            <div className="ReaderPrism-codeTop">
              <span>sif-guard.ai/barriers.txt</span>
              <span>↗</span>
            </div>
            <pre>{`> Lockout/Tagout verification mandated
> Spatial alert pinned to Twin Zone 01
> Hierarchy of Controls: Isolation Level 4
> Action dispatched in <150ms`}</pre>
            <div className="ReaderPrism-codeFoot">
              An entrance for machines.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
