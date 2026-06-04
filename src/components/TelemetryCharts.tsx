import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  LineChart,
  Line,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { TelemetryData } from "../types";
import {
  AlertCircle,
  Gauge,
  Activity,
  Zap,
  Radio,
  Compass,
  Flame,
  Globe,
  PlusCircle,
  Play,
  RotateCcw,
} from "lucide-react";

interface TelemetryChartsProps {
  data: TelemetryData[];
  sourceName: string;
  selectedIdx: number | null;
  setSelectedIdx: (idx: number | null) => void;
  sandboxMode: boolean;
  useLocalTime?: boolean;
}

export default function TelemetryCharts({
  data,
  sourceName,
  selectedIdx,
  setSelectedIdx,
  sandboxMode,
  useLocalTime = false,
}: TelemetryChartsProps) {
  const RefArea = ReferenceArea as any;
  const [activeTab, setActiveTab] = useState<
    "solar-wind" | "imf" | "xray" | "cme-tracker" | "kp-index"
  >("solar-wind");

  // Local state for live mode CME test eruption
  const [liveCmeActive, setLiveCmeActive] = useState<boolean>(false);
  const [liveCmeSpeed, setLiveCmeSpeed] = useState<number>(1400); // km/s
  const [liveCmeStartTime, setLiveCmeStartTime] = useState<string | null>(null);
  const [liveCmeProgress, setLiveCmeProgress] = useState<number>(0); // 0 to 1

  // Handle live CME simulator progress
  useEffect(() => {
    if (!liveCmeActive || sandboxMode) {
      setLiveCmeActive(false);
      return;
    }

    const interval = setInterval(() => {
      setLiveCmeProgress((prev) => {
        const next = prev + 0.02; // Increment progress
        if (next >= 1.0) {
          clearInterval(interval);
          return 1.0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [liveCmeActive, sandboxMode]);

  const handleLaunchLiveCme = () => {
    setLiveCmeActive(true);
    setLiveCmeProgress(0);
    setLiveCmeSpeed(1200 + Math.floor(Math.random() * 500));
    setLiveCmeStartTime(new Date().toLocaleTimeString("en-US", { timeZone: "UTC" }) + " UTC");
  };

  const handleResetLiveCme = () => {
    setLiveCmeActive(false);
    setLiveCmeProgress(0);
    setLiveCmeStartTime(null);
  };

  if (!data || data.length === 0) {
    return (
      <div
        id="no-telemetry"
        className="flex flex-col items-center justify-center h-96 bg-[#0F172A] border border-[#1E293B] rounded p-6 shadow-lg w-full"
      >
        <Activity className="w-12 h-12 text-slate-500 animate-pulse mb-3 animate-spin" />
        <p className="text-slate-300 font-mono text-xs uppercase tracking-wider">
          Waiting for spacecraft data streaming stream...
        </p>
        <span className="text-xs text-slate-500 mt-2 font-mono">
          POLLING NOAA SPACE WEATHER SERVICES
        </span>
      </div>
    );
  }

  // Get current active index or fallback to latest point
  const currentIdx = selectedIdx !== null ? selectedIdx : data.length - 1;
  const currentVal = data[currentIdx] || data[data.length - 1];

  // Helper to get speed level
  const getSpeedLevel = (speed: number): number => {
    if (speed >= 800) return 4;
    if (speed >= 650) return 3;
    if (speed >= 500) return 2;
    if (speed >= 430) return 1;
    return 0;
  };
  const activeSpeedLevel = getSpeedLevel(currentVal.speed);

  // Helper to get Bz southward risk level
  const getBzLevel = (bz: number): number => {
    if (bz <= -20) return 4;
    if (bz <= -12) return 3;
    if (bz <= -6) return 2;
    if (bz <= -2) return 1;
    return 0;
  };
  const activeBzLevel = getBzLevel(currentVal.bz);

  // Helper to get Xray flare intensity level
  const getXrayLevel = (xray: number): number => {
    if (xray >= 1e-4) return 4;
    if (xray >= 1e-5) return 3;
    if (xray >= 1e-6) return 2;
    if (xray >= 1e-7) return 1;
    return 0;
  };
  const activeXrayLevel = getXrayLevel(currentVal.xrayLong);

  // Helper to get Kp disturbance level
  const getKpLevel = (kp: number): number => {
    if (kp >= 8.0) return 4;
    if (kp >= 7.0) return 3;
    if (kp >= 6.0) return 2;
    if (kp >= 5.0) return 1;
    return 0;
  };
  const activeKpLevel = getKpLevel(currentVal.kp || 0);

  // Generic band helper to set low opacity by default, highlighting active range
  const getBandOpacity = (level: number, activeLevel: number) => {
    return level === activeLevel ? 0.15 : 0.015;
  };

  const getBandBorder = (level: number, activeLevel: number, color: string) => {
    return level === activeLevel ? color : "none";
  };

  // Helper to determine active event severity color based on current speed, density, bz, xray
  const getActiveSeverityColor = () => {
    const s = currentVal.density >= 40 ? 4 : currentVal.density >= 25 ? 3 : currentVal.density >= 12 ? 2 : currentVal.density >= 6 ? 1 : 0;
    const g = (currentVal.bz <= -20 && currentVal.speed >= 800) ? 4 : (currentVal.bz <= -12 && currentVal.speed >= 650) ? 3 : (currentVal.bz <= -6 && currentVal.speed >= 500) ? 2 : (currentVal.bz <= -2 && currentVal.speed >= 430) ? 1 : 0;
    const r = currentVal.xrayLong >= 1e-4 ? 4 : currentVal.xrayLong >= 1e-5 ? 3 : currentVal.xrayLong >= 1e-6 ? 2 : currentVal.xrayLong >= 1e-7 ? 1 : 0;
    const maxScore = Math.max(s, g, r);

    if (maxScore === 4) return "#ec4899"; // Severe pink
    if (maxScore === 3) return "#ef4444"; // Strong red
    if (maxScore === 2) return "#f97316"; // Moderate orange
    if (maxScore === 1) return "#eab308"; // Minor yellow
    return "#10b981"; // Quiet emerald
  };
  const activeColor = getActiveSeverityColor();

  // Format timestamp labels for X-Axis (UTC or Local time tag format)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (useLocalTime) {
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const dayPrefix = `${m}/${d}`;
        const tzName = date.toLocaleTimeString("en-US", { timeStyle: "short" }).split(" ")[2] || "";
        return (
          dayPrefix + " " +
          date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) + (tzName ? ` ${tzName}` : " Lcl")
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

  // Tooltip formatter for detailed hovering
  const customTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length > 0) {
      let stamp = "";
      try {
        const date = new Date(label);
        if (useLocalTime) {
          const tzName = date.toLocaleTimeString("en-US", { timeStyle: "short" }).split(" ")[2] || "";
          stamp = date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) + (tzName ? ` ${tzName}` : " Local");
        } else {
          stamp = date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
            hour12: false,
          }) + " UTC";
        }
      } catch {
        stamp = String(label);
      }

      return (
        <div className="bg-[#090A0C] border border-[#1E293B] p-3 rounded shadow-2xl font-mono text-xs z-50">
          <p className="text-slate-400 font-mono mb-2 border-b border-[#1E293B] pb-1">
            {stamp}
          </p>
          {payload.map((p: any, idx: number) => {
            let unit = "";
            let name = p.name;
            let val = p.value;

            if (p.name === "speed") {
              unit = " km/s";
              name = "Wind Speed";
            } else if (p.name === "density") {
              unit = " cm⁻³";
              name = "Proton Density";
            } else if (p.name === "bz") {
              unit = " nT";
              name = "Magnetic Bz";
            } else if (p.name === "bt") {
              unit = " nT";
              name = "Total Bt";
            } else if (p.name === "kp") {
              unit = "";
              name = "Planetary Kp Index";
              val = val.toFixed(1);
            } else if (p.name === "xrayLong") {
              name = "X-Ray long Flux";
              val = val.toExponential(3);
              unit = " W/m²";
            }

            return (
              <div key={idx} className="flex items-center justify-between gap-6 py-1">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color || p.stroke }}
                  />
                  {name}
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: p.color || p.stroke }}
                >
                  {val}
                  {unit}
                </span>
              </div>
            );
          })}
          <div className="text-[9px] text-[#D1D5DB] mt-2 border-t border-[#1E293B] pt-1 text-center font-sans italic">
            Click to lock slider onto this timeline point
          </div>
        </div>
      );
    }
    return null;
  };

  // Recharts click synchronization handler
  const handleChartClick = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
      setSelectedIdx(state.activeTooltipIndex);
    }
  };

  // CME Propagation simulation parameters depending on timeline moment
  const getCmeTransitData = () => {
    if (sandboxMode) {
      // Historical storm chronology:
      // CME Erupts June 3, 11:45 UTC
      // Current timeline spans June 4 00:00 to 23:55
      const activeTimeMs = new Date(currentVal.time).getTime();
      const eruptTimeMs = new Date("2026-06-03T11:45:00Z").getTime();
      const impactTimeMs = new Date("2026-06-04T17:35:00Z").getTime();

      const elapsedMins = (activeTimeMs - eruptTimeMs) / (60 * 1000);
      const totalTransitMins = (impactTimeMs - eruptTimeMs) / (60 * 1000);

      // CME position in astronomical units (Sun = 0 AU, Earth = 1.0 AU)
      let position = elapsedMins / totalTransitMins;
      position = Math.max(0, Math.min(1.0, position));

      const isErupted = activeTimeMs >= eruptTimeMs;
      const isPostImpact = activeTimeMs >= impactTimeMs;

      return {
        active: isErupted,
        progress: position,
        speed: isPostImpact ? currentVal.speed : isErupted ? 1450 - position * 530 : 0, // Show deceleration or 0 before eruption
        eruptionTime: "June 3, 11:45 UTC",
        impactTime: "June 4, 17:35 UTC",
        transitStatus: isPostImpact
          ? "IMPACT COMPLETED (SEVERE G4 GEOMAGNETIC DISTURBANCE ACTIVE)"
          : !isErupted
          ? "PRE-ERUPTION (QUIET CORONA MONITORING // SOLAR FLARING WATCH ACTIVE)"
          : `IN TRANSIT (CURRENT DISTANCE: ${(position * 149.6).toFixed(1)}M km / ${position.toFixed(2)} AU)`,
        warnings: isPostImpact
          ? [
              "G4 SEVERE GEOMAGNETIC SHOCK ACTIVE AT L1 DSCOVR",
              "HEAVY INDUCED GROUND TRANSIENTS RECORDED IN PIPELINE ARRAYS",
              "POLAR RE-ROUTING ACTIVE FOR CIRCUMPOLAR FLIGHT PATHS",
            ]
          : !isErupted
          ? ["Solar wind speed quiet. Monitoring active region AR3697 for coronal loops stability."]
          : position > 0.95
          ? ["SHOCKWAVE ENVELOPING L1 SATELLITES (DSCOVR/ACE) NOW"]
          : position > 0.72
          ? ["SHOCKWAVE PASSED VENUS INSTRUMENTS", "Estimated Earth collision in <4 hours"]
          : ["Propagation nominal. Interplanetary shock front traveling earthward."],
      };
    } else {
      // Live Mode CME values
      return {
        active: liveCmeActive,
        progress: liveCmeProgress,
        speed: liveCmeSpeed - liveCmeProgress * 300,
        eruptionTime: liveCmeStartTime || "Quiet Corona Baseline",
        impactTime: "T-plus ~28 hours",
        transitStatus: liveCmeActive
          ? liveCmeProgress >= 1.0
            ? "IMPACT WAVE ARRIVED (SIMULATED LOCAL GEOMAGNETIC FLUCTUATION ACTIVE)"
            : `IN TRANSIT (ESTIMATED POSITION: ${(liveCmeProgress * 149.6).toFixed(1)}M km / ${liveCmeProgress.toFixed(2)} AU)`
          : "Quiet Sun state. No Earth-directed CMEs currently detected.",
        warnings: liveCmeActive
          ? liveCmeProgress >= 1.0
            ? ["Simulated G3/G4 Shock wave registering down-link telemetry shifts!"]
            : ["Simulated plasma cloud traveling through interplanetary space."]
          : ["Baseline quiet heliosphere conditions."],
      };
    }
  };

  const cmeState = getCmeTransitData();

  // Color mapper for Kp-Index bars
  const getKpColor = (kpVal: number) => {
    if (kpVal >= 8.0) return "#ec4899"; // Extreme pink
    if (kpVal >= 7.0) return "#ef4444"; // Severe red
    if (kpVal >= 5.0) return "#f97316"; // Moderate orange
    if (kpVal >= 4.0) return "#eab308"; // Active yellow
    return "#10b981"; // Quiet green
  };

  return (
    <div
      id="telemetry-panel"
      className="bg-[#0F172A] border border-[#1E293B] rounded p-5 shadow flex flex-col justify-between w-full"
    >
      {/* Instrument Panel Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-orange-600/20 text-orange-400">
              <Gauge className="w-4 h-4" />
            </span>
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">
              Space Weather Mission Interface
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1.5 font-mono uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE CHRONO FEED:{" "}
            <span className="text-slate-300 font-bold">{sourceName}</span>
          </p>
        </div>

        {/* Five Interactive Tab Buttons */}
        <div className="flex flex-wrap gap-1 bg-[#090A0C] border border-[#1E293B] p-0.5 rounded font-mono text-[10px] font-bold">
          <button
            id="tab-solar-wind"
            onClick={() => setActiveTab("solar-wind")}
            className={`px-2.5 py-1.5 rounded uppercase transition-all cursor-pointer ${
              activeTab === "solar-wind"
                ? "bg-slate-800 text-white border border-[#1E293B]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Solar Wind
          </button>
          <button
            id="tab-imf"
            onClick={() => setActiveTab("imf")}
            className={`px-2.5 py-1.5 rounded uppercase transition-all cursor-pointer ${
              activeTab === "imf"
                ? "bg-slate-800 text-white border border-[#1E293B]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            IMF (Bz)
          </button>
          <button
            id="tab-xray"
            onClick={() => setActiveTab("xray")}
            className={`px-2.5 py-1.5 rounded uppercase transition-all cursor-pointer ${
              activeTab === "xray"
                ? "bg-slate-800 text-white border border-[#1E293B]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Flares (GOES)
          </button>
          <button
            id="tab-cme"
            onClick={() => setActiveTab("cme-tracker")}
            className={`px-2.5 py-1.5 rounded uppercase transition-all cursor-pointer ${
              activeTab === "cme-tracker"
                ? "bg-slate-800 text-orange-400 border border-[#1E293B]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            CME Transit Tracker
          </button>
          <button
            id="tab-kp"
            onClick={() => setActiveTab("kp-index")}
            className={`px-2.5 py-1.5 rounded uppercase transition-all cursor-pointer ${
              activeTab === "kp-index"
                ? "bg-slate-800 text-white border border-[#1E293B]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Kp Geomagnetic
          </button>
        </div>
      </div>

      {/* Main Core Display Panel */}
      <div id="core-chart-stage" className="h-80 w-full mb-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "solar-wind" ? (
            // DUAL-AXIS SOLAR WIND CHART
            <LineChart
              data={data}
              onClick={handleChartClick}
              margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="#475569"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                domain={[300, 1100]}
                stroke="#f59e0b"
                fontSize={10}
                tickFormatter={(val) => `${val} km/s`}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 60]}
                stroke="#06b6d4"
                fontSize={10}
                tickFormatter={(val) => `${val} cc`}
                tickLine={false}
              />
              <Tooltip content={customTooltip} cursor={{ stroke: activeColor, strokeWidth: 1.5 }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />

              {/* Dynamic NOAA G-Scale Severity Background Shading */}
              <RefArea
                yAxisId="left"
                y1={300}
                y2={430}
                fill="#10b981"
                fillOpacity={getBandOpacity(0, activeSpeedLevel)}
                stroke={getBandBorder(0, activeSpeedLevel, "rgba(16,185,129,0.3)")}
                strokeWidth={1}
                label={activeSpeedLevel === 0 ? { value: "🟢 G0: CALM SOLAR WIND", position: "insideTopLeft", fill: "#10b981", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                yAxisId="left"
                y1={430}
                y2={500}
                fill="#eab308"
                fillOpacity={getBandOpacity(1, activeSpeedLevel)}
                stroke={getBandBorder(1, activeSpeedLevel, "rgba(234,179,8,0.3)")}
                strokeWidth={1}
                label={activeSpeedLevel === 1 ? { value: "🟡 G1 MAJOR/MINOR COUPLING FRONT", position: "insideTopLeft", fill: "#eab308", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                yAxisId="left"
                y1={500}
                y2={650}
                fill="#f97316"
                fillOpacity={getBandOpacity(2, activeSpeedLevel)}
                stroke={getBandBorder(2, activeSpeedLevel, "rgba(249,115,22,0.3)")}
                strokeWidth={1}
                label={activeSpeedLevel === 2 ? { value: "🟠 G2 MODERATE MAGNETIC COMPRESSION", position: "insideTopLeft", fill: "#f97316", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                yAxisId="left"
                y1={650}
                y2={800}
                fill="#ef4444"
                fillOpacity={getBandOpacity(3, activeSpeedLevel)}
                stroke={getBandBorder(3, activeSpeedLevel, "rgba(239,68,68,0.4)")}
                strokeWidth={1}
                label={activeSpeedLevel === 3 ? { value: "🔴 G3 STRONG GEOMAGNETIC SHOCK", position: "insideTopLeft", fill: "#ef4444", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                yAxisId="left"
                y1={800}
                y2={1100}
                fill="#ec4899"
                fillOpacity={getBandOpacity(4, activeSpeedLevel)}
                stroke={getBandBorder(4, activeSpeedLevel, "rgba(236,72,153,0.5)")}
                strokeWidth={1}
                label={activeSpeedLevel === 4 ? { value: "💖 G4+ SEVERE SPACE STORMS ACTIVE", position: "insideTopLeft", fill: "#ec4899", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />

              {/* Dynamic Selector Timeline Reference Line matched to scrubber with dynamic color based on active level */}
              <ReferenceLine
                x={currentVal.time}
                stroke={activeColor}
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: `CRITICAL SEC: ${currentVal.speed} km/s`,
                  position: "top",
                  fill: activeColor,
                  fontSize: 9,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              />

              {/* NOAA Scale Severity Threshold Reference Lines */}
              <ReferenceLine
                yAxisId="left"
                y={800}
                stroke="#ec4899"
                strokeWidth={1}
                strokeDasharray="4 4"
                label={{ value: "G4 - 800 km/s", fill: "#ec4899", fontSize: 8, position: "right" }}
              />
              <ReferenceLine
                yAxisId="left"
                y={650}
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="4 4"
                label={{ value: "G3 - 650 km/s", fill: "#ef4444", fontSize: 8, position: "right" }}
              />

              <Line
                yAxisId="left"
                name="speed"
                type="monotone"
                dataKey="speed"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                name="density"
                type="monotone"
                dataKey="density"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          ) : activeTab === "imf" ? (
            // IMF NORTH/SOUTH ALIGNMENT CHART
            <AreaChart
              data={data}
              onClick={handleChartClick}
              margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="bzColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#ec4899" stopOpacity={0.0} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="#475569"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="#8b5cf6"
                domain={[-35, 35]}
                fontSize={10}
                tickFormatter={(val) => `${val} nT`}
                tickLine={false}
              />
              <Tooltip content={customTooltip} cursor={{ stroke: activeColor }} />

              {/* IMF Magnetic Field Boundary Segmented Shading */}
              <RefArea
                y1={0}
                y2={35}
                fill="#10b981"
                fillOpacity={getBandOpacity(0, activeBzLevel)}
                stroke={getBandBorder(0, activeBzLevel, "rgba(16,185,129,0.3)")}
                strokeWidth={1}
                label={activeBzLevel === 0 ? { value: "🟢 NORTH POLAR MAGNETIC DEFLECTION", position: "insideTopLeft", fill: "#10b981", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                y1={-2}
                y2={0}
                fill="#10b981"
                fillOpacity={getBandOpacity(0, activeBzLevel)}
                stroke={getBandBorder(0, activeBzLevel, "rgba(16,185,129,0.2)")}
                strokeWidth={1}
                label={activeBzLevel === 0 ? { value: "🟢 NEUTRAL ALIGNMENT", position: "insideBottomLeft", fill: "#10b981", fontSize: 9, fontFamily: "monospace" } : undefined}
              />
              <RefArea
                y1={-6}
                y2={-2}
                fill="#eab308"
                fillOpacity={getBandOpacity(1, activeBzLevel)}
                stroke={getBandBorder(1, activeBzLevel, "rgba(234,179,8,0.3)")}
                strokeWidth={1}
                label={activeBzLevel === 1 ? { value: "🟡 NOAA G1 SOUTHWARD COUPLING", position: "insideTopLeft", fill: "#eab308", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                y1={-12}
                y2={-6}
                fill="#f97316"
                fillOpacity={getBandOpacity(2, activeBzLevel)}
                stroke={getBandBorder(2, activeBzLevel, "rgba(249,115,22,0.3)")}
                strokeWidth={1}
                label={activeBzLevel === 2 ? { value: "🟠 NOAA G2 MODERATE PENETRATION", position: "insideTopLeft", fill: "#f97316", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                y1={-20}
                y2={-12}
                fill="#ef4444"
                fillOpacity={getBandOpacity(3, activeBzLevel)}
                stroke={getBandBorder(3, activeBzLevel, "rgba(239,68,68,0.4)")}
                strokeWidth={1}
                label={activeBzLevel === 3 ? { value: "🔴 NOAA G3 STRONG STORM SECTOR", position: "insideTopLeft", fill: "#ef4444", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                y1={-35}
                y2={-20}
                fill="#ec4899"
                fillOpacity={getBandOpacity(4, activeBzLevel)}
                stroke={getBandBorder(4, activeBzLevel, "rgba(236,72,153,0.5)")}
                strokeWidth={1}
                label={activeBzLevel === 4 ? { value: "💖 NOAA G4+ CRITICAL MAGNETOSPHERE INTRUSION", position: "insideTopLeft", fill: "#ec4899", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />

              <ReferenceLine
                x={currentVal.time}
                stroke={activeColor}
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: `CRITICAL SEC (Bz: ${currentVal.bz} nT)`,
                  position: "top",
                  fill: activeColor,
                  fontSize: 9,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} strokeDasharray="4 4" />
              <ReferenceLine
                y={-12}
                label={{
                  value: "G3 Threshold (-12 nT)",
                  fill: "#ef4444",
                  fontSize: 8,
                  position: "insideBottom",
                }}
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <ReferenceLine
                y={-20}
                label={{
                  value: "G4+ Boundary (-20 nT)",
                  fill: "#ec4899",
                  fontSize: 8,
                  position: "insideBottom",
                }}
                stroke="#ec4899"
                strokeWidth={1}
                strokeDasharray="3 3"
              />

              <Area
                name="bz"
                type="monotone"
                dataKey="bz"
                stroke="#ec4899"
                strokeWidth={2.5}
                fill="url(#bzColor)"
              />
              <Line
                name="bt"
                type="monotone"
                dataKey="bt"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="3 3"
              />
            </AreaChart>
          ) : activeTab === "xray" ? (
            // LOG-GRIDED GOES RADIATION FLARE CHARTS
            <LineChart
              data={data}
              onClick={handleChartClick}
              margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="#475569"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="#ef4444"
                scale="log"
                domain={[1e-9, 1e-3]}
                ticks={[1e-9, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3]}
                fontSize={9}
                tickFormatter={(val) => {
                  if (val === 1e-8) return "Class B";
                  if (val === 1e-6) return "Class C";
                  if (val === 1e-5) return "Class M";
                  if (val === 1e-4) return "Class X";
                  return val.toExponential(0);
                }}
                tickLine={false}
              />
              <Tooltip content={customTooltip} cursor={{ stroke: activeColor }} />

              {/* NOAA R-scale Categorized Flare Energy Shading */}
              <RefArea
                y1={1e-9}
                y2={1e-7}
                fill="#10b981"
                fillOpacity={getBandOpacity(0, activeXrayLevel)}
                stroke={getBandBorder(0, activeXrayLevel, "rgba(16,185,129,0.3)")}
                strokeWidth={1}
                label={activeXrayLevel === 0 ? { value: "🟢 NORMAL: BACKGROUND IRRADIANCE", position: "insideTopLeft", fill: "#10b981", fontSize: 9, fontFamily: "monospace" } : undefined}
              />
              <RefArea
                y1={1e-7}
                y2={1e-6}
                fill="#eab308"
                fillOpacity={getBandOpacity(1, activeXrayLevel)}
                stroke={getBandBorder(1, activeXrayLevel, "rgba(234,179,8,0.3)")}
                strokeWidth={1}
                label={activeXrayLevel === 1 ? { value: "🟡 NOAA R1: CLASS C MINOR SOLAR FLARING", position: "insideTopLeft", fill: "#eab308", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                y1={1e-6}
                y2={1e-5}
                fill="#f97316"
                fillOpacity={getBandOpacity(2, activeXrayLevel)}
                stroke={getBandBorder(2, activeXrayLevel, "rgba(249,115,22,0.3)")}
                strokeWidth={1}
                label={activeXrayLevel === 2 ? { value: "🟠 NOAA R2: CLASS M MODERATE RADIANCE", position: "insideTopLeft", fill: "#f97316", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                y1={1e-5}
                y2={1e-4}
                fill="#ef4444"
                fillOpacity={getBandOpacity(3, activeXrayLevel)}
                stroke={getBandBorder(3, activeXrayLevel, "rgba(239,68,68,0.4)")}
                strokeWidth={1}
                label={activeXrayLevel === 3 ? { value: "🔴 NOAA R3: CLASS X STRONG ERUPTIVE EVENT", position: "insideTopLeft", fill: "#ef4444", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                y1={1e-4}
                y2={1e-3}
                fill="#ec4899"
                fillOpacity={getBandOpacity(4, activeXrayLevel)}
                stroke={getBandBorder(4, activeXrayLevel, "rgba(236,72,153,0.5)")}
                strokeWidth={1}
                label={activeXrayLevel === 4 ? { value: "💖 NOAA R4+: CLASS X10+ CRITICAL IONIZING FLARE", position: "insideTopLeft", fill: "#ec4899", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />

              <ReferenceLine
                x={currentVal.time}
                stroke={activeColor}
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: `FLARE MOMENT: ${currentVal.xrayLong ? currentVal.xrayLong.toExponential(1) : "0"} W/m²`,
                  position: "top",
                  fill: activeColor,
                  fontSize: 9,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              />
              <ReferenceLine
                y={1e-4}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                label={{
                  value: "R3/X-Class Limit (10⁻⁴ W/m²)",
                  fill: "#ef4444",
                  fontSize: 8,
                  position: "top",
                }}
              />
              <ReferenceLine
                y={1e-5}
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="2 2"
                label={{
                  value: "R2/M-Class Limit (10⁻⁵ W/m²)",
                  fill: "#f59e0b",
                  fontSize: 8,
                  position: "top",
                }}
              />

              <Line
                name="xrayLong"
                type="monotone"
                dataKey="xrayLong"
                stroke="#ef4444"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : activeTab === "cme-tracker" ? (
            // DYNAMIC INNER SOLAR SYSTEM VECTOR VISUALIZATION
            <div className="absolute inset-0 bg-[#090A0C] border border-[#1E293B] rounded p-4 font-mono text-xs flex flex-col justify-between select-none">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 mb-2">
                <span className="text-[10px] text-orange-400 font-bold tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "12s" }} />
                  NASA WSA-ENLIL HELIOSPHERIC PROPAGATION VECTOR
                </span>
                <span className="text-[9px] text-slate-500">
                  REF TIME: {new Date(currentVal.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
                </span>
              </div>

              {/* Space Lane Track */}
              <div className="flex-1 flex flex-col justify-center relative mt-2 px-6 h-36">
                <div className="absolute left-6 right-6 h-0.5 bg-slate-900 border-b border-[#1E293B] z-0" />

                {/* Conceptual Stations along the AU Highway styled with absolute positions */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-16 z-10">
                  {/* Sun (0.0 AU) */}
                  <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: "0%" }}>
                    <div className="w-10 h-10 rounded-full bg-yellow-400 border-4 border-orange-500 ring-4 ring-yellow-400/20 active:scale-95 transition-all text-black font-extrabold flex items-center justify-center text-xs shadow-lg">
                      ☀️
                    </div>
                    <span className="text-[8px] text-slate-500 mt-1 uppercase font-bold">Sun</span>
                    <span className="text-[7px] text-orange-400">0.0 AU</span>
                  </div>

                  {/* Parker Probe (0.1 AU) */}
                  <div className="absolute -translate-x-1/2 flex flex-col items-center opacity-70" style={{ left: "10%" }}>
                    <div className="w-4 h-4 rounded bg-slate-700 border border-slate-500 flex items-center justify-center text-[7px] text-white">
                      🛰️
                    </div>
                    <span className="text-[7px] text-slate-500 mt-1 uppercase">Parker</span>
                    <span className="text-[6px] text-slate-500">0.10 AU</span>
                  </div>

                  {/* Mercury (0.38 AU) */}
                  <div className="absolute -translate-x-1/2 flex flex-col items-center opacity-75" style={{ left: "38%" }}>
                    <div className="w-4.5 h-4.5 rounded-full bg-gray-600 border border-slate-500 flex items-center justify-center text-[7px]">
                      🌑
                    </div>
                    <span className="text-[7px] text-slate-500 mt-1 uppercase">Mercury</span>
                    <span className="text-[6px] text-slate-500">0.38 AU</span>
                  </div>

                  {/* Venus (0.72 AU) */}
                  <div className="absolute -translate-x-1/2 flex flex-col items-center opacity-75" style={{ left: "72%" }}>
                    <div className="w-5 h-5 rounded-full bg-[#EDBA73] border border-orange-900 flex items-center justify-center text-[8px]">
                      🟡
                    </div>
                    <span className="text-[7px] text-slate-500 mt-1 uppercase">Venus</span>
                    <span className="text-[6px] text-slate-500">0.72 AU</span>
                  </div>

                  {/* DSCOVR L1 (0.99 AU) - Spaced slightly at 93% for clear visual display next to Earth */}
                  <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: "93%" }}>
                    <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-black flex items-center justify-center text-[7px] font-bold text-emerald-400">
                      L1
                    </div>
                    <span className="text-[7px] text-emerald-500 mt-1 uppercase font-bold">DSCOVR</span>
                    <span className="text-[6px] text-emerald-500 font-bold">0.99 AU</span>
                  </div>

                  {/* Earth (1.0 AU) */}
                  <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: "100%" }}>
                    <div className="w-8 h-8 rounded-full bg-[#3B82F6] border-2 border-slate-400 flex items-center justify-center text-[10px] shadow-lg shadow-blue-500/10">
                      🌍
                    </div>
                    <span className="text-[8px] text-blue-400 mt-1 uppercase font-black">Earth</span>
                    <span className="text-[7px] text-blue-400">1.0 AU</span>
                  </div>

                  {/* Progress Wave representing CME front, aligned exactly with the absolute track length */}
                  {cmeState.active && cmeState.progress > 0 && (
                    <div
                      className="absolute h-24 border-l-2 border-dashed border-red-500 bg-gradient-to-r from-red-600/15 to-transparent select-none pointer-events-none transition-all duration-300 z-0"
                      style={{
                        left: `${cmeState.progress * 100}%`,
                        width: "15%",
                        transform: "translateX(-100%) translateY(-24px)",
                        top: "0",
                      }}
                    >
                      <div className="absolute top-0 right-0 translate-x-1/2 w-4 h-4 rounded-full bg-red-500 border border-white animate-ping" />
                      <div className="absolute bottom-[-16px] right-0 translate-x-1/2 bg-red-600 border border-red-400 px-1 py-0.5 rounded text-[8px] text-white font-extrabold uppercase whitespace-nowrap shadow-sm z-20 pointer-events-auto">
                        Shockfront: {cmeState.speed.toFixed(0)} km/s
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live telemetry block for transit */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 border-t border-[#1E293B] pt-2 text-[10px] items-center">
                <div className="md:col-span-8 space-y-1">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className={`w-2 h-2 rounded-full ${cmeState.active ? "bg-orange-500 animate-ping" : "bg-slate-700"}`} />
                    <span className="font-bold text-[#D1D5DB]">STATUS:</span>
                    <span className="text-orange-400 font-extrabold uppercase">{cmeState.transitStatus}</span>
                  </div>
                  <div className="text-slate-400 font-sans leading-normal">
                    <strong>WSA-Enlil Eruption:</strong> {cmeState.eruptionTime} //{" "}
                    <strong>Impact Front Veloc:</strong> {cmeState.speed ? cmeState.speed.toFixed(0) : "---"} km/s
                  </div>
                </div>

                <div className="md:col-span-4 flex justify-end gap-1.5">
                  {!sandboxMode ? (
                    !liveCmeActive ? (
                      <button
                        onClick={handleLaunchLiveCme}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-600/20 border border-orange-500/40 text-orange-400 rounded hover:bg-orange-600/35 transition-all text-[9px] uppercase cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Inject CME Eruption
                      </button>
                    ) : (
                      <button
                        onClick={handleResetLiveCme}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 border border-[#1E293B] text-slate-400 rounded hover:text-slate-200 hover:bg-slate-700 transition-all text-[9px] uppercase cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Clear Probe
                      </button>
                    )
                  ) : (
                    <span className="text-[9px] border border-orange-500/30 font-bold bg-orange-950/20 px-2 py-1 text-orange-400 rounded text-center block w-full uppercase">
                      STORM HISTORICAL MODE ACTIVE
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // PLANETARY KP GEOMAGNETIC DISTURBANCE BAR CHART
            <BarChart
              data={data}
              onClick={handleChartClick}
              margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="#475569"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="#ec4899"
                domain={[0, 9]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) => `Kp ${val}`}
              />
              <Tooltip content={customTooltip} cursor={{ fill: "rgba(236,72,153,0.06)" }} />

              {/* NOAA G-Scale Planetary Kp Storm Shading */}
              <RefArea
                y1={0}
                y2={5}
                fill="#10b981"
                fillOpacity={getBandOpacity(0, activeKpLevel)}
                stroke={getBandBorder(0, activeKpLevel, "rgba(16,185,129,0.3)")}
                strokeWidth={1}
                label={activeKpLevel === 0 ? { value: "🟢 Kp 0-4: CALM FIELD BOUNDS", position: "insideTopLeft", fill: "#10b981", fontSize: 9, fontFamily: "monospace" } : undefined}
              />
              <RefArea
                y1={5}
                y2={6}
                fill="#eab308"
                fillOpacity={getBandOpacity(1, activeKpLevel)}
                stroke={getBandBorder(1, activeKpLevel, "rgba(234,179,8,0.3)")}
                strokeWidth={1}
                label={activeKpLevel === 1 ? { value: "🟡 NOAA G1: Kp 5 ACTIVE GEOMAGNETIC UNREST", position: "insideTopLeft", fill: "#eab308", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                y1={6}
                y2={7}
                fill="#f97316"
                fillOpacity={getBandOpacity(2, activeKpLevel)}
                stroke={getBandBorder(2, activeKpLevel, "rgba(249,115,22,0.3)")}
                strokeWidth={1}
                label={activeKpLevel === 2 ? { value: "🟠 NOAA G2: Kp 6 MODERATE SPACE STORM", position: "insideTopLeft", fill: "#f97316", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                y1={7}
                y2={8}
                fill="#ef4444"
                fillOpacity={getBandOpacity(3, activeKpLevel)}
                stroke={getBandBorder(3, activeKpLevel, "rgba(239,68,68,0.4)")}
                strokeWidth={1}
                label={activeKpLevel === 3 ? { value: "🔴 NOAA G3: Kp 7 STRONG MAGNETIC CRISIS", position: "insideTopLeft", fill: "#ef4444", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />
              <RefArea
                y1={8}
                y2={9}
                fill="#ec4899"
                fillOpacity={getBandOpacity(4, activeKpLevel)}
                stroke={getBandBorder(4, activeKpLevel, "rgba(236,72,153,0.5)")}
                strokeWidth={1}
                label={activeKpLevel === 4 ? { value: "💖 NOAA G4+: Kp 8+ SEVERE ELECTROMAGNETIC STORM", position: "insideTopLeft", fill: "#ec4899", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" } : undefined}
              />

              <ReferenceLine
                x={currentVal.time}
                stroke={activeColor}
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: `CRITICAL SEC: Kp ${currentVal.kp ? currentVal.kp.toFixed(1) : '---'}`,
                  position: "top",
                  fill: activeColor,
                  fontSize: 9,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              />
              <ReferenceLine
                y={7}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{
                  value: "Kp 7 G3 Strong Threshold",
                  fill: "#ef4444",
                  fontSize: 8,
                  position: "top",
                }}
              />
              <ReferenceLine
                y={5}
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="3 3"
                label={{
                  value: "Kp 5 G1 Minor Threshold",
                  fill: "#f97316",
                  fontSize: 8,
                  position: "top",
                }}
              />

              <Bar name="kp" dataKey="kp">
                {data.map((entry, idx) => {
                  const val = entry.kp || 1.2;
                  return <Cell key={`cell-${idx}`} fill={getKpColor(val)} />;
                })}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Interactive Sub-annotation details card */}
      <div className="bg-[#090A0C] border border-[#1E293B] rounded p-3.5 flex gap-3 text-xs text-[#D1D5DB] leading-relaxed">
        <div className="text-orange-400 mt-0.5 shrink-0">
          <AlertCircle className="w-4 h-4 font-bold" />
        </div>
        <div>
          {activeTab === "solar-wind" ? (
            <p>
              <strong className="text-white">Solar Wind Analytics:</strong> Speed under quiet baseline sits around{" "}
              <span className="text-yellow-400 font-bold">350 - 450 km/s</span>. Velocities peaking beyond{" "}
              <span className="text-red-400 font-bold">750 - 920+ km/s</span> paired with an elevated proton density represent the arrival of interplanetary shock fronts compressing the magnetosphere, leading to major geomagnetic G-scale storms.
            </p>
          ) : activeTab === "imf" ? (
            <p>
              <strong className="text-white">Interplanetary Magnetic Field (IMF):</strong> Magnetic polarity is regulated by interplanetary Bz. Positives repel storm energy. Southward flipped negatives (<span className="text-rose-400 font-extrabold">Bz &lt; -10 nT</span>) lock magnetically with Earth's dayside, funneling particles down line cusps to trigger vibrant auroral bands and induced grid spikes.
            </p>
          ) : activeTab === "xray" ? (
            <p>
              <strong className="text-white">Irradiance Flare Flux:</strong> GOES satellites track solar emission in X-ray ranges. High-altitude peaks into{" "}
              <span className="text-amber-400 font-semibold"> M-Class (Moderate, ≥10⁻⁵ W/m²)</span> and{" "}
              <span className="text-red-500 font-bold">X-Class (Extreme, ≥10⁻⁴ W/m²)</span> zones cause immediate D-layer ionospheric ionization, yielding temporary global HF radio blockages over sunlit territory.
            </p>
          ) : activeTab === "cme-tracker" ? (
            <div>
              <p>
                <strong className="text-white">WSA-ENLIL Solar Wind Predictions:</strong> Coronal Mass Ejections (CMEs) consist of billions of tons of high-energy plasma loops launched off solar margins. Traveling across the AU void at average velocities of 1200 km/s, their transit from Sun (0.0 AU) to Earth (1.0 AU) is charted here in real-time.
              </p>
              {cmeState.warnings.length > 0 && (
                <div className="mt-2 pl-3 border-l border-red-500/40 text-[10px] text-red-400 space-y-0.5 font-mono">
                  {cmeState.warnings.map((warn, i) => (
                    <div key={i}>⚠️ {warn}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p>
              <strong className="text-white">Planetary Kp Index:</strong> Calculated from planetary magnetometers, Kp standardizes global geomagnetic activity from 0 (quiet) to 9 (extreme disturbance). Values above <span className="text-orange-400 font-extrabold">Kp 5 (G1)</span> signal storming. Values above <span className="text-red-400 font-black">Kp 7 (G3) or Kp 8+ (G4)</span> trigger commercial transformer warnings and auroral visibility as far south as mid-latitude zones.
            </p>
          )}
        </div>
      </div>

      {/* DIRECT CONNECTED DATA TRUTH SOURCE CITATION FEEDS */}
      <div className="mt-4 border-t border-[#1E293B]/70 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5 shrink-0">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-350 font-bold uppercase tracking-wide">Connected SWPC Data Source Verification feeds (Live/Honest):</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <a
            href="https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json"
            target="_blank"
            referrerPolicy="no-referrer"
            className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
            title="Direct NOAA L1 plasma speed, density & temperature feed"
          >
            Plasma Feed ↗
          </a>
          <a
            href="https://services.swpc.noaa.gov/products/solar-wind/mag-5-minute.json"
            target="_blank"
            referrerPolicy="no-referrer"
            className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
            title="Direct NOAA L1 magnetometer interplanetary magnetic field (Bz)"
          >
            IMF Magnetometer Feed ↗
          </a>
          <a
            href="https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json"
            target="_blank"
            referrerPolicy="no-referrer"
            className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
            title="GOES Satellite X-Ray flux sensor irradiance feed"
          >
            GOES Solar Flare Feed ↗
          </a>
          <a
            href="https://services.swpc.noaa.gov/products/alerts.json"
            target="_blank"
            referrerPolicy="no-referrer"
            className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
            title="Official SWPC warning, summary and watch alerts catalog"
          >
            SWPC Space Alerts ↗
          </a>
        </div>
      </div>
    </div>
  );
}
