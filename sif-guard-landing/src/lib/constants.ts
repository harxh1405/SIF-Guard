export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "#hero" },
  { label: "Platform", href: "#pipeline" },
  { label: "Features", href: "#capabilities" },
  { label: "Impact", href: "#analytics" },
  { label: "About", href: "#about" },
];

export const HERO_STATS = [
  { value: "2,482", label: "Reports Analyzed", change: "+14.2% MoM" },
  { value: "186", label: "High SIF Potential", change: "Requires Action", alert: true },
  { value: "12", label: "Active Risk Clusters", change: "4 Systemic" },
  { value: "8", label: "Operational Sites", change: "Active Monitoring" },
];

export const TELEMETRY_CALLOUTS = [
  {
    id: "pressure-isolation",
    title: "Pressure Isolation",
    rate: "↑ 38%",
    details: "14 reports • 5 locations",
    severity: "critical",
    position: { top: "14%", left: "42%" },
  },
  {
    id: "hot-work",
    title: "Hot Work",
    rate: "↑ 21%",
    details: "8 reports • 3 locations",
    severity: "warning",
    position: { top: "24%", right: "28%" },
  },
  {
    id: "vehicle-interaction",
    title: "Vehicle Interaction",
    rate: "↑ 17%",
    details: "6 reports • 4 locations",
    severity: "warning",
    position: { bottom: "34%", right: "8%" },
  },
];

export const OPERATIONAL_SITES = [
  { name: "Assam", count: "1,420 reports", status: "Active High", active: true },
  { name: "Arunachal Pradesh", count: "384 reports", status: "Active", active: true },
  { name: "Nagaland", count: "192 reports", status: "Active", active: true },
  { name: "Mizoram", count: "145 reports", status: "Active", active: true },
  { name: "Tripura", count: "180 reports", status: "Active", active: true },
  { name: "Rajasthan", count: "161 reports", status: "Active", active: true },
];

export const DATA_STREAMS = [
  {
    title: "MULTI-SOURCE INGESTION",
    desc: "Reports · Near-misses · Observations (PDF, Text, Images, APIs)",
    icon: "FileText",
  },
  {
    title: "NLP ATTRIBUTE EXTRACTION",
    desc: "10 safety dimensions from unstructured text",
    icon: "Cpu",
  },
  {
    title: "EXPLAINABLE AI",
    desc: "Rules + XGBoost Transparent predictions",
    icon: "ShieldAlert",
  },
  {
    title: "PATTERN DISCOVERY",
    desc: "HDBSCAN clustering Recurring precursor patterns",
    icon: "GitBranch",
  },
  {
    title: "PROACTIVE INSIGHTS",
    desc: "Trends · Hotspots · Early warnings",
    icon: "TrendingUp",
  },
];

export const CAPABILITIES = [
  {
    id: "multi-source",
    icon: "Layers",
    title: "Multi-Source Ingestion",
    description: "Ingest incident reports, near-misses and observations from multiple sources, physical logs, and legacy enterprise databases.",
  },
  {
    id: "nlp-extract",
    icon: "Target",
    title: "10-Dimension Extraction",
    description: "Extract key safety parameters using advanced NLP, identifying energy sources, barriers, and potential severity.",
  },
  {
    id: "explainable-sif",
    icon: "ShieldCheck",
    title: "Explainable SIF Classifier",
    description: "Domain rules + ML for accurate and explainable risk prediction, removing the black-box hesitation of safety officers.",
  },
  {
    id: "iogp-lsr",
    icon: "Link2",
    title: "IOGP Life-Saving Rules",
    description: "Map reports to all 9 canonical Life-Saving Rules using semantic AI to eliminate blind spots across field operations.",
  },
  {
    id: "precursor-cluster",
    icon: "Share2",
    title: "Precursor Clustering",
    description: "Find recurring patterns with HDBSCAN to identify systemic risk before minor incidents escalate into tragic events.",
  },
  {
    id: "trend-hotspot",
    icon: "BarChart3",
    title: "Trend & Hotspot Analytics",
    description: "Visualize risk density across sites, activities and equipment with predictive trajectory indicators.",
  },
];

export const RISK_TREND_DATA = [
  { month: "Jan", value: 65, highRisk: 42 },
  { month: "Feb", value: 85, highRisk: 58 },
  { month: "Mar", value: 186, highRisk: 186, peak: true },
  { month: "Apr", value: 112, highRisk: 74 },
  { month: "May", value: 138, highRisk: 89 },
  { month: "Jun", value: 154, highRisk: 98 },
];

export const TOP_RISK_CATEGORIES = [
  { label: "Pressure Isolation", percentage: 38, color: "from-[#FF6B35] to-[#FF3B00]" },
  { label: "Hot Work", percentage: 21, color: "from-[#FF8A35] to-[#FF5500]" },
  { label: "Vehicle Interaction", percentage: 17, color: "from-[#FFA043] to-[#FF6B35]" },
  { label: "Working at Height", percentage: 12, color: "from-[#FFB566] to-[#FF8A35]" },
  { label: "Confined Space", percentage: 8, color: "from-[#FFC988] to-[#FFA043]" },
];

export const PIPELINE_STEPS = [
  {
    step: "01",
    name: "Ingest",
    headline: "Unstructured Multi-Format Ingestion",
    subtitle: "Reports, images, documents",
    description:
      "Automated intake engine accepts unstructured PDF logs, scanned PTW (Permit-to-Work) forms, OCR images, and live mobile field safety reports from drilling and production sites.",
    badge: "Input Stream",
    stats: "2,400+ Reports/Day",
    tags: ["PDF Documents", "OCR Scans", "Field Mobile App", "SCADA Triggers"],
  },
  {
    step: "02",
    name: "Extract",
    headline: "10-Dimension Semantic Attribute Extraction",
    subtitle: "NLP + OCR 10 safety dimensions",
    description:
      "Fine-tuned NLP models parse complex oilfield terminology to extract 10 critical parameters: Activity, Hazard, Energy Source, Bypassed Barrier, Equipment, Human Factor, and Exposure.",
    badge: "NLP Engine",
    stats: "96.4% Extraction F1",
    tags: ["Energy Source", "Bypassed Barrier", "Equipment Tag", "Exposure Duration"],
  },
  {
    step: "03",
    name: "Understand",
    headline: "Explainable SIF Classification & IOGP Mapping",
    subtitle: "Classify SIF potential (XGBoost + rules)",
    description:
      "Weak supervision combines 16 industry safety rules with an XGBoost classifier and BGE semantic embeddings to calculate rigorous, explainable SIF-potential probability scores.",
    badge: "Explainable AI",
    stats: "0.94 Precision on SIF",
    tags: ["IOGP 9 Rules", "16 Domain Rules", "Weak Supervision", "SHAP Explanations"],
  },
  {
    step: "04",
    name: "Discover",
    headline: "Unsupervised HDBSCAN Precursor Clustering",
    subtitle: "Pattern clustering (HDBSCAN)",
    description:
      "Dense high-dimensional vector spaces are analyzed using HDBSCAN to discover recurring precursor clusters that span multiple drilling rigs, revealing systemic organizational hazards.",
    badge: "Cluster Intelligence",
    stats: "12 Active Risk Clusters",
    tags: ["HDBSCAN", "Dense Embeddings", "Precursor Fingerprint", "Cross-Rig Trends"],
  },
  {
    step: "05",
    name: "Visualize",
    headline: "Spatial-Temporal Hotspots & Actionable Intelligence",
    subtitle: "Insights, hotspots & trends",
    description:
      "Safety leaders receive real-time GIS geospatial risk heatmaps, predictive early-warning notifications, and targeted intervention recommendations before severe injuries occur.",
    badge: "Command Center",
    stats: "< 3s Alert Latency",
    tags: ["GIS Heatmaps", "Risk Velocity", "Automated Alerts", "Audit Verification"],
  },
];
