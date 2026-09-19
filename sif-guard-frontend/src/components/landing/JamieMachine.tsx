import React from 'react';

interface JamieMachineProps {
  theme: 'dark' | 'light';
}

export const JamieMachine: React.FC<JamieMachineProps> = ({ theme }) => {
  const isLight = theme === 'light';

  const t = {
    border: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(244, 245, 247, 0.08)',
    borderStrong: isLight ? 'rgba(0, 0, 0, 0.16)' : 'rgba(244, 245, 247, 0.16)',
    paper0: isLight ? '#151311' : '#F4F5F7',
    paper1: isLight ? '#4A433B' : '#C5C8D0',
    paper2: isLight ? '#8A7E72' : '#6E747D',
    ink0: isLight ? '#F5F2EB' : '#0B0C0E',
    ink1: isLight ? '#ECE7DE' : '#121316',
  };

  const samplePayloads = [
    {
      num: '01',
      title: 'raw observation narrative',
      tag: 'input record · wellhead christmas tree z-01',
      content: `LOCATION: Wellhead #14, Duliajan Extraction Battery
ACTIVITY: High-Pressure Flange Gasket Replacement
NARRATIVE:
"During pump gland packing overhaul on line WH-14B, mechanical technician
observed uncalibrated pressure gauge reading fluctuating between 420-580 PSI.
Breaker tagged out at MCC-2, but padlock omitted from lockout hasp.
Contractor helper working directly underneath unbolted manifold spool
without secondary positive mechanical isolation or whip-check installed."`,
    },
    {
      num: '02',
      title: 'nlp extracted entities & acronyms',
      tag: 'domain normalization · schema representation',
      content: `{
  "facility": "OIL INDIA DULIAJAN COMPLEX",
  "zone_id": "wellhead-area",
  "zone_code": "Z-01",
  "acronyms_resolved": {
    "WH-14B": "Wellhead 14-B Manifold Header",
    "PSI": "Pounds per Square Inch (High Pressure Fluid)",
    "MCC-2": "Motor Control Center 2",
    "LOTO": "Lockout / Tagout Physical Isolation",
    "PTW": "Permit to Work (Cold/Hot Work Permit)"
  },
  "extracted_hazards": [
    "UNCONTROLLED_HIGH_PRESSURE_RELEASE",
    "OMITTED_PHYSICAL_LOCKOUT",
    "LINE_OF_FIRE_EXPOSURE",
    "ABSENT_WHIPCHECK_RESTRAINT"
  ],
  "energy_categories": [
    "HYDRAULIC_PRESSURE",
    "KINETIC_STORED_ENERGY"
  ]
}`,
    },
    {
      num: '03',
      title: 'calibrated prediction & barrier action',
      tag: 'dual-stage inference · life-saving rule match',
      content: `{
  "classification": {
    "sif_potential": "CRITICAL",
    "sif_confidence": 0.942,
    "severity_tier": "TIER_1_PRECURSOR",
    "probability_escalation": 0.887
  },
  "life_saving_rule": {
    "rule_number": "01",
    "rule_name": "ENERGY ISOLATION & LOTO VERIFICATION",
    "compliance_status": "COMPROMISED"
  },
  "compromised_barriers": [
    "POSITIVE_LOCKOUT_HASP_PADLOCK",
    "WHIPCHECK_MECHANICAL_RESTRAINT"
  ],
  "proactive_dispatches": [
    "Immediate verification of MCC-2 physical padlock",
    "Enforce line-of-fire exclusion zone at Wellhead Z-01",
    "Ultrasonic wall thickness test on spool joint WH-14B"
  ]
}`,
    },
  ];

  return (
    <section
      id="the-machine"
      style={{
        position: 'relative',
        borderBottom: `1px solid ${t.border}`,
        paddingTop: 'clamp(64px, 10vh, 110px)',
        paddingBottom: 'clamp(64px, 10vh, 110px)',
        scrollMarginTop: '80px',
      }}
    >
      {/* Chapter Marker Node */}
      <span
        aria-hidden="true"
        className="trace-node"
        style={{
          position: 'absolute',
          left: '-36px',
          top: '40px',
          width: '9px',
          height: '9px',
          border: `1px solid ${t.borderStrong}`,
          backgroundColor: t.ink1,
        }}
      />

      {/* Chapter Label Header Matching Jamie McKaye */}
      <div
        data-wreveal="true"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <p
          className="label-mono"
          style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: t.paper2,
            margin: 0,
          }}
        >
          the machine lens — what the system reads
        </p>
        <p
          className="label-mono"
          style={{
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: t.paper2,
            margin: 0,
          }}
        >
          same observation · three real representations · nothing mocked
        </p>
      </div>

      {/* Statement */}
      <h2
        data-wreveal="true"
        style={{
          fontSize: 'clamp(1.9rem, 3.6vw, 3.0rem)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.14,
          color: t.paper0,
          maxWidth: '30ch',
          margin: '0 0 20px 0',
        }}
      >
        From field observation to structured precursor verdict.
      </h2>

      <p
        data-wreveal="true"
        style={{
          fontSize: 'clamp(15px, 1.2vw, 17px)',
          lineHeight: 1.6,
          color: t.paper1,
          maxWidth: '56ch',
          margin: '0 0 44px 0',
        }}
      >
        Inspect the actual internal representations generated by the NLP pipeline for an operational
        safety observation.
      </p>

      {/* Accordion Details Panels Matching Jamie McKaye */}
      <div
        data-wreveal="true"
        style={{
          border: `1px solid ${t.border}`,
          backgroundColor: t.ink0,
        }}
      >
        {samplePayloads.map((payload, idx) => (
          <details
            key={payload.num}
            open={idx === 0}
            style={{
              borderBottom: idx < samplePayloads.length - 1 ? `1px solid ${t.border}` : 'none',
            }}
          >
            <summary
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '16px',
                padding: '20px 24px',
                cursor: 'pointer',
                listStyle: 'none',
                userSelect: 'none',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = t.ink1;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#FF7300',
                  fontWeight: 600,
                }}
              >
                {payload.num}
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: t.paper0,
                }}
              >
                {payload.title}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.10em',
                  color: t.paper2,
                  marginLeft: 'auto',
                  display: 'none',
                }}
                className="md-show-details-tag"
              >
                {payload.tag}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  color: t.paper2,
                  marginLeft: '12px',
                }}
              >
                ↓
              </span>
            </summary>

            <div
              style={{
                borderTop: `1px solid ${t.border}`,
                padding: '20px 24px',
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.35)',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: t.paper1,
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                }}
              >
                {payload.content}
              </pre>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};
