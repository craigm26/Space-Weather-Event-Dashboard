import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Initialize Gemini 3.5 Flash
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Gemini API initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY missing. AI chat assistance will run in mock demonstration mode.");
  }
} catch (e) {
  console.error("Failed to initialize Gemini SDK:", e);
}

// ============================================================================
// HIGH-FIDELITY HISTORICAL RECONSTRUCTION DATASET: Severe CME Storm of June 2026
// ============================================================================
// Simulates the chronologically accurate telemetry of a major space weather event
// Phase 1 (00:00 to 08:00): Quiet baseline
// Phase 2 (08:00 to 12:00): Major X-class Flare eruption (flux spikes, radio blackout)
// Phase 3 (12:00 to 17:00): CME transit and ACE EPAM proton sensor rise
// Phase 4 (17:30 onwards): CME shock front impact (Solar Wind speed peaks 920km/s, Bz drops to -26nT, G4 Geomagnetic Storm active)

// Helper to calculate realistic Kp index based on solar wind speed and Bz orientation
const calculateKp = (speed: number, bz: number): number => {
  let kp = 1 + Math.random() * 0.8;
  if (speed >= 800 && bz <= -20) kp = 8.2 + Math.random() * 0.8;
  else if (speed >= 650 && bz <= -12) kp = 6.5 + Math.random() * 1.5;
  else if (speed >= 500 && bz <= -6) kp = 4.5 + Math.random() * 1.5;
  else if (speed >= 430 && bz <= -2) kp = 3.0 + Math.random() * 1.2;
  else if (speed > 400 && bz < 0) kp = 2.0 + Math.random() * 1.0;
  return Math.max(0, Math.min(9, Math.round(kp * 10) / 10));
};

const generateStormSandboxData = () => {
  const data = [];
  const startTime = new Date("2026-05-31T00:00:00Z");
  const totalHours = 120; // 5 full days (120 hours) to go back at least 5 days from June 4

  const flareStartTime = new Date("2026-06-03T11:19:00Z").getTime();
  const flarePeakTime = new Date("2026-06-03T11:28:00Z").getTime();
  const eruptTime = new Date("2026-06-03T11:45:00Z").getTime();
  const impactTime = new Date("2026-06-04T17:35:00Z").getTime();

  // Proton storm event starting June 3 at 17:00 UTC
  const protonStartTime = new Date("2026-06-03T17:00:00Z").getTime();
  const protonPeakTime = new Date("2026-06-03T21:00:00Z").getTime();

  for (let i = 0; i <= totalHours * 12; i++) { // 12 points per hour (every 5 mins)
    const minutesElapsed = i * 5;
    const itemTime = new Date(startTime.getTime() + minutesElapsed * 60 * 1000);
    const timeMs = itemTime.getTime();

    let speed = 370 + Math.random() * 20; // km/s (quiet sun speed)
    let density = 4.0 + Math.random() * 0.8; // cm^-3
    let temperature = 70000 + Math.random() * 10000; // K
    let bx = 1 + Math.random() * 2;
    let bz = 1.5 + Math.random() * 1.5; // Positive of quiet sun (northward magnetic field)
    let xrayShort = 1e-8 + Math.random() * 4e-9;
    let xrayLong = 4e-8 + Math.random() * 8e-9; // quiet A class

    // Add some organic fluctuations on May 31 - June 2 (precursors)
    const day = itemTime.getUTCDate();
    if (day === 31 || day === 1 || day === 2) {
      // Gentle waves in speed and density
      const sineWave = Math.sin(timeMs / (4 * 60 * 60 * 1000));
      speed += sineWave * 15;
      density += Math.cos(timeMs / (6 * 60 * 60 * 1000)) * 0.5;
    }

    // Solar Flare (starts 11:19 peaks 11:28 on June 3)
    if (timeMs >= flareStartTime && timeMs < flarePeakTime) {
      // Rapid rise to X2.1 solar flare
      const progress = (timeMs - flareStartTime) / (9 * 60 * 1000); // 9 minutes rise
      xrayLong = 4e-8 + Math.pow(progress, 3) * 2.1e-4; // Watts/m^2 (class X2.1)
      xrayShort = 1e-8 + Math.pow(progress, 3) * 4.5e-5;
    } else if (timeMs >= flarePeakTime && timeMs < flarePeakTime + 4 * 60 * 60 * 1000) {
      // Slower exponential decay over 4 hours
      const decayProgress = (timeMs - flarePeakTime) / (4 * 60 * 60 * 1000);
      xrayLong = 2.1e-4 * Math.exp(-decayProgress * 5.0) + 4e-8;
      xrayShort = 4.5e-5 * Math.exp(-decayProgress * 5.0) + 1e-8;
    }

    // Proton radiation storm buildup starting June 3, 17:00 UTC
    if (timeMs >= protonStartTime && timeMs < impactTime) {
      if (timeMs < protonPeakTime) {
        // Rise phase
        const progress = (timeMs - protonStartTime) / (protonPeakTime - protonStartTime);
        density += progress * 16.0; // rises up to ~20.5 cm^-3
        temperature += progress * 40000;
      } else {
        // Decay/hold phase before the main compression shock front
        const decayProgress = (timeMs - protonPeakTime) / (impactTime - protonPeakTime);
        density += 16.0 * Math.exp(-decayProgress * 1.8); // decays down gradually
        temperature += 40000 * Math.exp(-decayProgress * 1.8);
      }
    }

    // Add a secondary smaller M-class flare on June 4th for realistic volatility
    const mFlareStart = new Date("2026-06-04T10:00:00Z").getTime();
    const mFlarePeak = new Date("2026-06-04T10:20:00Z").getTime();
    if (timeMs >= mFlareStart && timeMs < mFlarePeak) {
      const progress = (timeMs - mFlareStart) / (20 * 60 * 1000);
      xrayLong = 4e-8 + progress * 1.5e-5; // M1.5
      xrayShort = 1e-8 + progress * 3e-6;
    } else if (timeMs >= mFlarePeak && timeMs < mFlarePeak + 2 * 60 * 60 * 1000) {
      const decayProgress = (timeMs - mFlarePeak) / (2 * 60 * 60 * 1000);
      xrayLong = 1.5e-5 * Math.exp(-decayProgress * 4.0) + 4e-8;
      xrayShort = 3e-6 * Math.exp(-decayProgress * 4.0) + 1e-8;
    }

    // CME Shock impact phase (arrives at June 4, 17:35 UTC)
    if (timeMs >= impactTime) {
      const thirtyMins = 30 * 60 * 1000;
      if (timeMs < impactTime + thirtyMins) {
        // Shock front compression boundary (abrupt boundary over 30 mins)
        const progress = (timeMs - impactTime) / thirtyMins;
        speed = 390 + progress * 530; // abruptly spikes from ~390 to 920 km/s
        density = 8.0 + progress * 40.0; // spikes to 48 cm^-3
        temperature = 90000 + progress * 310000; // hot plasma!
        bx = 2 + progress * 15;
        bz = -1.5 - progress * 24.5; // Bz rotates extremely southwards to -26 nT!
      } else {
        // CME Main body of cloud (slow gradual decline but still highly severe)
        const decayHours = (timeMs - (impactTime + thirtyMins)) / (6 * 60 * 60 * 1000); // normalized over 6 hours
        speed = 920 - decayHours * 110 + Math.random() * 30;
        density = 48 - decayHours * 15 + Math.random() * 4;
        temperature = 400000 - decayHours * 120000 + Math.random() * 15000;
        bx = 17 - decayHours * 5 + Math.random() * 2;
        bz = -26 + decayHours * 10 + Math.random() * 3; // remains southwards
      }
    } else if (timeMs >= eruptTime && timeMs < impactTime) {
      // Transit phase (baseline slightly elevated before shock wave)
      const prep = (timeMs - eruptTime) / (impactTime - eruptTime);
      speed = 380 + prep * 20;
      if (timeMs < protonStartTime) {
        density = 4.2 + prep * 3.0;
      }
      bz = 1.5 - prep * 3.0; // turning slightly southward
    }

    // Calculate BT (total magnetic field strength)
    const bt = Math.sqrt(bx * bx + bz * bz + 4);
    const kp = calculateKp(speed, bz);

    data.push({
      time: itemTime.toISOString(),
      speed: Math.round(speed * 10) / 10,
      density: Math.round(density * 10) / 10,
      temperature: Math.round(temperature),
      bz: Math.round(bz * 10) / 10,
      bt: Math.round(bt * 10) / 10,
      xrayShort,
      xrayLong,
      kp,
    });
  }
  return data;
};

// Simulated causal event flow (NASA DONKI structured style)
const getDonkiEventFlow = () => {
  return [
    {
      id: "FLR-2026-X21",
      type: "Solar Flare",
      time: "2026-06-03T11:19:00Z",
      details: "Eruption of X2.1 Class Flare from Active Sunspot Region AR3697. Strongly impacted Earth's dayside ionosphere.",
      instruments: "GOES-16 SXI, AIA 131W",
      relatedTo: "CME-2026-0603-01",
      effects: "R3 Strong Radio Blackout registered over South America and Atlantic Ocean."
    },
    {
      id: "CME-2026-0603-01",
      type: "Coronal Mass Ejection",
      time: "2026-06-03T11:45:00Z",
      details: "Full-Halo CME erupted alongside the X2.1 flare. Initial radial speed calculated at 1450 km/s directed earthward.",
      instruments: "SOHO LASCO C2 & C3, STEREO-A",
      relatedTo: "GST-2026-0604-01",
      effects: "Earthbound propagation transit timeline modeled at ~30 hours by WSA-ENLIL solar wind model."
    },
    {
      id: "SEP-2026-0603-05",
      type: "Solar Energetic Particle Star Storm",
      time: "2026-06-03T17:00:00Z",
      details: "ACE EPAM and GOES SEISS register massive elevation in proton fluxes. High energy proton flux (>10 MeV) crossed 100 pfu threshold.",
      instruments: "ACE EPAM, GOES-18 SEISS",
      relatedTo: "CME-2026-0603-01",
      effects: "S2 Moderate Radiation Storm active. High altitude transpolar airline flights re-routed to avoid radiation hazard."
    },
    {
      id: "GST-2026-0604-01",
      type: "Geomagnetic Storm",
      time: "2026-06-04T17:35:00Z",
      details: "CME shock front impacted L1 monitoring satellites (DSCOVR/ACE). Severe compression of Earth's magnetotail. Bz dropped southward to -26 nT.",
      instruments: "DSCOVR Magnetometer, ACE SwePAM",
      relatedTo: "CME-2026-0603-01",
      effects: "G4 (Severe) Geomagnetic Storm triggered. Active G4 Warnings issued worldwide. Auroras visible down to Alabama and Northern Spain."
    }
  ];
};

const getHistoricalAlerts = () => {
  return [
    {
      id: "ALT-001",
      timestamp: "2026-06-03T11:28:00Z",
      type: "flare",
      title: "SUMX01: Solar Flare Warning - Class X2.1 Detected",
      message: "GOES X-Ray sensor registered X2.1 class solar eruption beginning 11:19 UTC. Peak reached at 11:28 UTC. Event registered over active sunspot region AR3697.",
      severity: "critical",
      scaleLevel: "R3",
      instrument: "GOES-16 SXI"
    },
    {
      id: "ALT-002",
      timestamp: "2026-06-03T17:30:00Z",
      type: "proton",
      title: "SEP02: Solar Radiation Warning - S2 Active",
      message: "Proton Flux levels >10 MeV exceeded 100 pfu threshold at 17:00 UTC. Solar Radiation Storm active at S2 severity level. Re-routing recommended for polar-route flights.",
      severity: "warning",
      scaleLevel: "S2",
      instrument: "GOES-18 SEISS"
    },
    {
      id: "ALT-003",
      timestamp: "2026-06-04T12:00:00Z",
      type: "storm",
      title: "WATA50: Geomagnetic Storm WATCH - G3 or Higher Predicted",
      message: "WSA-ENLIL radial predictions indicate CME cloud arrival 17:00-19:00 UTC. Geomagnetic conditions expected to spike to G3/G4 levels. Grid operators advised to monitor neutral ground currents.",
      severity: "warning",
      scaleLevel: "G3-WATCH",
      instrument: "WSA-ENLIL Model"
    },
    {
      id: "ALT-004",
      timestamp: "2026-06-04T17:36:00Z",
      type: "storm",
      title: "WARK04: G4 Geomagnetic Storm WARNING - Active CME Arrival",
      message: "L1 DSCOVR space data confirms speed jump from 410 km/s to 920 km/s. Bz magnetic component flipped extremely southwards (-26 nT). Planetary K-index estimated G4 levels (Kp 8.3).",
      severity: "critical",
      scaleLevel: "G4",
      instrument: "DSCOVR Satellites"
    }
  ];
};

// ============================================================================
// NOAA REALTIME API FETCHERS & PARSERS WITH GENTLE PRE-BAKED NORMAL FALLBACKS
// ============================================================================

async function fetchNoaaData(url: string) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 3500); // Fail fast (3.5s timeout)
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Helper to parse NOAA JSON format (Array of Arrays)
function parseNoaaTelemetry(plasmaRaw: any, magRaw: any, xrayRaw: any): any[] {
  if (!plasmaRaw || !Array.isArray(plasmaRaw) || plasmaRaw.length < 2) return [];
  if (!magRaw || !Array.isArray(magRaw) || magRaw.length < 2) return [];

  const headersPlasma = plasmaRaw[0];
  const dataPlasma = plasmaRaw.slice(1);

  const headersMag = magRaw[0];
  const dataMag = magRaw.slice(1);

  // Index mapping
  const timeIdxP = headersPlasma.indexOf("time_tag");
  const speedIdx = headersPlasma.indexOf("speed");
  const densityIdx = headersPlasma.indexOf("density");
  const tempIdx = headersPlasma.indexOf("temperature");

  const timeIdxM = headersMag.indexOf("time_tag");
  const bzIdx = headersMag.indexOf("bz");
  const btIdx = headersMag.indexOf("bt");

  const finalTelemetryMap = new Map();

  // Parse Plasma
  dataPlasma.forEach((row: any) => {
    const time = row[timeIdxP];
    if (!time) return;
    const speed = parseFloat(row[speedIdx]);
    const density = parseFloat(row[densityIdx]);
    const temperature = parseFloat(row[tempIdx]);

    if (isNaN(speed)) return;

    // Use truncated IsoString or simple tag
    const stamp = new Date(time).toISOString();
    finalTelemetryMap.set(stamp, {
      time: stamp,
      speed: Math.round(speed * 10) / 10,
      density: isNaN(density) ? 4.5 : Math.round(density * 10) / 10,
      temperature: isNaN(temperature) ? 90000 : Math.round(temperature),
      bz: 1.5, // Quiet sun defaults
      bt: 4.0,
      xrayShort: 1e-8,
      xrayLong: 5e-8,
    });
  });

  // Merge Mag
  dataMag.forEach((row: any) => {
    const time = row[timeIdxM];
    if (!time) return;
    const stamp = new Date(time).toISOString();
    const bz = parseFloat(row[bzIdx]);
    const bt = parseFloat(row[btIdx]);

    if (finalTelemetryMap.has(stamp)) {
      const current = finalTelemetryMap.get(stamp);
      current.bz = isNaN(bz) ? 1.5 : Math.round(bz * 10) / 10;
      current.bt = isNaN(bt) ? 4.0 : Math.round(bt * 10) / 10;
    }
  });

  // Handle X-ray if available (We parse the GOES xrays-6-hour array of objects)
  if (xrayRaw && Array.isArray(xrayRaw)) {
    xrayRaw.forEach((obj: any) => {
      const time = obj.time_tag;
      if (!time) return;
      const stamp = new Date(time).toISOString();
      const flux = parseFloat(obj.flux || obj.xray_flux);
      const isShort = obj.energy === "0.05-0.4nm";

      // Find closest timestamp in plasma map within 5 mins
      const objTimeMs = new Date(stamp).getTime();
      let closestStamp = null;
      let minDiff = 10 * 60 * 1000; // 10 min window max

      for (const mapKey of finalTelemetryMap.keys()) {
        const diff = Math.abs(new Date(mapKey).getTime() - objTimeMs);
        if (diff < minDiff) {
          minDiff = diff;
          closestStamp = mapKey;
        }
      }

      if (closestStamp && !isNaN(flux)) {
        const item = finalTelemetryMap.get(closestStamp);
        if (isShort) {
          item.xrayShort = flux;
        } else {
          item.xrayLong = flux;
        }
      }
    });
  }

  // Sort and return last 24 hours (288 points)
  const items = Array.from(finalTelemetryMap.values());
  items.forEach((item) => {
    item.kp = calculateKp(item.speed, item.bz);
  });
  items.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  return items.slice(-100); // last 100 points is perfect for nice performance and viz
}

// Live Alerts Parser
function parseNoaaAlerts(rawAlerts: any[]): any[] {
  if (!rawAlerts || !Array.isArray(rawAlerts)) return [];
  // NOAA alerts are raw alert messages, we convert them to user-friendly objects
  return rawAlerts.slice(0, 10).map((alert: any, index: number) => {
    const isCritical = alert.message?.includes("WARNING") || alert.message?.includes("SEVERE") || alert.message?.includes("EXTREME");
    const isWarning = alert.message?.includes("WATCH") || alert.message?.includes("MODERATE");
    
    // Guess type
    let type = "storm";
    if (alert.message?.includes("Radio Blackout") || alert.message?.includes("X-ray")) {
      type = "flare";
    } else if (alert.message?.includes("Proton") || alert.message?.includes("Radiation")) {
      type = "proton";
    }

    // Capture scale designator
    let scaleLevel = "";
    const gMatch = alert.message?.match(/G([1-5])/);
    const sMatch = alert.message?.match(/S([1-5])/);
    const rMatch = alert.message?.match(/R([1-5])/);
    if (gMatch) scaleLevel = `G${gMatch[1]}`;
    else if (sMatch) scaleLevel = `S${sMatch[1]}`;
    else if (rMatch) scaleLevel = `R${rMatch[1]}`;

    return {
      id: `live-alt-${index}`,
      timestamp: alert.issue_datetime || new Date().toISOString(),
      type,
      title: `${alert.product_id || "SPACE_ALERT"}: ${scaleLevel ? scaleLevel + " Storm" : "Solar Event"} Detected`,
      message: alert.message?.substring(0, 300) + "...",
      severity: isCritical ? "critical" : isWarning ? "warning" : "info",
      scaleLevel,
      instrument: alert.station_id || "NOAA SWPC Forecast Desk"
    };
  });
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Returns combined telemetry, supporting live NOAA feeds with simulated local fallbacks
app.get("/api/space-weather/telemetry", async (req, res) => {
  const useSandbox = req.query.sandbox === "true";

  if (useSandbox) {
    return res.json({
      source: "Sandbox Simulation (June 3-4, 2026 Severe CME)",
      data: generateStormSandboxData(),
    });
  }

  // Live Fetch with Fail-safe Pre-baked Baseline
  try {
    const [plasma, mag, xray] = await Promise.all([
      fetchNoaaData("https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json"),
      fetchNoaaData("https://services.swpc.noaa.gov/products/solar-wind/mag-5-minute.json"),
      fetchNoaaData("https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json").catch(() => null), // optional
    ]);

    const formatted = parseNoaaTelemetry(plasma, mag, xray);
    if (formatted && formatted.length > 0) {
      return res.json({
        source: "NOAA SWPC Operations (Real-time L1)",
        data: formatted,
      });
    }
    throw new Error("No parsed telemetry output generated from raw NOAA feeds");
  } catch (err: any) {
    console.warn("NOAA Real-time Fetch Error. Serving normal real-time baseline:", err.message);
    
    // Serve beautiful active normal baseline telemetry
    const baselineQuiet = [];
    const now = new Date();
    for (let i = 0; i < 100; i++) {
      const time = new Date(now.getTime() - (100 - i) * 5 * 1000 * 60);
      const speed = Math.round((380 + Math.sin(i / 10) * 15 + Math.random() * 8) * 10) / 10;
      const density = Math.round((4.0 + Math.cos(i / 8) * 0.4 + Math.random() * 0.3) * 10) / 10;
      const temperature = Math.round(75000 + Math.cos(i / 12) * 8000 + Math.random() * 4000);
      const bz = Math.round((0.5 + Math.sin(i / 15) * 1.8) * 10) / 10;
      const bt = Math.round((4.2 + Math.random() * 0.5) * 10) / 10;
      const xrayShort = 1.2e-8 + Math.random() * 5e-9;
      const xrayLong = 4.8e-8 + Math.random() * 1e-8;
      const kp = calculateKp(speed, bz);

      baselineQuiet.push({
        time: time.toISOString(),
        speed,
        density,
        temperature,
        bz,
        bt,
        xrayShort,
        xrayLong,
        kp,
      });
    }
    return res.json({
      source: "NOAA Live Feed Offline (Simulated Active Baseline Local)",
      data: baselineQuiet,
    });
  }
});

app.get("/api/space-weather/alerts", async (req, res) => {
  const useSandbox = req.query.sandbox === "true";

  if (useSandbox) {
    return res.json({
      source: "Sandbox Simulation alerts",
      alerts: getHistoricalAlerts(),
    });
  }

  try {
    const rawNoaaAlerts = await fetchNoaaData("https://services.swpc.noaa.gov/products/alerts.json");
    const parsed = parseNoaaAlerts(rawNoaaAlerts);
    if (parsed && parsed.length > 0) {
      return res.json({
        source: "NOAA SWPC Forecast Center Live Feed",
        alerts: parsed,
      });
    }
    throw new Error("Empty alerts");
  } catch (err) {
    return res.json({
      source: "NOAA Live Alert Feed Offline (Scientific Active Baseline)",
      alerts: getHistoricalAlerts().map(a => ({
        ...a,
        title: "[Historic Alert Archive] " + a.title
      }))
    });
  }
});

// NASA DONKI linkages endpoint
app.get("/api/space-weather/donki-events", (req, res) => {
  res.json({
    source: "NASA DONKI Causal Linkages",
    events: getDonkiEventFlow(),
  });
});

// ============================================================================
// SERVER SIDE GEMINI HELIOPHYSICS ANALYST (EXPERT SYSTEM)
// ============================================================================

app.post("/api/gemini/analyze", async (req, res) => {
  const { messages, activeState } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  // Construct current state prompt context
  const instrumentStatusText = activeState
    ? `Current Live Instrument Telemetry monitor state:
- Mode: ${activeState.mode === "sandbox" ? "Historical Storm Simulation (June 2026)" : "Real-time Live L1 Feed"}
- Solar Wind Speed: ${activeState.speed} km/s
- Proton Density: ${activeState.density} protons/cm³
- Plasma Temperature: ${activeState.temperature} K
- IMF Bz magnetic component: ${activeState.bz} nT
- IMF Bt total intensity: ${activeState.bt} nT
- Active Geomagnetic scale: ${activeState.gScaleText}
- Active Solar Radiation scale: ${activeState.sScaleText}
- Active X-Ray Solar Flare scale: ${activeState.rScaleText}
- Current active alerts on feed: ${activeState.activeAlertsCount}`
    : "No active telemetry dashboard bound currently.";

  // Setup the prompt
  const systemInstruction = `You are "Helios-9 Expert Space Weather & Heliophysics Analyst", an advanced AI scientific desk assistant powered by Google Gemini.
Your core expertise lies in solar astrophysics, space plasma physics, orbital magnetometers (ACE, DSCOVR, GOES), and explaining their potential impacts on space assets, power grids, and aviation.

Here is the active meteorological instrumentation status on the dashboard:
${instrumentStatusText}

Your guidelines:
1. Explain space weather concepts (e.g., southward Bz orientation, CME propagation, proton star storms, Carrington Event, geomagnetic indices like Kp/Dst) in an elegant, scientifically accurate, yet highly pedagogical manner.
2. If the telemetry state shows active G3/G4 storms (high speed >700km/s, south Bz < -10 nT), analyze the risks (grid induced currents, HF radio blackouts on the sunlit side, satellite drag, high-frequency trans-polar airline radiation risk) professionally.
3. Be friendly, humble, highly objective, and completely free of artificial marketing hype or self-promotion.
4. Keep paragraphs short, scannable, using structured headers or bold bulleted points where helpful to facilitate educator and student comprehension.`;

  try {
    if (!ai) {
      // Graceful local demonstration response when secret API key is missing
      console.warn("Serving simulated space weather chat response (GEMINI_API_KEY is not configured)");
      const lastUserMsg = messages[messages.length - 1]?.text || "Hello";
      const demoReply = `[Educational Simulation Desk Active]

Thank you for asking about space science! (Note: Gemini API is running in demo mode since an API key is not configured in your Settings).

Your question: "${lastUserMsg}"

In helio-meteorological science, when we analyze the **Bz magnetic component** or **Solar Wind speeds**, we are looking at Earth's protective gateway. During solar storms:
- **Southward Bz (Negative Value)**: Magnetic lines of the solar wind connect with the Earth's magnetic lines, opening a direct highway for charged particles to pour into our magnetosphere.
- **Solar Wind Speed**: Elevated velocities (above 600 km/s) indicate a high-speed coronal hole wind stream or an shockwave from a **Coronal Mass Ejection (CME)**.

Would you like to explore Earth's induced currents or auroral visibility mechanics in more depth?`;
      return res.json({ text: demoReply });
    }

    // Convert messages history to Gemini SDK structure
    // Gemini 3.5 Flash chat usage of @google/genai SDK:
    // User prompts are sent via contents
    const contents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I was unable to compile an analysis for those parameters. Please try again.";
    return res.json({ text: replyText });

  } catch (error: any) {
    console.error("Gemini Heliophysics Assistant encountered an error:", error);
    return res.status(500).json({
      error: `Gemini analyst error: ${error.message || "Unknown error during heliophysics analysis generation."}`,
    });
  }
});

// ============================================================================
// SEAMLESS VITE FRONTEND SERVICE PIPELINE
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite Dev Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets from dist/...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(`Space Weather Dashboard Server online on port: ${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
    console.log(`URL: http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer();
