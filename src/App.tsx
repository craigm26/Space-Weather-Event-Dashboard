import React, { useState, useEffect } from "react";
import { TelemetryData, SpaceWeatherScale, SpaceAlert } from "./types";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import ScaleIndicator from "./components/ScaleIndicator";
import TelemetryCharts from "./components/TelemetryCharts";
import SolarDiskVisualizer from "./components/SolarDiskVisualizer";
import EventsFeed from "./components/EventsFeed";
import ScienceDesk from "./components/ScienceDesk";
import EventComparator from "./components/EventComparator";
import {
  Activity,
  Globe,
  Bell,
  Sunrise,
  Cpu,
  RefreshCw,
  Clock,
  Compass,
  AlertOctagon,
  BookOpen,
} from "lucide-react";

function MicroSparkline({
  data,
  dataKey,
  stroke,
}: {
  data: any[];
  dataKey: string;
  stroke: string;
}) {
  if (!data || data.length === 0) {
    return <div className="h-9 w-full" />;
  }
  return (
    <div className="h-9 w-full mt-2 overflow-hidden select-none pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function App() {
  const [sandboxMode, setSandboxMode] = useState<boolean>(true); // Default to Storm Sandbox for maximum educational impact!
  const [useLocalTime, setUseLocalTime] = useState<boolean>(false); // Switches UTC to device local time
  const [dualViewMode, setDualViewMode] = useState<boolean>(false); // Enables side-by-side split screen
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);
  const [alerts, setAlerts] = useState<SpaceAlert[]>([]);
  const [donkiEvents, setDonkiEvents] = useState<any[]>([]);
  const [telemetrySource, setTelemetrySource] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTimeUTC, setCurrentTimeUTC] = useState<string>("");

  // Timeline scrubber and playback states
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // UTC or Local clock stream
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      if (useLocalTime) {
        const localTimeStr = now.toLocaleTimeString("en-US", { hour12: false });
        const tzName = now.toLocaleTimeString("en-US", { timeStyle: "short" }).split(" ")[2] || "Local";
        setCurrentTimeUTC(`${localTimeStr} ${tzName}`);
      } else {
        setCurrentTimeUTC(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [useLocalTime]);

  // Primary data-fetching queue
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams = `?sandbox=${sandboxMode ? "true" : "false"}`;
        
        // Fetch Telemetry & Live alerts in parallel
        const [telemetryRes, alertsRes, donkiRes] = await Promise.all([
          fetch(`/api/space-weather/telemetry${queryParams}`),
          fetch(`/api/space-weather/alerts${queryParams}`),
          fetch("/api/space-weather/donki-events")
        ]);

        const teleData = await telemetryRes.json();
        const alertData = await alertsRes.json();
        const donkiData = await donkiRes.json();

        setTelemetry(teleData.data || []);
        setTelemetrySource(teleData.source || "");
        setAlerts(alertData.alerts || []);
        setDonkiEvents(donkiData.events || []);
      } catch (err) {
        console.error("Failed to query space weather telemetry feeds:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Auto refresh telemetry feeds every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [sandboxMode]);

  // Reset timeline scrubber on dataset change
  useEffect(() => {
    setSelectedIdx(null);
    setIsPlaying(false);
  }, [sandboxMode, telemetry.length]);

  // Handle timeline animation playback incremental steps
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedIdx((prev) => {
        const len = telemetry.length;
        if (len === 0) return null;
        const curr = prev !== null ? prev : len - 1;
        if (curr >= len - 1) {
          setIsPlaying(false);
          return len - 1;
        }
        return curr + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying, telemetry.length]);

  // Extract current telemetry (selected index or last element in the telemetry array)
  const currentIdx = telemetry && telemetry.length > 0 
    ? (selectedIdx !== null && selectedIdx >= 0 && selectedIdx < telemetry.length ? selectedIdx : telemetry.length - 1)
    : -1;

  const currentVal = telemetry && telemetry.length > 0 && currentIdx >= 0
    ? telemetry[currentIdx]
    : {
        speed: 380,
        density: 4.2,
        temperature: 80000,
        bz: 1.5,
        bt: 4.0,
        xrayShort: 1.2e-8,
        xrayLong: 5e-8,
      };

  // Historic window of last 10 data points up to the currently selected index
  const last10Points = telemetry && telemetry.length > 0 && currentIdx >= 0
    ? telemetry.slice(Math.max(0, currentIdx - 9), currentIdx + 1)
    : [];

  // Find Indices for key milestones (solar flare peak, proton flux burst, CME shock impact)
  const getMilestoneIndices = () => {
    if (!telemetry || telemetry.length === 0) {
      return { flareIdx: null, protonIdx: null, cmeIdx: null };
    }

    let maxFlux = -1;
    let flareIdx = 0;

    let maxSpeed = -1;
    let cmeIdx = 0;

    let maxDensity = -1;
    let protonIdx = 0;

    telemetry.forEach((item, idx) => {
      if (item.xrayLong > maxFlux) {
        maxFlux = item.xrayLong;
        flareIdx = idx;
      }
      if (item.speed > maxSpeed) {
        maxSpeed = item.speed;
        cmeIdx = idx;
      }
      // Proton rise is the density peak before shockwave arrival on June 4, 17:35 UTC
      const itemTimeMs = new Date(item.time).getTime();
      const impactTimeMs = new Date("2026-06-04T17:35:00Z").getTime();
      if (itemTimeMs < impactTimeMs && item.density > maxDensity) {
        maxDensity = item.density;
        protonIdx = idx;
      }
    });

    return { flareIdx, protonIdx, cmeIdx };
  };

  const { flareIdx, protonIdx, cmeIdx } = getMilestoneIndices();

  // Utility to format timestamp ISO string into text with MM/DD prefix for clarity
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (useLocalTime) {
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const dayPrefix = `${m}/${d}`;
        const tzName = date.toLocaleTimeString("en-US", { timeStyle: "short" }).split(" ")[2] || "Local";
        return (
          dayPrefix + " " +
          date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) + ` ${tzName}`
        );
      } else {
        const m = String(date.getUTCMonth() + 1).padStart(2, "0");
        const d = String(date.getUTCDate()).padStart(2, "0");
        const dayPrefix = `${m}/${d}`;
        return (
          dayPrefix + " " +
          date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
            hour12: false,
          }) + " UTC"
        );
      }
    } catch {
      return isoString;
    }
  };

  // Convert full timestamp into dynamic localized short date label
  const getFormattedDateShort = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (useLocalTime) {
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return `${m}/${d} ${h}:${min}`;
      } else {
        const m = String(date.getUTCMonth() + 1).padStart(2, "0");
        const d = String(date.getUTCDate()).padStart(2, "0");
        const h = String(date.getUTCHours()).padStart(2, "0");
        const min = String(date.getUTCMinutes()).padStart(2, "0");
        return `${m}/${d} ${h}:${min}`;
      }
    } catch {
      return isoString;
    }
  };

  // Dynamic calculations for G, S and R indicators based on current values
  const calculateScores = (): { g: number; s: number; r: number } => {
    let g = 0;
    let s = 0;
    let r = 0;

    // R Scale: X-ray solar flare levels
    const xray = currentVal.xrayLong;
    if (xray >= 1e-4) r = 4; // Severe flare
    else if (xray >= 1e-5) r = 3; // Stormy M Class
    else if (xray >= 1e-6) r = 2; // C Class
    else if (xray >= 1e-7) r = 1; // B Class
    else r = 0;

    // S Scale: Proton Radiation
    const density = currentVal.density;
    if (density >= 40) s = 4; // High plasma injection
    else if (density >= 25) s = 3;
    else if (density >= 12) s = 2;
    else if (density >= 6) s = 1;
    else s = 0;

    // G Scale: Geomagnetic Storm speed & Southward Bz Coupling
    const bz = currentVal.bz;
    const speed = currentVal.speed;
    if (bz <= -20 && speed >= 800) g = 4; // Severe CME compression
    else if (bz <= -12 && speed >= 650) g = 3; // Strong storm
    else if (bz <= -6 && speed >= 500) g = 2; // Moderate storm
    else if (bz <= -2 && speed >= 430) g = 1; // Minor storm
    else g = 0;

    return { g, s, r };
  };

  const { g: gScore, s: sScore, r: rScore } = calculateScores();

  // Map scores back to NOAA Space Weather Scale metrics
  const displayScales: SpaceWeatherScale[] = [
    {
      level: gScore,
      scale: "G",
      label: gScore === 4 ? "G4 - Severe Geomagnetic Storm" :
             gScore === 3 ? "G3 - Strong Conditions" :
             gScore === 2 ? "G2 - Moderate Conditions" :
             gScore === 1 ? "G1 - Minor Conditions" : "G0 - Inverted quiet magnetic field",
      description: "Severe interplanetary shockwaves compress Earth's magnetotail, coupling energy down field lines.",
      active: gScore > 0,
      valueText: `Solar wind speed: ${currentVal.speed} km/s (Bz: ${currentVal.bz} nT)`,
      impacts: gScore >= 4 
        ? ["Widespread voltage controller instabilities registered on sub-stations.", "Induced ground currents monitored in pipeline manifolds.", "Breathtaking auroras visible down to Alabama."]
        : ["Localized fluctuations registered in high-latitude transformers.", "Satellite orbital drag limits require orbital adjustments.", "Auroral bands visible down to Idaho and Maine."]
    },
    {
      level: sScore,
      scale: "S",
      label: sScore === 4 ? "S4 - Severe Proton Star Storm" :
             sScore === 3 ? "S3 - High Particle Levels" :
             sScore === 2 ? "S2 - Moderate Particle Storm" :
             sScore === 1 ? "S1 - Minor Particle Storm" : "S0 - Quiet solar cosmic rays baseline",
      description: "Atmospheric solar energetic particle (SEP) fluxes spike, creating radio blockages.",
      active: sScore > 0,
      valueText: `Solar wind density: ${currentVal.density} particles/cm³`,
      impacts: sScore >= 3
        ? ["Slight radiation health hazard for high-altitude trans-continental flights.", "Solar panel cell efficiency degradations experienced on polar orbits.", "Astronout extra-vehicular activities suspended."]
        : ["No current severe biological radiation hazards logged.", "Primary satellite telemetry streams and orbit computations operating as normal.", "Solar arrays charging nominal baseline levels."]
    },
    {
      level: rScore,
      scale: "R",
      label: rScore === 4 ? "R4 - Severe Radio Blackout" :
             rScore === 3 ? "R3 - Strong Blackout active" :
             rScore === 2 ? "R2 - Moderate Blackout" :
             rScore === 1 ? "R1 - Minor Blackout" : "R0 - No flaring X-ray flux recorded",
      description: "Irradiance peaks trigger ionization in ionosphere, absorbing high-frequency currents.",
      active: rScore > 0,
      valueText: `GOES X-Ray Long Flux: ${currentVal.xrayLong ? currentVal.xrayLong.toExponential(2) : "0"} W/m²`,
      impacts: rScore >= 3
        ? ["Temporary loss of high-frequency (HF) communication on sunlit side.", "Low-frequency navigation signals degraded for multi-hour blocks.", "Shortwave trans-polar distress links attenuated completely."]
        : ["HF amateur radio propagation attenuation logged in quiet regions.", "High-frequency aviation weather channels clear.", "Geostationary GPS orbital calculations remain highly nominal."]
    }
  ];

  // Helper labels for the AI State proxy grounding
  const activeScaleText = {
    gScaleText: gScore > 0 ? `Active index G${gScore} (Severe Magnetic collision)` : "G0 - Quiet State",
    sScaleText: sScore > 0 ? `Active index S${sScore} (Elevated Solar protons)` : "S0 - Quiet State",
    rScaleText: rScore > 0 ? `Active index R${rScore} (Radio Blackout / X-Ray flare)` : "R0 - Quiet State",
  };

  return (
    <div id="main-root" className="min-h-screen bg-[#090A0C] text-[#D1D5DB] font-sans selection:bg-orange-500/20 pb-16">
      
      {/* GLOWING AMBIENT AURORAL BACKGROUND BACKDROP */}
      <div className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden pointer-events-none select-none z-0">
        <div className={`absolute top-[-250px] left-1/2 -translate-x-1/2 w-[700px] sm:w-[940px] h-[350px] sm:h-[450px] rounded-full blur-[160px] opacity-15 transition-all duration-1000 ${
          sandboxMode ? "bg-orange-500/20" : "bg-emerald-500/10"
        }`} />
      </div>

      {/* DASHBOARD CONTAINER INSIDE SECURE WIDTH BOUNDARIES */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        
        {/* TOP BAR / CONTROL CABIN HEADER */}
        <header id="swop-header" className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#1E293B] bg-[#0F172A] px-5 py-3.5 mb-6 rounded shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${sandboxMode ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
              <h1 className="font-mono font-bold text-white tracking-widest uppercase text-sm flex items-center gap-1.5">
                SWOP // <span className="text-orange-400">{sandboxMode ? "STORM PLAYGROUND" : "ONLINE LIVE"}</span>
              </h1>
            </div>
            <div className="h-4 w-px bg-[#1E293B] hidden sm:block"></div>
            <span className="text-[11px] font-mono text-slate-400 uppercase hidden sm:inline">STATION: DSCOVR L1 // ACCURACY: HYPER-GREEN</span>
          </div>

          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 self-stretch md:self-auto font-mono text-xs">
            {/* Clock widget switchable */}
            <button
              onClick={() => setUseLocalTime(!useLocalTime)}
              className="flex items-center gap-2 bg-[#090A0C] border border-[#1E293B] hover:border-[#334155] rounded px-3 py-1 text-slate-400 cursor-pointer transition-all uppercase"
              title="Click to toggle between UTC and Local Device time mode"
            >
              <Clock className={`w-3.5 h-3.5 ${useLocalTime ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span>{useLocalTime ? "DEVICE:" : "UTC:"} {currentTimeUTC || "00:00:00"}</span>
              <span className="text-[8px] bg-[#1E293B] px-1 rounded hover:text-white transition-all">Format Switch</span>
            </button>

            {/* View Mode comparison toggle layout */}
            <div className="flex items-center bg-[#090A0C] border border-[#1E293B] rounded p-0.5">
              <button
                onClick={() => setDualViewMode(false)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono leading-tight rounded transition-all uppercase cursor-pointer ${
                  !dualViewMode
                    ? "bg-slate-800 text-white border border-[#1E293B]"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Single Deck
              </button>
              <button
                onClick={() => setDualViewMode(true)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono leading-tight rounded transition-all uppercase cursor-pointer ${
                  dualViewMode
                    ? "bg-sky-600/25 text-sky-450 border border-sky-500/40 font-bold"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                ⚖️ Compare Events (Dual-View)
              </button>
            </div>

            {/* Sandbox Mode Switch Switcher */}
            <div className="flex items-center bg-[#090A0C] border border-[#1E293B] rounded p-0.5">
              <button
                id="btn-mode-live"
                onClick={() => setSandboxMode(false)}
                className={`flex items-center gap-1 px-3 py-1 text-[10px] font-mono leading-tight rounded transition-all uppercase cursor-pointer ${
                  !sandboxMode
                    ? "bg-slate-800 text-white border border-[#1E293B]"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${!sandboxMode ? "animate-spin" : ""}`} />
                Live Satellites
              </button>
              <button
                id="btn-mode-sandbox"
                onClick={() => setSandboxMode(true)}
                className={`flex items-center gap-1 px-3 py-1 text-[10px] font-mono leading-tight rounded transition-all uppercase cursor-pointer ${
                  sandboxMode
                    ? "bg-orange-600/20 text-orange-400 border border-orange-500/40 animate-pulse"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <AlertOctagon className="w-3 h-3 mr-1" />
                Storm Sandbox
              </button>
            </div>
          </div>
        </header>

        {/* LOADING SCREEN OVERLAY */}
        {loading && telemetry.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 bg-[#0F172A] border border-[#1E293B] rounded p-6">
            <Activity className="w-10 h-10 text-orange-500 animate-spin mb-4" />
            <p className="text-slate-400 text-xs font-mono">Syncing spacecraft telemetry and orbital decoders...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* SANDBOX BANNER ADVISORY (If Sandbox Mode active) */}
            {sandboxMode && (
              <div id="sandbox-banner" className="bg-[#0F172A] border border-[#1E293B] border-l-2 border-orange-500 p-4 rounded flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs">
                <AlertOctagon className="w-6 h-6 text-orange-400 shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1">
                  <h4 className="font-mono font-bold text-orange-400 tracking-wider text-[11px] mb-0.5">HISTORICAL STORM PLAYGROUND ACTIVE: Severe Solar Storm & CME of June 2026</h4>
                  <p className="leading-relaxed text-slate-300 font-sans">
                    The charts, gauges, and alerts represent a severe space weather event. Trace the chronological cascade: Solar Flare peaks at 09:30 UTC → Proton Star Storm spikes → CME Shock Wave impacts the L1 Lagrange satellites at 17:30 UTC, surging wind speeds to 920 km/s and flipping IMF Bz southward to -26 nT.
                  </p>
                </div>
                <button
                  onClick={() => setSandboxMode(false)}
                  className="px-3 py-1.5 bg-orange-600/20 border border-orange-500/45 text-orange-400 text-[10px] font-mono font-bold uppercase rounded cursor-pointer self-start sm:self-center transition-all shrink-0 hover:bg-orange-600/30"
                >
                  Switch to Live
                </button>
              </div>
            )}

            {/* TIMELINE PLAYER CONTROL CENTER CARD */}
            <div id="timeline-scrubber-panel" className="bg-[#0F172A] border border-[#1E293B] rounded p-4 font-mono text-xs shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-orange-600/20 text-orange-400">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-300">
                      Chronological Mission Control Scrubber
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-0.5 uppercase">
                      Selected Time:{" "}
                      <span className="text-orange-400 font-extrabold">
                        {currentVal.time ? new Date(currentVal.time).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                          hour12: false,
                        }) + " UTC" : "Real-time Live Feed"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Timeline Action Buttons */}
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`px-3 py-1.5 font-bold uppercase transition-all rounded border flex items-center gap-1 text-[10px] cursor-pointer ${
                      isPlaying
                        ? "bg-red-600/20 border-red-500/40 text-red-400"
                        : "bg-slate-800 border-[#1E293B] text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <span>{isPlaying ? "⏸️ Pause Sequence" : "▶️ Play Sequence"}</span>
                  </button>

                  {selectedIdx !== null && (
                    <button
                      onClick={() => {
                        setSelectedIdx(null);
                        setIsPlaying(false);
                      }}
                      className="px-2.5 py-1.5 bg-orange-650/25 border border-orange-500/40 text-orange-400 font-black rounded hover:bg-orange-600/30 transition-all text-[9px] uppercase cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Live Lock
                    </button>
                  )}
                </div>
              </div>

              {/* Scrubber Range Input and Labels */}
              <div className="space-y-6 pb-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase shrink-0">
                    {telemetry.length > 0 ? getFormattedDateShort(telemetry[0].time) : "06/03 10:00"}
                  </span>
                  <div className="flex-1 relative flex flex-col justify-center select-none">
                    <input
                      type="range"
                      min={0}
                      max={telemetry.length - 1}
                      value={currentIdx}
                      onChange={(e) => {
                        setSelectedIdx(parseInt(e.target.value));
                        setIsPlaying(false);
                      }}
                      className="w-full accent-orange-500 bg-slate-900 h-2 rounded cursor-pointer border border-[#1E293B] relative z-10"
                    />
                    
                    {/* Visual tick marks and labels for identified milestones in Sandbox Mode */}
                    {sandboxMode && telemetry.length > 0 && (
                      <div className="absolute top-2 left-0 right-0 h-4 pointer-events-none">
                        {flareIdx !== null && flareIdx >= 0 && (
                          <div 
                            className="absolute flex flex-col items-center -translate-x-1/2 cursor-pointer pointer-events-auto group mt-0.5"
                            style={{ left: `${(flareIdx / (telemetry.length - 1)) * 100}%` }}
                            onClick={() => { setSelectedIdx(flareIdx); setIsPlaying(false); }}
                            title={`Solar Flare Peak: ${formatTime(telemetry[flareIdx].time)}`}
                          >
                            <div className="w-px h-1.5 bg-orange-500/60 group-hover:bg-orange-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 ring-2 ring-orange-500/25 group-hover:scale-125 transition-transform" />
                            <span className="text-[7px] text-orange-400 mt-1.5 font-bold whitespace-nowrap bg-[#090A0C] border border-[#1E293B] px-1 py-0.5 rounded shadow">☀️ FLR</span>
                          </div>
                        )}
                        {protonIdx !== null && protonIdx >= 0 && (
                          <div 
                            className="absolute flex flex-col items-center -translate-x-1/2 cursor-pointer pointer-events-auto group mt-0.5"
                            style={{ left: `${(protonIdx / (telemetry.length - 1)) * 100}%` }}
                            onClick={() => { setSelectedIdx(protonIdx); setIsPlaying(false); }}
                            title={`Proton Flux Peak: ${formatTime(telemetry[protonIdx].time)}`}
                          >
                            <div className="w-px h-1.5 bg-cyan-500/60 group-hover:bg-cyan-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 ring-2 ring-cyan-500/25 group-hover:scale-125 transition-transform" />
                            <span className="text-[7px] text-cyan-400 mt-1.5 font-bold whitespace-nowrap bg-[#090A0C] border border-[#1E293B] px-1 py-0.5 rounded shadow">🧬 PROT</span>
                          </div>
                        )}
                        {cmeIdx !== null && cmeIdx >= 0 && (
                          <div 
                            className="absolute flex flex-col items-center -translate-x-1/2 cursor-pointer pointer-events-auto group mt-0.5"
                            style={{ left: `${(cmeIdx / (telemetry.length - 1)) * 100}%` }}
                            onClick={() => { setSelectedIdx(cmeIdx); setIsPlaying(false); }}
                            title={`CME Shockwave Impact: ${formatTime(telemetry[cmeIdx].time)}`}
                          >
                            <div className="w-px h-1.5 bg-red-500/60 group-hover:bg-red-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-red-500/25 group-hover:scale-125 transition-transform animate-pulse" />
                            <span className="text-[7px] text-red-500 mt-1.5 font-bold whitespace-nowrap bg-[#090A0C] border border-[#1E293B] px-1 py-0.5 rounded shadow">☄️ CME</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase shrink-0">
                    {telemetry.length > 0 ? getFormattedDateShort(telemetry[telemetry.length - 1].time) : "06/04 23:55"}
                  </span>
                </div>

                {/* Analytical Chronological Milestones (Sandbox Mode specific) */}
                {sandboxMode && telemetry.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[9px] border-t border-[#1E293B]/60 pt-2.5">
                    <span className="text-slate-500 uppercase leading-none text-[8px]">Rapid Jumps:</span>
                    
                    <button
                      onClick={() => {
                        if (flareIdx !== null) {
                          setSelectedIdx(flareIdx);
                          setIsPlaying(false);
                        }
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer font-bold uppercase flex items-center gap-1 ${
                        currentIdx === flareIdx
                          ? "bg-orange-500/20 border-orange-400 text-orange-400"
                          : "bg-[#090A0C] border-[#1E293B] text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span>☀️ Solar Flare Peak ({flareIdx !== null && telemetry[flareIdx] ? formatTime(telemetry[flareIdx].time) : "09:30 AM"})</span>
                    </button>

                    <button
                      onClick={() => {
                        if (protonIdx !== null) {
                          setSelectedIdx(protonIdx);
                          setIsPlaying(false);
                        }
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer font-bold uppercase flex items-center gap-1 ${
                        currentIdx === protonIdx
                          ? "bg-yellow-500/20 border-yellow-450 text-yellow-500"
                          : "bg-[#090A0C] border-[#1E293B] text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span>🧬 Proton Flux Peak ({protonIdx !== null && telemetry[protonIdx] ? formatTime(telemetry[protonIdx].time) : "12:00 PM"})</span>
                    </button>

                    <button
                      onClick={() => {
                        if (cmeIdx !== null) {
                          setSelectedIdx(cmeIdx);
                          setIsPlaying(false);
                        }
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer font-bold uppercase flex items-center gap-1 ${
                        currentIdx === cmeIdx
                          ? "bg-red-500/20 border-red-400 text-red-400"
                          : "bg-[#090A0C] border-[#1E293B] text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span>☄️ CME Shockwave ({cmeIdx !== null && telemetry[cmeIdx] ? formatTime(telemetry[cmeIdx].time) : "17:35 PM"})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {dualViewMode ? (
              /* DUAL VIEW COMPARATIVE CONSOLE DECK */
              <EventComparator useLocalTime={useLocalTime} />
            ) : (
              <>
                {/* ROW 1: REAL-TIME INDIVIDUAL MONITOR GAUGES (BENTO CARDS) */}
                <div id="bento-gauges" className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#1E293B] p-px border border-[#1E293B] rounded-lg overflow-hidden">
                  
                  {/* Card 1: Solar Wind Speed */}
                  <div className="bg-[#090A0C] p-4 flex flex-col justify-between min-h-[160px]">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">Solar Wind Velocity</span>
                      <span className="text-3xl font-mono text-white tracking-tighter mt-1 block">
                        {currentVal.speed} <span className="text-xs text-slate-500 font-normal">km/s</span>
                      </span>
                    </div>
                    <MicroSparkline data={last10Points} dataKey="speed" stroke="#f59e0b" />
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block uppercase">Sensor: MAG/SWEPAM</span>
                  </div>

                  {/* Card 2: Proton Storm Density */}
                  <div className="bg-[#090A0C] p-4 flex flex-col justify-between min-h-[160px]">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">Proton Density</span>
                      <span className="text-3xl font-mono text-white tracking-tighter mt-1 block">
                        {currentVal.density} <span className="text-xs text-slate-500 font-normal">p/cm³</span>
                      </span>
                    </div>
                    <MicroSparkline data={last10Points} dataKey="density" stroke="#06b6d4" />
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block uppercase">Ionization channel</span>
                  </div>

                  {/* Card 3: Magnetic Tension Bz component */}
                  <div className="bg-[#090A0C] p-4 flex flex-col justify-between min-h-[160px]">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">IMF Core Polarity Bz</span>
                      <span className={`text-3xl font-mono tracking-tighter mt-1 block ${
                        currentVal.bz < 0 ? "text-orange-400 font-bold" : "text-emerald-400"
                      }`}>
                        {currentVal.bz} <span className="text-xs text-slate-500 font-normal">nT</span>
                      </span>
                    </div>
                    <MicroSparkline data={last10Points} dataKey="bz" stroke="#ec4899" />
                    <span className="text-[10px] font-mono mt-2 block uppercase text-slate-400">Alignment: NORTH/SOUTH</span>
                  </div>

                  {/* Card 4: Flare Solar Wave Radiance */}
                  <div className="bg-[#090A0C] p-4 flex flex-col justify-between min-h-[160px]">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">X-Ray Solar Radiance</span>
                      <span className="text-2xl font-mono text-white tracking-tighter mt-1 block truncate">
                        {currentVal.xrayLong ? currentVal.xrayLong.toExponential(1) : "0"} <span className="text-xs text-slate-500 font-normal">W/m²</span>
                      </span>
                    </div>
                    <MicroSparkline data={last10Points} dataKey="xrayLong" stroke="#ef4444" />
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block uppercase">GOES X-Ray channel</span>
                  </div>

                </div>

                {/* ROW 2: NOAA SPACE WEATHER SCALES SUMMARY PANEL */}
                <section id="scales-section" className="space-y-3 bg-[#0F172A] border border-[#1E293B] rounded p-4">
                  <div className="flex items-center gap-2 border-b border-[#1E293B] pb-2">
                    <Globe className="w-4 h-4 text-orange-400" />
                    <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Active NOAA Space Weather Scale Levels</h2>
                  </div>
                  <ScaleIndicator scales={displayScales} />
                </section>

                {/* ROW 3: NASA SDO WAVE Spectrometer + Telemetry Charts */}
                <div id="charts-visualizer-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-4 flex">
                    <SolarDiskVisualizer />
                  </div>
                  <div className="lg:col-span-8 flex">
                    <TelemetryCharts
                      data={telemetry}
                      sourceName={telemetrySource}
                      selectedIdx={selectedIdx}
                      setSelectedIdx={setSelectedIdx}
                      sandboxMode={sandboxMode}
                      useLocalTime={useLocalTime}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ROW 4: NASA DONKI CAUSATION AND NOAA WATCH ALERTS STREAM */}
            <section id="alerts-causality-section">
              <EventsFeed alerts={alerts} donkiEvents={donkiEvents} />
            </section>

            {/* ROW 5: HELIOPHYSICS SCIENCE SUITE (CLASSROOM CHALLENGES & AI ANALYST) */}
            <section id="classroom-section" className="space-y-4 border-t border-[#1E293B] pt-6">
              <div className="flex items-center gap-2 border-b border-[#1E293B] pb-2">
                <BookOpen className="w-4 h-4 text-orange-400" />
                <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Space Weather Science Classroom & Labs</h2>
              </div>
              <ScienceDesk
                currentTelemetry={currentVal}
                activeScaleText={activeScaleText}
                activeAlertsCount={alerts.length}
                mode={sandboxMode ? "sandbox" : "live"}
              />
            </section>

          </div>
        )}

      </div>
    </div>
  );
}
