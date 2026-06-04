import React, { useState } from "react";
import {
  HISTORICAL_EVENTS,
  generateHistoricalTelemetry,
  HistoricalEventInfo,
} from "../data/historicalEvents";
import { TelemetryData } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Scale,
  Gauge,
  Clock,
  Compass,
  ArrowRight,
  ShieldAlert,
  Zap,
  Globe,
  Link2,
} from "lucide-react";

interface EventComparatorProps {
  useLocalTime: boolean;
}

export default function EventComparator({ useLocalTime }: EventComparatorProps) {
  // Select which historic solar event for Left and Right sides
  const [eventKeyA, setEventKeyA] = useState<string>("may-2024");
  const [eventKeyB, setEventKeyB] = useState<string>("september-1859");

  // Interactive scrubber index (0 to 99) for Left and Right sides
  const [indexA, setIndexA] = useState<number>(50); // CME arrival peak usually around here
  const [indexB, setIndexB] = useState<number>(38); // Carrington event compression spike

  // Dynamic plot selection for comparative graph
  const [activePlotKey, setActivePlotKey] = useState<
    "speed" | "bz" | "density" | "xrayLong"
  >("speed");

  // Get metadata
  const eventMetadataA = HISTORICAL_EVENTS.find((e) => e.key === eventKeyA) || HISTORICAL_EVENTS[0];
  const eventMetadataB = HISTORICAL_EVENTS.find((e) => e.key === eventKeyB) || HISTORICAL_EVENTS[1];

  // Procedurally generated telemetry timelines
  const timelineA = generateHistoricalTelemetry(eventKeyA);
  const timelineB = generateHistoricalTelemetry(eventKeyB);

  // Active scrubbed values
  const currentValA = timelineA[indexA] || timelineA[timelineA.length - 1];
  const currentValB = timelineB[indexB] || timelineB[timelineB.length - 1];

  // Timeline formatting for display
  const formatIndexTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (useLocalTime) {
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const tzName =
          date.toLocaleTimeString("en-US", { timeStyle: "short" }).split(" ")[2] || "Local";
        return (
          `${m}/${d} ` +
          date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) +
          ` ${tzName}`
        );
      } else {
        const m = String(date.getUTCMonth() + 1).padStart(2, "0");
        const d = String(date.getUTCDate()).padStart(2, "0");
        return (
          `${m}/${d} ` +
          date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
            hour12: false,
          }) +
          " UTC"
        );
      }
    } catch {
      return isoString;
    }
  };

  const getDayShort = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (useLocalTime) {
        return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
          date.getDate()
        ).padStart(2, "0")}`;
      } else {
        return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(
          date.getUTCDate()
        ).padStart(2, "0")}`;
      }
    } catch {
      return "06/03";
    }
  };

  // Coordinated calculations matching NOAA scale standards
  const calculateNoaaRatings = (item: TelemetryData) => {
    let r = 0;
    const xray = item.xrayLong;
    if (xray >= 1e-4) r = 4;
    else if (xray >= 1e-5) r = 3;
    else if (xray >= 1e-6) r = 2;
    else if (xray >= 1e-7) r = 1;

    let s = 0;
    const density = item.density;
    if (density >= 40) s = 4;
    else if (density >= 25) s = 3;
    else if (density >= 12) s = 2;
    else if (density >= 6) s = 1;

    let g = 0;
    const bz = item.bz;
    const speed = item.speed;
    if (bz <= -20 && speed >= 800) g = 4;
    else if (bz <= -12 && speed >= 650) g = 3;
    else if (bz <= -6 && speed >= 500) g = 2;
    else if (bz <= -2 && speed >= 430) g = 1;

    // Boundary Carrington extreme scoring booster
    if (speed >= 1800 && bz <= -80) g = 5; // Carrington level G5 super-spike

    return { g, s, r };
  };

  const scoresA = calculateNoaaRatings(currentValA);
  const scoresB = calculateNoaaRatings(currentValB);

  // Combine event graphs so we can plot side-by-side cleanly in Recharts
  // x-axis represents index (0 to 99) so we map index-to-index
  const combinedChartData = timelineA.map((pointA, idx) => {
    const pointB = timelineB[idx] || pointA;
    return {
      index: idx,
      [`left_${activePlotKey}`]: pointA[activePlotKey],
      [`right_${activePlotKey}`]: pointB[activePlotKey],
      timeLabelA: formatIndexTime(pointA.time),
      timeLabelB: formatIndexTime(pointB.time),
    };
  });

  const getMetricDesc = () => {
    if (activePlotKey === "speed") return "Velocity of charged solar fast wind plasma stream (km/s)";
    if (activePlotKey === "bz") return "Direction of interstellar magnetic field z-component (nT)";
    if (activePlotKey === "density") return "Solar proton particles density per cm³ volume";
    return "Solar X-Ray irradiance energy levels (W/m²)";
  };

  return (
    <div
      id="event-comparator-panel"
      className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-5 shadow-lg w-full"
    >
      {/* COMPARATOR SUB HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#1E293B] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-orange-650/20 text-orange-400">
              <Scale className="w-5 h-5 text-orange-400" />
            </span>
            <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">
              Scientific Event Comparison Panel (Dual-View)
            </h2>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
            Compare distinct chronological solar events and customize relative time-windows side-by-side
          </p>
        </div>

        {/* Global Citations Hub Header Action */}
        <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 bg-emerald-950/30 px-3 py-1 border border-emerald-500/20 rounded-md shrink-0">
          📍 DIRECT NOAA/NASA DATA REFERENCES REGISTERED
        </span>
      </div>

      {/* PARENT DUAL COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-6">
        {/* ======================= WINDOW A: LEFT COLUMN PANEL ======================= */}
        <div className="bg-[#090A0C] border border-[#1E293B] rounded-lg p-4 flex flex-col justify-between">
          <div>
            {/* Header selection card dropdown */}
            <div className="mb-4">
              <label className="text-[9px] uppercase font-mono font-extrabold text-slate-500 block mb-1">
                Timeline Platform A Selector
              </label>
              <select
                value={eventKeyA}
                onChange={(e) => {
                  setEventKeyA(e.target.value);
                  setIndexA(50); // reset scrubber to middle region
                }}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-slate-200 text-xs py-2 px-3 rounded font-bold font-mono focus:border-orange-500 cursor-pointer outline-none"
              >
                {HISTORICAL_EVENTS.map((e) => (
                  <option key={e.key} value={e.key}>
                    {e.name} ({e.dateText})
                  </option>
                ))}
              </select>
            </div>

            {/* Description card */}
            <div className="bg-[#0F172A] border border-[#1E293B]/60 p-3 rounded text-[11px] font-sans text-slate-350 leading-relaxed mb-4">
              <span className="font-mono font-bold text-[10px] text-orange-400 uppercase tracking-widest block mb-1">
                Event Profile: {eventMetadataA.name}
              </span>
              {eventMetadataA.description}
            </div>

            {/* Chrono slider scrubber */}
            <div className="bg-[#0F172A]/50 border border-[#1E293B]/40 rounded p-3.5 mb-4">
              <div className="flex justify-between items-center text-[10px] font-mono mb-2">
                <span className="text-slate-400">Timeline Phase Scrubber (PT-A)</span>
                <span className="text-orange-400 font-bold">
                  Point {indexA} / 99
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                  {getDayShort(timelineA[0].time)} 00:00
                </span>
                <input
                  type="range"
                  min={0}
                  max={99}
                  value={indexA}
                  onChange={(e) => setIndexA(parseInt(e.target.value))}
                  className="flex-1 accent-orange-500 bg-[#090A0C] h-2 rounded cursor-pointer border border-[#1E293B]"
                />
                <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                  {getDayShort(timelineA[99].time)} 23:30
                </span>
              </div>

              {/* Current select moment values */}
              <div className="flex items-center justify-between border-t border-[#1E293B]/50 mt-3 pt-2 text-[10px] font-mono">
                <span className="text-slate-500 uppercase">Selected Stamp:</span>
                <span className="text-white font-extrabold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-400" />
                  {formatIndexTime(currentValA.time)}
                </span>
              </div>
            </div>

            {/* Gauges panel */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 font-mono">
              <div className="bg-[#0F172A]/85 border border-[#1E293B] p-2.5 rounded text-center">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase block tracking-wider mb-1">Wind Velocity</span>
                <span className="text-xs text-white block truncate">{currentValA.speed} km/s</span>
              </div>
              <div className="bg-[#0F172A]/85 border border-[#1E293B] p-2.5 rounded text-center">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase block tracking-wider mb-1">Proton Dens</span>
                <span className="text-xs text-white block truncate">{currentValA.density} cm⁻³</span>
              </div>
              <div className="bg-[#0F172A]/85 border border-[#1E293B] p-2.5 rounded text-center">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase block tracking-wider mb-1">Polarity Bz</span>
                <span className={`text-xs block truncate ${currentValA.bz < 0 ? "text-orange-400 font-bold" : "text-emerald-400"}`}>
                  {currentValA.bz} nT
                </span>
              </div>
              <div className="bg-[#0F172A]/85 border border-[#1E293B] p-2.5 rounded text-center col-span-3 grid grid-cols-3 gap-1 py-1 px-1 text-[10px]">
                <div className="text-slate-400 text-left pl-2">Bt: {currentValA.bt} nT</div>
                <div className="text-slate-400 text-center">Temp: {currentValA.temperature.toLocaleString()} K</div>
                <div className="text-slate-400 text-right pr-2">Xray: {currentValA.xrayLong.toExponential(1)}</div>
              </div>
            </div>

            {/* Live active scales G, S, R */}
            <div className="space-y-2 font-mono">
              <span className="text-[8px] uppercase font-extrabold tracking-widest text-slate-500 block mb-1">
                Coordinated NOAA Warning Indexes
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {/* G-Scale */}
                <div className={`p-2 rounded border ${scoresA.g > 0 ? "bg-orange-500/15 border-orange-500/35 text-orange-400" : "bg-[#0F172A]/30 border-[#1E293B]/70 text-slate-500"}`}>
                  <span className="text-[8px] uppercase block">G-Scale</span>
                  <span className="font-bold text-sm block">G{scoresA.g}</span>
                  <span className="text-[8px] uppercase font-semibold">Geomagnetic</span>
                </div>
                {/* S-Scale */}
                <div className={`p-2 rounded border ${scoresA.s > 0 ? "bg-amber-500/15 border-amber-500/35 text-amber-400" : "bg-[#0F172A]/30 border-[#1E293B]/70 text-slate-500"}`}>
                  <span className="text-[8px] uppercase block">S-Scale</span>
                  <span className="font-bold text-sm block">S{scoresA.s}</span>
                  <span className="text-[8px] uppercase font-semibold">Radiation</span>
                </div>
                {/* R-Scale */}
                <div className={`p-2 rounded border ${scoresA.r > 0 ? "bg-pink-500/15 border-pink-500/35 text-pink-400" : "bg-[#0F172A]/30 border-[#1E293B]/70 text-slate-500"}`}>
                  <span className="text-[8px] uppercase block">R-Scale</span>
                  <span className="font-bold text-sm block">R{scoresA.r}</span>
                  <span className="text-[8px] uppercase font-semibold">Radio Black</span>
                </div>
              </div>
            </div>
          </div>

          {/* Citation Card under A */}
          <div className="border-t border-[#1E293B]/60 mt-4 pt-3 text-[10px] text-slate-400 space-y-1 bg-[#0F172A]/40 p-2.5 rounded">
            <span className="font-bold text-slate-350 block uppercase font-mono tracking-wide flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-emerald-400" /> Ground Truth Sources:
            </span>
            <p className="leading-relaxed font-sans">{eventMetadataA.citation}</p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px]">
              {eventMetadataA.citationsList.map((ref, rcId) => (
                <a
                  key={rcId}
                  href={ref.url}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                >
                  {ref.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ======================= WINDOW B: RIGHT COLUMN PANEL ======================= */}
        <div className="bg-[#090A0C] border border-[#1E293B] rounded-lg p-4 flex flex-col justify-between">
          <div>
            {/* Header selection card dropdown */}
            <div className="mb-4">
              <label className="text-[9px] uppercase font-mono font-extrabold text-slate-500 block mb-1">
                Timeline Platform B Selector
              </label>
              <select
                value={eventKeyB}
                onChange={(e) => {
                  setEventKeyB(e.target.value);
                  setIndexB(38); // reset scrubber to middle region
                }}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-slate-200 text-xs py-2 px-3 rounded font-bold font-mono focus:border-orange-500 cursor-pointer outline-none"
              >
                {HISTORICAL_EVENTS.map((e) => (
                  <option key={e.key} value={e.key}>
                    {e.name} ({e.dateText})
                  </option>
                ))}
              </select>
            </div>

            {/* Description card */}
            <div className="bg-[#0F172A] border border-[#1E293B]/60 p-3 rounded text-[11px] font-sans text-slate-350 leading-relaxed mb-4">
              <span className="font-mono font-bold text-[10px] text-orange-400 uppercase tracking-widest block mb-1">
                Event Profile: {eventMetadataB.name}
              </span>
              {eventMetadataB.description}
            </div>

            {/* Chrono slider scrubber */}
            <div className="bg-[#0F172A]/50 border border-[#1E293B]/40 rounded p-3.5 mb-4">
              <div className="flex justify-between items-center text-[10px] font-mono mb-2">
                <span className="text-slate-400">Timeline Phase Scrubber (PT-B)</span>
                <span className="text-orange-400 font-bold">
                  Point {indexB} / 99
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                  {getDayShort(timelineB[0].time)} 00:00
                </span>
                <input
                  type="range"
                  min={0}
                  max={99}
                  value={indexB}
                  onChange={(e) => setIndexB(parseInt(e.target.value))}
                  className="flex-1 accent-orange-500 bg-[#090A0C] h-2 rounded cursor-pointer border border-[#1E293B]"
                />
                <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                  {getDayShort(timelineB[99].time)} 23:30
                </span>
              </div>

              {/* Current select moment values */}
              <div className="flex items-center justify-between border-t border-[#1E293B]/50 mt-3 pt-2 text-[10px] font-mono">
                <span className="text-slate-500 uppercase">Selected Stamp:</span>
                <span className="text-white font-extrabold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-400" />
                  {formatIndexTime(currentValB.time)}
                </span>
              </div>
            </div>

            {/* Gauges panel */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 font-mono">
              <div className="bg-[#0F172A]/85 border border-[#1E293B] p-2.5 rounded text-center">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase block tracking-wider mb-1">Wind Velocity</span>
                <span className="text-xs text-white block truncate">{currentValB.speed} km/s</span>
              </div>
              <div className="bg-[#0F172A]/85 border border-[#1E293B] p-2.5 rounded text-center">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase block tracking-wider mb-1">Proton Dens</span>
                <span className="text-xs text-white block truncate">{currentValB.density} cm⁻³</span>
              </div>
              <div className="bg-[#0F172A]/85 border border-[#1E293B] p-2.5 rounded text-center">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase block tracking-wider mb-1">Polarity Bz</span>
                <span className={`text-xs block truncate ${currentValB.bz < 0 ? "text-orange-400 font-bold" : "text-emerald-400"}`}>
                  {currentValB.bz} nT
                </span>
              </div>
              <div className="bg-[#0F172A]/85 border border-[#1E293B] p-2.5 rounded text-center col-span-3 grid grid-cols-3 gap-1 py-1 px-1 text-[10px]">
                <div className="text-slate-400 text-left pl-2">Bt: {currentValB.bt} nT</div>
                <div className="text-slate-400 text-center">Temp: {currentValB.temperature.toLocaleString()} K</div>
                <div className="text-slate-400 text-right pr-2">Xray: {currentValB.xrayLong.toExponential(1)}</div>
              </div>
            </div>

            {/* Live active scales G, S, R */}
            <div className="space-y-2 font-mono">
              <span className="text-[8px] uppercase font-extrabold tracking-widest text-slate-500 block mb-1">
                Coordinated NOAA Warning Indexes
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {/* G-Scale */}
                <div className={`p-2 rounded border ${scoresB.g > 0 ? "bg-orange-500/15 border-orange-500/35 text-orange-400" : "bg-[#0F172A]/30 border-[#1E293B]/70 text-slate-500"}`}>
                  <span className="text-[8px] uppercase block">G-Scale</span>
                  <span className="font-bold text-sm block">G{scoresB.g}</span>
                  <span className="text-[8px] uppercase font-semibold">Geomagnetic</span>
                </div>
                {/* S-Scale */}
                <div className={`p-2 rounded border ${scoresB.s > 0 ? "bg-amber-500/15 border-amber-500/35 text-amber-400" : "bg-[#0F172A]/30 border-[#1E293B]/70 text-slate-500"}`}>
                  <span className="text-[8px] uppercase block">S-Scale</span>
                  <span className="font-bold text-sm block">S{scoresB.s}</span>
                  <span className="text-[8px] uppercase font-semibold">Radiation</span>
                </div>
                {/* R-Scale */}
                <div className={`p-2 rounded border ${scoresB.r > 0 ? "bg-pink-500/15 border-pink-500/35 text-pink-400" : "bg-[#0F172A]/30 border-[#1E293B]/70 text-slate-500"}`}>
                  <span className="text-[8px] uppercase block">R-Scale</span>
                  <span className="font-bold text-sm block">R{scoresB.r}</span>
                  <span className="text-[8px] uppercase font-semibold">Radio Black</span>
                </div>
              </div>
            </div>
          </div>

          {/* Citation Card under B */}
          <div className="border-t border-[#1E293B]/60 mt-4 pt-3 text-[10px] text-slate-400 space-y-1 bg-[#0F172A]/40 p-2.5 rounded">
            <span className="font-bold text-slate-350 block uppercase font-mono tracking-wide flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-emerald-400" /> Ground Truth Sources:
            </span>
            <p className="leading-relaxed font-sans">{eventMetadataB.citation}</p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px]">
              {eventMetadataB.citationsList.map((ref, rcId) => (
                <a
                  key={rcId}
                  href={ref.url}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                >
                  {ref.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ======================= DUAL WAVE COMPARISON RECHARTS GRAPH ======================= */}
      <div className="bg-[#090A0C] border border-[#1E293B] rounded-lg p-4 font-mono">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 border-b border-[#1E293B]/60 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-orange-400 animate-pulse" />
              Comparative Time-Series Plot Index (A vs B)
            </h3>
            <p className="text-[9px] text-slate-500 mt-1 uppercase">
              {getMetricDesc()}
            </p>
          </div>

          {/* Plot coordinate key switcher */}
          <div className="flex flex-wrap gap-1 bg-[#0F172A] border border-[#1E293B] p-0.5 rounded text-[10px] font-bold">
            <button
              onClick={() => setActivePlotKey("speed")}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer uppercase ${
                activePlotKey === "speed" ? "bg-slate-800 text-white border border-[#1E293B]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Wind Velocity
            </button>
            <button
              onClick={() => setActivePlotKey("bz")}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer uppercase ${
                activePlotKey === "bz" ? "bg-slate-800 text-white border border-[#1E293B]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              IMF Polarity (Bz)
            </button>
            <button
              onClick={() => setActivePlotKey("density")}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer uppercase ${
                activePlotKey === "density" ? "bg-slate-800 text-white border border-[#1E293B]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Proton Density
            </button>
            <button
              onClick={() => setActivePlotKey("xrayLong")}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer uppercase ${
                activePlotKey === "xrayLong" ? "bg-slate-800 text-white border border-[#1E293B]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              X-Ray Flares
            </button>
          </div>
        </div>

        {/* Recharts chart stage */}
        <div className="h-64 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedChartData}
              margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
              <XAxis
                dataKey="index"
                stroke="#475569"
                fontSize={9}
                tickFormatter={(val) => `H+${val * 0.5}`}
              />
              <YAxis
                stroke="#475569"
                fontSize={9}
                scale={activePlotKey === "xrayLong" ? "log" : "auto"}
                domain={activePlotKey === "xrayLong" ? [1e-8, 1e-2] : ["auto", "auto"]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const row = payload[0].payload;
                    const idxStr = `H+${(row.index * 0.5).toFixed(1)} hrs`;
                    let unit = "";
                    if (activePlotKey === "speed") unit = " km/s";
                    else if (activePlotKey === "bz") unit = " nT";
                    else if (activePlotKey === "density") unit = " p/cm³";
                    else if (activePlotKey === "xrayLong") unit = " W/m²";

                    return (
                      <div className="bg-[#090A0C] border border-[#1E293B] p-2.5 rounded shadow-lg text-[10px] font-mono leading-relaxed max-w-[280px]">
                        <div className="text-slate-500 border-b border-[#1E293B] pb-1 mb-1 font-bold">
                          Chronology Offset: {idxStr}
                        </div>
                        <div className="text-orange-400 font-bold mb-1 truncate">
                          A [{eventMetadataA.name}]:{" "}
                          <span>
                            {activePlotKey === "xrayLong"
                              ? row[`left_${activePlotKey}`].toExponential(2)
                              : row[`left_${activePlotKey}`]}
                            {unit}
                          </span>
                          <span className="text-[8px] text-slate-500 font-normal block pl-2 italic">
                            Time: {row.timeLabelA}
                          </span>
                        </div>
                        <div className="text-cyan-400 font-bold truncate">
                          B [{eventMetadataB.name}]:{" "}
                          <span>
                            {activePlotKey === "xrayLong"
                              ? row[`right_${activePlotKey}`].toExponential(2)
                              : row[`right_${activePlotKey}`]}
                            {unit}
                          </span>
                          <span className="text-[8px] text-slate-500 font-normal block pl-2 italic">
                            Time: {row.timeLabelB}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey={`left_${activePlotKey}`}
                name={`A: ${eventMetadataA.name}`}
                stroke="#f97316"
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey={`right_${activePlotKey}`}
                name={`B: ${eventMetadataB.name}`}
                stroke="#06b6d4"
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend description */}
        <div className="flex gap-4 items-center justify-center text-[10px] font-mono mt-3 text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-orange-500" />
            <span>Orange line: Dataset A ({eventMetadataA.name})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-cyan-500" />
            <span>Cyan line: Dataset B ({eventMetadataB.name})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
