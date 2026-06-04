export interface TelemetryData {
  time: string;
  speed: number; // km/s
  density: number; // cm^-3
  temperature: number; // K
  bz: number; // nT
  bt: number; // nT
  xrayShort: number; // Watts/m^2 (0.05-0.4 nm)
  xrayLong: number; // Watts/m^2 (0.1-0.8 nm)
  kp?: number; // Planetary Kp Index (0 to 9)
}

export interface SpaceWeatherScale {
  level: number; // 0 to 5
  scale: "G" | "S" | "R"; // Geomagnetic, Solar Radiation, Radio Blackout
  label: string; // e.g. "G3 - Strong"
  description: string;
  active: boolean;
  valueText: string; // physical value
  impacts: string[];
}

export interface SpaceAlert {
  id: string;
  timestamp: string;
  type: string; // "flare" | "cme" | "storm" | "proton"
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  scaleLevel?: string; // e.g., "G3", "R2"
  instrument?: string; // e.g. "GOES-16", "ACE", "DSCOVR"
}

export interface ScienceConcept {
  id: string;
  title: string;
  category: "basics" | "instruments" | "impacts";
  summary: string;
  illustrationType: "sun" | "magnetosphere" | "flare" | "aurora";
  content: string;
  keyTerms: string[];
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}
