import React, { useState } from "react";
import { SpaceAlert, SpaceAlert as AlertType } from "../types";
import { Bell, ShieldAlert, AlertTriangle, Info, ArrowDown, HelpCircle, Activity, Satellite } from "lucide-react";

interface EventsFeedProps {
  alerts: SpaceAlert[];
  donkiEvents: any[];
}

export default function EventsFeed({ alerts, donkiEvents }: EventsFeedProps) {
  const [filter, setFilter] = useState<"all" | "critical" | "warning">("all");
  const [selectedDonkiId, setSelectedDonkiId] = useState<string | null>("FLR-2026-X21");

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "all") return true;
    return a.severity === filter;
  });

  return (
    <div id="events-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT PANEL: NOAA WATCHES & ALERTS STREAM */}
      <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] rounded p-5 shadow flex flex-col h-[520px]">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#ec4899]/15 text-pink-400">
              <Bell className="w-4 h-4" />
            </span>
            <h2 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">NOAA Alert Bulletin</h2>
          </div>
          
          {/* Alerts Filter tags */}
          <div className="flex gap-1 bg-[#090A0C] border border-[#1E293B] p-0.5 rounded text-[10px] font-mono text-slate-500">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-1 rounded transition-all cursor-pointer font-bold ${filter === "all" ? "bg-slate-800 text-white" : "hover:text-slate-300"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("critical")}
              className={`px-2 py-1 rounded transition-all cursor-pointer font-bold ${filter === "critical" ? "bg-orange-600/20 text-orange-400 border border-orange-500/30" : "hover:text-slate-300"}`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter("warning")}
              className={`px-2 py-1 rounded transition-all cursor-pointer font-bold ${filter === "warning" ? "bg-amber-600/20 text-amber-400 border border-amber-500/30" : "hover:text-slate-300"}`}
            >
              Warning
            </button>
          </div>
        </div>

        {/* Scrollable Alerts feed */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-sans">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Info className="w-6 h-6 text-slate-700 mb-2" />
              <p className="font-mono text-xs uppercase">No active bulletins match query.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              let alertIcon = <Info className="w-4 h-4 text-sky-400" />;
              let alertBg = "bg-[#090A0C] border-l-2 border-sky-500 border-[#1E293B]";
              let titleColor = "text-sky-300";
 
              if (alert.severity === "critical") {
                alertIcon = <ShieldAlert className="w-4 h-4 text-orange-400" />;
                alertBg = "bg-[#090A0C] border-l-2 border-orange-500 border-[#1E293B]";
                titleColor = "text-orange-400";
              } else if (alert.severity === "warning") {
                alertIcon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
                alertBg = "bg-[#090A0C] border-l-2 border-amber-500 border-[#1E293B]";
                titleColor = "text-amber-300";
              }

              return (
                <div
                  key={alert.id}
                  className={`border rounded p-3 transition-all duration-200 flex gap-3 ${alertBg}`}
                >
                  <div className="mt-0.5 shrink-0">{alertIcon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-mono font-bold leading-tight text-xs uppercase tracking-wide ${titleColor}`}>
                        {alert.title}
                      </h4>
                      {alert.scaleLevel && (
                        <span className="px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-[#090A0C] text-slate-400 border border-[#1E293B]">
                          {alert.scaleLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 leading-relaxed mb-2 text-[11px]">
                      {alert.message}
                    </p>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono uppercase">
                      <span>DECODER: {alert.instrument}</span>
                      <span>
                        {new Date(alert.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                        })}{" "}
                        UTC
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: SCIENTIFIC CAUSAL RELATIONSHIPS (NASA DONKI MAPPER) */}
      <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] rounded p-5 shadow flex flex-col h-[520px]">
        <div className="border-b border-[#1E293B] pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#8b5cf6]/15 text-purple-400">
              <Satellite className="w-4 h-4" />
            </span>
            <h2 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">CME Causality (NASA DONKI Mappings)</h2>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-[#1E293B]">
            HELIOSPHERE LINKAGE MODEL
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mb-4 leading-relaxed font-sans">
          Solar eruptions cascade dynamically across the heliosphere. Examine observation logs on spacecraft instruments tracking the disturbance:
        </p>

        {/* Dynamic Interactive Flow Visualizer */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch overflow-hidden font-mono text-xs">
          {/* Causal steps list */}
          <div className="md:col-span-6 flex flex-col justify-between py-1 my-auto space-y-1 relative">
            
            {/* Visual alignment line drawn behind connectors on desktop */}
            <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-[#1E293B] hidden md:block z-0" />

            {donkiEvents.map((evt, idx) => {
              const isSelected = selectedDonkiId === evt.id;
              
              // Colors based on event sequence
              let bulletColor = "bg-[#475569] border-[#1E293B]";
              let activeOutline = "border-[#1E293B]";
              let fontColorStr = "text-slate-400";

              if (isSelected) {
                fontColorStr = "text-orange-400";
                if (idx === 0) bulletColor = "bg-rose-500 border-rose-400 ring-4 ring-rose-500/10";
                if (idx === 1) bulletColor = "bg-orange-500 border-orange-400 ring-4 ring-orange-100/10";
                if (idx === 2) bulletColor = "bg-amber-500 border-amber-400 ring-4 ring-amber-100/10";
                if (idx === 3) bulletColor = "bg-violet-500 border-violet-400 ring-4 ring-violet-100/10";
                activeOutline = "border-orange-500 bg-[#090A0C]";
              }

              return (
                <button
                  key={evt.id}
                  onClick={() => setSelectedDonkiId(evt.id)}
                  className={`text-left w-full py-2 px-3 border rounded flex items-center gap-3 transition-all duration-200 cursor-pointer relative z-10 ${
                    isSelected ? activeOutline : "border-[#1E293B] bg-[#090A0C]/40 hover:border-slate-700 hover:bg-[#090A0C]/70"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border shrink-0 transition-all ${bulletColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[9px] font-bold font-mono tracking-wide uppercase leading-none ${
                      isSelected ? "text-orange-400" : "text-slate-500"
                    }`}>
                      Stage {idx + 1}: {evt.type}
                    </p>
                    <h5 className={`text-xs font-bold truncate mt-1 ${isSelected ? "text-slate-100 font-mono" : "text-slate-300 font-mono"}`}>
                      {evt.id}
                    </h5>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Details Inspector Panel for Selected Event */}
          <div className="md:col-span-6 bg-[#090A0C] border border-[#1E293B] rounded p-4 flex flex-col justify-between overflow-y-auto">
            {selectedDonkiId ? (
              (() => {
                const selected = donkiEvents.find((e) => e.id === selectedDonkiId);
                if (!selected) return null;

                return (
                  <div className="text-xs flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 mb-3 font-mono">
                        <span className="text-[9px] uppercase font-mono font-bold text-orange-400 tracking-wider">
                          OBSERVATION LOG
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(selected.time).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-slate-100 mb-2 font-mono uppercase tracking-wide">{selected.type} RECORD</h4>
                      <p className="text-[#D1D5DB] leading-relaxed mb-3 text-[11px] font-sans">
                        {selected.details}
                      </p>

                      <div className="space-y-2 text-[11px] bg-[#0F172A] p-2.5 rounded border border-[#1E293B] font-mono">
                        <div>
                          <span className="text-slate-500 block text-[9px] font-bold uppercase">MONITORING INSTRUMENT:</span>
                          <span className="font-mono text-orange-400 font-semibold text-[10px]">{selected.instruments}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] font-bold uppercase">EARTHSIDE IMPACTS & EFFECTS:</span>
                          <span className="text-amber-400 font-sans text-xs leading-normal block mt-0.5">{selected.effects}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1E293B] text-[9px] text-slate-500 leading-relaxed flex flex-wrap justify-between items-center gap-2 uppercase font-mono">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span>
                          Cross-referenced from Live Space Catalogs.
                        </span>
                      </div>
                      <a
                        href="https://donki.gsfc.nasa.gov/"
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1 text-[9px]"
                      >
                        NASA DONKI Official Database ↗
                      </a>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                <p className="font-mono text-center uppercase text-[10px]">Click any event stage on the left to examine space observations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
