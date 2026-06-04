import React, { useState } from "react";
import { Sunrise, Radio, Info, Eye, Compass } from "lucide-react";

interface WavelengthConfig {
  id: string;
  name: string;
  colorName: string;
  amberHex: string;
  neonColor: string;
  temp: string;
  instrument: string;
  isolates: string;
  svgColor: string;
  svgBlastColor: string;
  isStormy: boolean;
  scientificImpact: string;
}

export default function SolarDiskVisualizer() {
  const [selectedWavelength, setSelectedWavelength] = useState<string>("171");

  const wavelengths: WavelengthConfig[] = [
    {
      id: "131",
      name: "131 Å (Teal-Cyan)",
      colorName: "Teal",
      amberHex: "#06b6d4",
      neonColor: "shadow-[0_0_55px_-5px_rgba(6,182,212,0.65)]",
      temp: "10,000,000 K",
      instrument: "SDO AIA 131 channel",
      isolates: "Extreme Flaring Coronal Plasma",
      svgColor: "#0f3a47",
      svgBlastColor: "#06b6d4",
      isStormy: true,
      scientificImpact: "Isolates extremely hot material present in solar flares. When a major flare erupts, active regions glow in intense teal/blue, giving forecasters instant notification of a potential ionospheric radio blackout."
    },
    {
      id: "171",
      name: "171 Å (Amber-Gold)",
      colorName: "Gold",
      amberHex: "#eab308",
      neonColor: "shadow-[0_0_55px_-5px_rgba(234,179,8,0.55)]",
      temp: "1,000,000 K",
      instrument: "SDO AIA 171 channel",
      isolates: "Quiet Corona & Coronal Arches",
      svgColor: "#3d2a02",
      svgBlastColor: "#facc15",
      isStormy: false,
      scientificImpact: "Highlights the quiet solar corona and magnetic loops. It trace magnetic field arches snaking across the Sun's atmosphere, which store the magnetic tension that eventually snap into Coronal Mass Ejections."
    },
    {
      id: "193",
      name: "193 Å (Bronze)",
      colorName: "Bronze",
      amberHex: "#ca8a04",
      neonColor: "shadow-[0_0_55px_-5px_rgba(202,138,4,0.45)]",
      temp: "1,250,000 K",
      instrument: "SDO AIA 193 channel",
      isolates: "Active Corona & Coronal Holes",
      svgColor: "#2b1c01",
      svgBlastColor: "#fbbf24",
      isStormy: false,
      scientificImpact: "Highlights both the hot active outer corona and coronal holes—dark, low-density regions where magnetic field lines stretch straight out into space, launching high-speed solar wind gusts earthward."
    },
    {
      id: "304",
      name: "304 Å (Crimson Red)",
      colorName: "Crimson",
      amberHex: "#ef4444",
      neonColor: "shadow-[0_0_55px_-5px_rgba(239,68,68,0.65)]",
      temp: "50,000 K",
      instrument: "SDO AIA 304 channel",
      isolates: "Chromosphere Filaments & Prominences",
      svgColor: "#450a0a",
      svgBlastColor: "#f87171",
      isStormy: true,
      scientificImpact: "Observes the transition region chromatography and filaments. It visualizes giant cool plasma loops (prominences) suspended on magnetic threads. If these snap, they blast billions of tons of CME plasma into space."
    }
  ];

  const current = wavelengths.find((w) => w.id === selectedWavelength) || wavelengths[1];

  return (
    <div id="solar-disk-panel" className="bg-[#0F172A] border border-[#1E293B] rounded p-5 shadow-lg flex flex-col xl:flex-row gap-5 items-stretch w-full">
      {/* LEFT: SDO SOLAR CONSOLE VISUALIZATION */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#090A0C] rounded border border-[#1E293B] relative overflow-hidden h-[360px] xl:h-auto min-h-[340px]">
        
        {/* Dynamic Glowing Sun Canvas */}
        <div className={`w-44 h-44 rounded-full transition-all duration-700 relative flex items-center justify-center ${current.neonColor}`} style={{ backgroundColor: current.svgColor }}>
          <span className="text-[10px] text-slate-500/30 uppercase tracking-widest font-mono select-none">SDO SENSOR</span>
          
          {/* Scientific Sunspots & Solar flares features */}
          <svg className="absolute inset-0 w-full h-full rounded-full animate-pulse opacity-85" viewBox="0 0 100 100" style={{ animationDuration: "3s" }}>
            {/* Active Sunspot group 1 (North) */}
            <circle cx="35" cy="40" r="2.5" fill="#111" opacity="0.7" />
            <circle cx="35" cy="40" r="4" fill="none" stroke={current.svgBlastColor} strokeWidth="1" strokeDasharray="1 1" />
            
            {/* Active Region 3697 Flares glowing under extreme configurations */}
            {current.id === "131" ? (
              <>
                <circle cx="65" cy="60" r="6" fill={current.svgBlastColor} opacity="0.4" className="animate-ping" style={{ animationDuration: "1.5s" }} />
                <polygon points="65,52 68,58 74,60 68,62 65,68 62,62 56,60 62,58" fill={current.svgBlastColor} />
                <circle cx="65" cy="60" r="1.5" fill="#ffffff" />
              </>
            ) : current.id === "304" ? (
              <>
                {/* Massive Suspended Prominence loop spilling off the solar edge */}
                <path d="M 85,35 Q 110,25 90,55" fill="none" stroke={current.svgBlastColor} strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
                <circle cx="45" cy="55" r="5" fill={current.svgBlastColor} opacity="0.2" />
                <path d="M 38,55 Q 45,63 52,55" fill="none" stroke={current.svgBlastColor} strokeWidth="1" />
              </>
            ) : current.id === "193" ? (
              <>
                {/* Large dark coronal hole wind tunnel */}
                <path d="M 20,50 Q 15,25 45,30 Q 35,42 20,50" fill="#020617" opacity="0.8" />
                <path d="M 20,50 Q 15,25 45,30 Q 35,42 20,50" fill="none" stroke={current.svgBlastColor} strokeWidth="0.8" />
              </>
            ) : (
              <>
                {/* Coronal arches loop structures connecting active poles */}
                <path d="M 45,38 Q 50,28 55,38" fill="none" stroke={current.svgBlastColor} strokeWidth="0.8" opacity="0.7" />
                <path d="M 40,40 Q 50,23 60,40" fill="none" stroke={current.svgBlastColor} strokeWidth="0.8" opacity="0.5" />
                <circle cx="65" cy="60" r="3" fill={current.svgBlastColor} opacity="0.3" />
              </>
            )}
          </svg>
        </div>

        {/* Console Overlays */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <Eye className="w-3.5 h-3.5 text-orange-400" />
          <span>SDO SPECTROGRAPH SENSOR</span>
        </div>

        <div className="absolute bottom-4 right-4 text-right">
          <span className="text-[10px] font-mono block text-slate-500 uppercase tracking-widest leading-none">BANDWIDTH</span>
          <span className="text-sm font-bold font-mono tracking-tight" style={{ color: current.amberHex }}>
            AIA {current.id} Å
          </span>
        </div>

        <div className="absolute bottom-4 left-4 text-[10px] bg-[#090A0C] py-1.5 px-2.5 rounded border border-[#1E293B] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: current.amberHex }} />
          <span className="font-mono text-slate-400 font-semibold">{current.temp}</span>
        </div>
      </div>

      {/* RIGHT: CONTROL BUTTONS AND SCIENTIFIC STUDY DESCRIPTIONS */}
      <div className="xl:w-80 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sunrise className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">SDO Spectrograph</h3>
          </div>
          
          <p className="text-[11px] text-slate-400 mb-3.5 leading-relaxed font-sans">
            NASA's SDO spacecraft monitors the solar corona. Isolate layers of scientific helio-physics:
          </p>

          {/* Wavelength Grid select tags */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {wavelengths.map((w) => {
              const isActive = w.id === selectedWavelength;
              return (
                <button
                  key={w.id}
                  id={`wl-btn-${w.id}`}
                  onClick={() => setSelectedWavelength(w.id)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded border text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-orange-500 text-white bg-slate-800 shadow"
                      : "border-[#1E293B] text-slate-400 bg-[#090A0C] hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: w.amberHex }} />
                    <span className="font-mono">{w.id} Å</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block font-normal leading-normal mt-0.5">{w.isolates.split(" & ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Description details box */}
        <div className="bg-[#090A0C] border border-[#1E293B] rounded p-3 text-[11px] flex-1 flex flex-col justify-between mt-1">
          <div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-b border-[#1E293B] pb-2 mb-2">
              <span>Channel: {current.instrument}</span>
              <span>Temp: {current.temp}</span>
            </div>
            
            <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5 font-mono uppercase tracking-wide">
              <Compass className="w-3.5 h-3.5 text-orange-400" />
              {current.isolates}
            </h4>
            
            <p className="text-slate-300 leading-relaxed font-sans">
              {current.scientificImpact}
            </p>
          </div>

          <div className="mt-3.5 flex items-center gap-1 bg-[#090A0C] p-2 rounded border border-[#1E293B] text-[9px] text-slate-500 font-mono uppercase">
            <Radio className="w-3.5 h-3.5 text-orange-400 animate-pulse shrink-0" />
            <span>Telemetry: SDO SPECTRAL SYNC ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
