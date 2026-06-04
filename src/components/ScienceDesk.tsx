import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, ScienceConcept } from "../types";
import { BookOpen, Send, GraduationCap, LayoutList, MessageSquareCode, HelpCircle, ArrowRight, Compass } from "lucide-react";

interface ScienceDeskProps {
  currentTelemetry: any;
  activeScaleText: {
    gScaleText: string;
    sScaleText: string;
    rScaleText: string;
  };
  activeAlertsCount: number;
  mode: string;
}

export default function ScienceDesk({
  currentTelemetry,
  activeScaleText,
  activeAlertsCount,
  mode,
}: ScienceDeskProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "Greetings, Commander or Educator! I am Helios-9, your expert analyst in solar physics and heliophysics telemetry. Ask me any scientific question about solar wind, CME shockwaves, geomagnetic indices, or coronal hole active structures!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeArticle, setActiveArticle] = useState<string>("solar-cycle");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle message send to backend Gemini proxy
  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || inputText;
    if (!rawText.trim()) return;

    if (!textToSend) setInputText("");

    const newMsg: ChatMessage = {
      sender: "user",
      text: rawText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      // Package instrument reading state for server prompt grounding
      const activeState = currentTelemetry
        ? {
            mode,
            speed: currentTelemetry.speed,
            density: currentTelemetry.density,
            temperature: currentTelemetry.temperature,
            bz: currentTelemetry.bz,
            bt: currentTelemetry.bt,
            gScaleText: activeScaleText.gScaleText,
            sScaleText: activeScaleText.sScaleText,
            rScaleText: activeScaleText.rScaleText,
            activeAlertsCount,
          }
        : null;

      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newMsg],
          activeState,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Server error");

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: result.text,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `[Analyst Connection Interrupted]: We could not reach Helios-9. Error: ${e.message || "Failed to reach backend."}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Click suggestions for quick learning promptings
  const chatQueries = [
    { label: "What is Southward Bz orientation and why does it matter?", q: "Explain southward Bz magnetic field orientation and why it's critical for aurora triggers?" },
    { label: "What are the effects of a G4 (Severe) storm on the power grid?", q: "What are geomagnetically induced ground currents (GIC) and how do G4 solar storms impact power transformers?" },
    { label: "How do Ace and DSCOVR satellites protect Earth at L1?", q: "What is the L1 Lagrange point, and what instrumentation do ACE and DSCOVR use to warn Earth?" },
  ];

  // Pedagogical Articles & lesson plans
  const lessonPlans = [
    {
      title: "AM Radio Ionospheric Station",
      grade: "Middle-High School (Grades 6-12)",
      concept: "How solar flares ionize the Earth's ionosphere, absorbing High-Frequency waves.",
      activity: "Students log static noise on AM Radio frequencies during daytime hours and record corresponding NOAA GOES Solar Flare X-ray alert events."
    },
    {
      title: "Soda Bottle Magnetometer",
      grade: "Upper Elementary-Middle (Grades 4-9)",
      concept: "Using basic magnetism to track localized earth magnetotail fluctuations during storms.",
      activity: "Students construct a high-sensitivity suspended magnetic needle assembly in a plastic soda bottle with a laser pointer to track micro-refractions caused by coronal mass ejections."
    },
    {
      title: "Aurora Visibility Altitude Map",
      grade: "K-5 Elementary Science",
      concept: "How solar particles strike atomic nitrogen and oxygen, glowing green and red.",
      activity: "A hands-on coloring lab coloring chemical emission zones at various atmospheric levels (Oxygen at 150km, Nitrogen at 80km)."
    }
  ];

  const scienceArticles = [
    {
      id: "solar-cycle",
      title: "The 11-Year Solar Cycle",
      summary: "Understand sunspot magnetism and why solar storms peak during solar maximum.",
      content: `The Sun undergoes a periodic cycle of magnetic activity known as the Solar Cycle. Approximately every 11 years, the Sun's magnetic poles completely flip: the north pole becomes the south pole, and vice versa.

During Solar Minimum, very few sunspots are visible on the solar disk. However, as the cycle advances towards Solar Maximum, complex, tangled magnetic fields burst through the photosphere, forming "Active Regions" or **sunspots**.

Active Regions store immense concentrations of magnetic tension. When magnetic lines twist beyond their limits, they snap and reconnect explosively, launching:
1. **Solar Flares**: Intensive bursts of electromagnetic radiation (mostly X-rays/Ultraviolet) traveling at light speed.
2. **Coronal Mass Ejections (CMEs)**: Massive bubbles of superheated plasma (billions of tons of protons and electrons) bound by powerful magnetic lines, hurtling through the solar wind.

The current high activity peaks observed represent the active maximum of Solar Cycle 25. Tracking these regions is key for spacecraft safety.`
    },
    {
      id: "bz-physics",
      title: "Southward Bz: The Magnetic Key",
      summary: "Explore why solar winds only break through Earth's magnetic shield on negative Bz values.",
      content: `Earth is protected from the hostile solar vacuum by a planetary magnetic cocoon called the **Magnetosphere**. The Interplanetary Magnetic Field (IMF) carried by the solar wind possesses three alignment coordinates: Bx, By, and Bz.

The **Bz Coordinate** aligns with Earth's geographic north-south pole configuration:
- **Positive Bz (Northward)**: The IMF aligns in the same direction as Earth's lines. The magnetic field behaves like similar poles of a magnet—it repulels and deflects the incoming solar wind, keeping the magnetosphere sealed.
- **Negative Bz (Southward)**: The IMF aligns anti-parallel (opposite) to Earth's lines. Opposite magnetic components instantly merge in a process called **Magnetic Reconnection**.

This reconnection opens a physical rift at Earth's cusp, letting high-energy solar wind streams pour directly into our inner ionosphere. This coupling is the primary engine behind severe geomagnetic storms and widespread auroral curtains.`
    },
    {
      id: "carrington",
      title: "The 1859 Carrington Event",
      summary: "Comparing historic benchmarks to look at potential modern solar-storm grid impacts.",
      content: `In September 1859, British astronomer Richard Carrington observed a brilliant white-light solar flare on the photosphere. Approximately 17 hours later, the largest recorded geomagnetic storm in human history struck Earth.

The impact was so severe that:
- Widespread auroras were visible as far south as Hawaii, Colombia, and Sub-Saharan Africa. The lights were so bright that gold miners in the Rocky Mountains woke up and prepared breakfast, thinking it was dawn.
- Global telegraph networks failed completely. Sparks jumped from equipment, and operators received shocks. Remarkably, some telegraph terminals continued sending messages even with their power cells disconnected, powered purely by the magnetic storm induced in the copper lines!

If a Carrington-class storm struck today's hyper-electrified society:
Induced ground currents could instantly overload and melt hyper-critical, multi-million-dollar high-voltage transformers worldwide. Replacing these localized sub-stations would take months, leading to prolonged continental blockouts, showcasing why NOAA's L1 real-time telemetry forewarning is a major critical defense.`
    }
  ];

  const currentArticle = scienceArticles.find(a => a.id === activeArticle);

  return (
    <div id="classroom-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* LEFT: AI HELIOS-9 FORECASTER CLASSROOM CHAT */}
      <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] rounded p-5 shadow flex flex-col h-[580px]">
        <div className="border-b border-[#1E293B] pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#2563eb]/15 text-orange-400">
              <MessageSquareCode className="w-4 h-4" />
            </span>
            <h2 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Heliophysics AI Specialist</h2>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-[#1E293B] text-slate-400">
            Helios-9 Expert Bot
          </span>
        </div>

        {/* Scrollable messages bubble chat stream */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4 font-mono">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] text-xs leading-relaxed ${
                m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <span className="text-[9px] text-slate-500 font-mono mb-1 capitalize">
                {m.sender === "user" ? "YOU" : "HELIOS-9 SPECIALIST"}
              </span>
              <div
                className={`p-3.5 rounded border text-slate-200 whitespace-pre-wrap ${
                  m.sender === "user"
                    ? "bg-[#090A0C] border-orange-500/40 text-orange-200"
                    : "bg-[#090A0C] border-[#1E293B] text-slate-200 font-sans"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="mr-auto text-[10px] text-slate-400 flex items-center gap-2 font-mono bg-[#090A0C] p-2.5 rounded border border-[#1E293B] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
              Sensor calculations in progress...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick query Suggestions pill chips */}
        <div className="space-y-1.5 mb-3">
          <span className="text-[9px] uppercase font-mono tracking-widest font-bold text-slate-500 block">CLASSROOM STUDY PATHS:</span>
          <div className="flex flex-wrap gap-1.5">
            {chatQueries.map((chip, idx) => (
              <button
                key={idx}
                id={`chip-${idx}`}
                onClick={() => handleSendMessage(chip.q)}
                className="text-[10px] font-mono font-bold text-slate-300 bg-[#090A0C] border border-[#1E293B] hover:border-orange-500 rounded px-2.5 py-1 text-left transition-all leading-tight cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="flex gap-2">
          <input
            id="chat-input-box"
            type="text"
            placeholder="Ask Helios-9: E.g., solar wind impact on spacecraft..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-[#090A0C] border border-[#1E293B] hover:border-slate-600 focus:border-orange-500 rounded px-3.5 py-2 text-xs text-slate-100 outline-none transition-all placeholder:text-slate-600 font-sans"
          />
          <button
            id="btn-send-message"
            onClick={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-[#1E293B] text-white rounded shadow transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-orange-400" />
          </button>
        </div>
      </div>

      {/* RIGHT: HANDS-ON K-12 LESSON PLANS & KNOWLEDGE ARTICLE SUITE */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        
        {/* K-12 CLASSROOM EDUCATOR LABS */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded p-5 shadow flex flex-col h-[280px]">
          <div className="border-b border-[#1E293B] pb-2 mb-3 flex items-center gap-2">
            <span className="p-1 rounded bg-[#2563eb]/15 text-orange-400">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div className="flex-1">
              <h2 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Heliophysics Instructor Labs</h2>
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-semibold mt-0.5 block">SWOP Printable Activities for K-12</span>
            </div>
          </div>

          {/* Scollable hands-on activites list */}
          <div className="flex-1 overflow-y-auto space-y-3.5 text-xs font-sans">
            {lessonPlans.map((plan, idx) => (
              <div key={idx} className="bg-[#090A0C] border border-[#1E293B] rounded p-3 hover:border-slate-650 transition-all">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h4 className="font-bold text-slate-200">{plan.title}</h4>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-slate-800 text-slate-400 border border-[#1E293B] uppercase">
                    {plan.grade}
                  </span>
                </div>
                <p className="text-slate-400 leading-normal mb-1.5 text-[11px]">
                  <strong className="text-slate-300 font-mono text-[9px] uppercase tracking-wide">Target Core Concept:</strong> {plan.concept}
                </p>
                <div className="text-[#a5b4fc] text-[11px] leading-relaxed italic bg-slate-800/40 px-2 py-1.5 rounded border border-[#1E293B]/65">
                  <strong className="not-italic text-slate-300 font-mono text-[9px] uppercase tracking-wider block mb-1">EDUCATOR RUN-LAB:</strong> {plan.activity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCIENTIFIC ARTICLES ENCYCLOPEDIA */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded p-5 shadow flex flex-col h-[276px]">
          <div className="border-b border-[#1E293B] pb-2 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#2563eb]/15 text-[#818cf8]">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Heliophysics Library</h2>
            </div>
            
            {/* Articles Picker navigation */}
            <div className="flex bg-[#090A0C] border border-[#1E293B] p-0.5 rounded text-[9px] font-mono text-slate-500 uppercase">
              <button
                onClick={() => setActiveArticle("solar-cycle")}
                className={`px-2 py-1 rounded transition-all cursor-pointer font-bold ${activeArticle === "solar-cycle" ? "bg-slate-800 text-white" : "hover:text-slate-300"}`}
              >
                Solar Cycle
              </button>
              <button
                onClick={() => setActiveArticle("bz-physics")}
                className={`px-2 py-1 rounded transition-all cursor-pointer font-bold ${activeArticle === "bz-physics" ? "bg-slate-800 text-white" : "hover:text-slate-300"}`}
              >
                Bz Reconnection
              </button>
              <button
                onClick={() => setActiveArticle("carrington")}
                className={`px-2 py-1 rounded transition-all cursor-pointer font-bold ${activeArticle === "carrington" ? "bg-slate-800 text-white" : "hover:text-slate-300"}`}
              >
                Carrington Event
              </button>
            </div>
          </div>

          {/* Active Article Content */}
          {currentArticle && (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto text-xs">
              <div className="space-y-2 pr-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 h-auto font-mono uppercase tracking-wide">
                  <Compass className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  {currentArticle.title}
                </h4>
                <p className="text-slate-400 font-semibold italic h-auto text-[11px] font-sans">
                  {currentArticle.summary}
                </p>
                <div className="text-slate-300 leading-relaxed font-sans text-[11px] whitespace-pre-line mt-3 border-t border-[#1E293B] pt-3">
                  {currentArticle.content}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
