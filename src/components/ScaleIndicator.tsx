import React from "react";
import { SpaceWeatherScale } from "../types";
import { ShieldAlert, Zap, Globe, ShieldCheck } from "lucide-react";

interface ScaleIndicatorProps {
  scales: SpaceWeatherScale[];
}

export default function ScaleIndicator({ scales }: ScaleIndicatorProps) {
  return (
    <div id="scales-container" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {scales.map((s, index) => {
        // Icon and Colors by scale type
        let IconComponent = Zap;
        let colorTheme = "emerald";
        let titleBg = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
        let activeBorder = "border-emerald-500/30 ring-1 ring-emerald-500/20";

        if (s.scale === "G") {
          IconComponent = ShieldAlert;
          colorTheme = s.level > 0 ? "rose" : "emerald";
          titleBg = s.level > 0
            ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
          activeBorder = s.level > 0 ? "border-rose-500/40 ring-1 ring-rose-500/30 shadow-lg shadow-rose-950/20" : "border-slate-800";
        } else if (s.scale === "S") {
          IconComponent = Zap;
          colorTheme = s.level > 0 ? "amber" : "emerald";
          titleBg = s.level > 0
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
          activeBorder = s.level > 0 ? "border-amber-500/40 ring-1 ring-amber-500/30 shadow-lg shadow-amber-950/20" : "border-slate-800";
        } else if (s.scale === "R") {
          IconComponent = Globe;
          colorTheme = s.level > 0 ? "pink" : "emerald";
          titleBg = s.level > 0
            ? "bg-pink-500/10 border-pink-500/20 text-pink-400"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
          activeBorder = s.level > 0 ? "border-pink-500/40 ring-1 ring-pink-500/30 shadow-lg shadow-pink-950/20" : "border-slate-800";
        }

        const isStorming = s.level > 0;

        return (
          <div
            key={index}
            id={`scale-card-${s.scale.toLowerCase()}`}
            className={`bg-[#090A0C] border border-[#1E293B] rounded p-4.5 transition-all duration-300 relative overflow-hidden ${
              isStorming
                ? s.scale === "G"
                  ? "border-orange-500/50 shadow-md shadow-orange-950/10"
                  : s.scale === "S"
                  ? "border-amber-500/50 shadow-md shadow-amber-950/10"
                  : "border-pink-500/50 shadow-md shadow-pink-950/10"
                : "border-[#1E293B]"
            }`}
          >
            {/* Dynamic visual aura on storm states */}
            {isStorming && s.scale === "G" && (
              <div className="absolute -right-12 -top-12 w-28 h-28 bg-orange-500/5 rounded-full blur-2xl" />
            )}
            {isStorming && s.scale === "S" && (
              <div className="absolute -right-12 -top-12 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl" />
            )}
            {isStorming && s.scale === "R" && (
              <div className="absolute -right-12 -top-12 w-28 h-28 bg-pink-500/5 rounded-full blur-2xl" />
            )}

            {/* Header / Active level Indicator */}
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border rounded ${titleBg}`}>
                <IconComponent className="w-3 h-3" />
                {s.scale} - Scale
              </span>
              
              <div className="text-right">
                <span className={`text-xl font-bold font-mono tracking-wider ${
                  !isStorming ? "text-slate-400" :
                  s.scale === "G" ? "text-orange-400 animate-pulse" :
                  s.scale === "S" ? "text-amber-400 animate-pulse" : "text-pink-400 animate-pulse"
                }`}>
                  {isStorming ? `${s.scale}${s.level}` : "0"}
                </span>
                <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-widest font-semibold">Active Index</span>
              </div>
            </div>

            {/* Label and description */}
            <h3 className="text-xs font-bold text-slate-100 tracking-wider font-mono">
              {s.label}
              {!isStorming && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline-block shrink-0 ml-1" />
              )}
            </h3>
            
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed h-11 overflow-hidden font-sans">
              {s.description}
            </p>

            {/* Scale physical measurements readout */}
            <div className="bg-[#0F172A] border border-[#1E293B] rounded p-2.5 my-3">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500 font-semibold uppercase">READOUT//:</span>
                <span className="text-slate-300 font-bold">{s.valueText}</span>
              </div>
            </div>

            {/* Pedagogical impacts list */}
            <div>
              <p className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-1.5 font-bold">POTENTIAL SYSTEM IMPACTS:</p>
              <ul className="space-y-1">
                {s.impacts.map((imp, idx) => (
                  <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
                    <span className={`w-1 h-1 rounded-full shrink-0 mt-1.5 ${
                      !isStorming ? "bg-emerald-500" :
                      s.scale === "G" ? "bg-orange-500" :
                      s.scale === "S" ? "bg-amber-500" : "bg-pink-500"
                    }`} />
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
