import { TelemetryData } from "../types";

export interface HistoricalEventInfo {
  key: string;
  name: string;
  dateText: string;
  description: string;
  citation: string;
  citationsList: { label: string; url: string }[];
  stats: {
    maxSpeed: string;
    minBz: string;
    maxFlare: string;
    kpMax: string;
  };
}

export const HISTORICAL_EVENTS: HistoricalEventInfo[] = [
  {
    key: "june-2026",
    name: "June 2026 Sol-Storm Event",
    dateText: "June 03–04, 2026",
    description: "The baseline severe space weather event modeling an X2.1 solar flare, high-flux proton storm channels, and an earthbound Coronal Mass Ejection (CME) shock front traveling at 920 km/s.",
    citation: "Data modeled based on operational NOAA SWPC Space Weather guidelines and ENLIL CME propagation systems.",
    citationsList: [
      { label: "NOAA SWPC Operations", url: "https://www.swpc.noaa.gov" },
      { label: "WSA-ENLIL Solar Wind Model", url: "https://www.swpc.noaa.gov/products/wsa-enlil-solar-wind-prediction" }
    ],
    stats: {
      maxSpeed: "920 km/s",
      minBz: "-26 nT",
      maxFlare: "X2.1 Class",
      kpMax: "Kp 8.3 (G4)"
    }
  },
  {
    key: "may-2024",
    name: "May 2024 G5 Aurora Storm (AR3664)",
    dateText: "May 10–11, 2024",
    description: "The most powerful geomagnetic storm to impact Earth since 2003, triggered by hyper-active sunspot cluster AR3664. Unleashed consecutive halo CMEs that merged into a multi-shock wave front.",
    citation: "NOAA SWPC Real-time archives & SOHO/LASCO satellite coronagraph observations.",
    citationsList: [
      { label: "NOAA SWPC Mother's Day Storm Archive", url: "https://www.swpc.noaa.gov/news/extreme-g5-geomagnetic-storm-may-2024" },
      { label: "NASA SOHO Coronagraphs", url: "https://soho.nascom.nasa.gov" },
      { label: "SDO Solar Dynamics Observatory", url: "https://sdo.gsfc.nasa.gov" }
    ],
    stats: {
      maxSpeed: "1,020 km/s",
      minBz: "-50 nT",
      maxFlare: "X8.7 Class",
      kpMax: "Kp 9.0 (G5)"
    }
  },
  {
    key: "october-2003",
    name: "October 2003 Halloween Storms",
    dateText: "Oct 29–30, 2003",
    description: "A legendary sequence of solar activity that triggered satellite malfunctions, power grid outages in Sweden, and transformed transformers worldwide. Featured some of the largest flares ever recorded.",
    citation: "NASA ACE/DSCOVR historic records and GOES X-ray solar radiation catalog.",
    citationsList: [
      { label: "NASA Science Halloween Storms", url: "https://science.nasa.gov/science-research/heliophysics/halloween-storms/" },
      { label: "ESA Space Weather Historic Portal", url: "https://swe.ssa.esa.int" }
    ],
    stats: {
      maxSpeed: "1,500 km/s",
      minBz: "-40 nT",
      maxFlare: "X45 Class",
      kpMax: "Kp 9.0 (G5)"
    }
  },
  {
    key: "september-1859",
    name: "1859 Carrington Event",
    dateText: "Sept 01–02, 1859",
    description: "The ultimate benchmark heliophysics superstorm. Discovered by Richard Carrington, it compressed Earth's magnetosphere so severely that telegraph systems sparked fires and global auroras cast midnight shadows.",
    citation: "Reconstructed scientific data from magnetic observatories, ice cores, and historical telegraph logs.",
    citationsList: [
      { label: "Royal Astronomical Society Archives", url: "https://ras.ac.uk" },
      { label: "USGS Geomagnetism Historical Studies", url: "https://www.usgs.gov/programs/geomagnetism" },
      { label: "NASA Solar Astrophysics Papers", url: "https://www.nasa.gov" }
    ],
    stats: {
      maxSpeed: "2,300 km/s",
      minBz: "-120 nT",
      maxFlare: "X80+ Class (Est.)",
      kpMax: "Kp 9.0+ (G5+)"
    }
  }
];

export function generateHistoricalTelemetry(eventKey: string): TelemetryData[] {
  const points: TelemetryData[] = [];
  const baseTime = new Date("2026-06-03T00:00:00Z"); // Standardized calendar baseline
  
  let peakSpeed = 920;
  let peakDensity = 48;
  let minBz = -26;
  let peakTemp = 400000;
  let peakFlare = 2.1e-4; // X2.1
  let transitHours = 30;
  let onsetHour = 11; // 11:00 UTC

  switch (eventKey) {
    case "may-2024":
      peakSpeed = 1020;
      peakDensity = 55;
      minBz = -50;
      peakTemp = 480000;
      peakFlare = 8.7e-4; // X8.7
      transitHours = 24;
      onsetHour = 10;
      break;
    case "october-2003":
      peakSpeed = 1500;
      peakDensity = 65;
      minBz = -40;
      peakTemp = 600000;
      peakFlare = 4.5e-3; // X45 !! (extremely severe)
      transitHours = 19;
      onsetHour = 8;
      break;
    case "september-1859":
      peakSpeed = 2300;
      peakDensity = 80;
      minBz = -120;
      peakTemp = 990000;
      peakFlare = 8.0e-3; // X80+ (super flare)
      transitHours = 17;
      onsetHour = 4;
      break;
    case "june-2026":
    default:
      peakSpeed = 920;
      peakDensity = 48;
      minBz = -26;
      peakTemp = 400000;
      peakFlare = 2.1e-4; // X2.1
      transitHours = 30;
      onsetHour = 11;
      break;
  }

  // Generate 100 points representing a 48 hour span (~30 min intervals)
  for (let idx = 0; idx < 100; idx++) {
    const timeOffsetMs = idx * 30 * 60 * 1000;
    const pointTime = new Date(baseTime.getTime() + timeOffsetMs);
    const hourElapsed = idx * 0.5;

    let speed = 370 + Math.random() * 15;
    let density = 4.0 + Math.random() * 0.6;
    let temp = 70000 + Math.random() * 8000;
    let bz = 1.5 + Math.random() * 1.5;
    let xrayLong = 4e-8 + Math.random() * 7e-9;
    let xrayShort = 1e-8 + Math.random() * 2e-9;

    // Flare Phase
    const flarePeakHour = onsetHour + 0.5;
    if (hourElapsed >= onsetHour && hourElapsed < flarePeakHour) {
      // Rapid flare rise
      const p = (hourElapsed - onsetHour) / 0.5;
      xrayLong = 4e-8 + Math.pow(p, 3) * peakFlare;
      xrayShort = 1e-8 + Math.pow(p, 3) * (peakFlare * 0.22);
    } else if (hourElapsed >= flarePeakHour && hourElapsed < flarePeakHour + 6) {
      // Exponential flare decay over 6 hours
      const p = (hourElapsed - flarePeakHour) / 6;
      xrayLong = peakFlare * Math.exp(-p * 4.5) + 4e-8;
      xrayShort = (peakFlare * 0.22) * Math.exp(-p * 4.5) + 1e-8;
    }

    // Proton Radiation Star Storm
    const protonOnsetHour = onsetHour + 2;
    const impactHour = onsetHour + transitHours;
    if (hourElapsed >= protonOnsetHour && hourElapsed < impactHour) {
      const scalePct = (hourElapsed - protonOnsetHour) / (impactHour - protonOnsetHour);
      if (scalePct < 0.2) {
        density += (scalePct / 0.2) * (peakDensity * 0.35); // rise S-levels
      } else {
        density += (peakDensity * 0.35) * Math.exp(-(scalePct - 0.2) * 1.5); // decay baseline
      }
    }

    // CME Shockfront Impact
    if (hourElapsed >= impactHour) {
      const compressionSpan = 1.0; // 1 hour shockfront compression
      if (hourElapsed < impactHour + compressionSpan) {
        const p = (hourElapsed - impactHour) / compressionSpan;
        speed = 380 + p * (peakSpeed - 380);
        density = 6.0 + p * peakDensity;
        temp = 90000 + p * peakTemp;
        bz = 1.0 + p * (minBz - 1.0);
      } else {
        // Slow gradual decay of storm cloud over hours
        const decaySpan = hourElapsed - (impactHour + compressionSpan);
        const rate = Math.max(0, decaySpan / 12.0); // decay over remainder
        speed = peakSpeed * Math.exp(-rate * 0.15) + Math.random() * 20;
        density = peakDensity * Math.exp(-rate * 0.3) + Math.random() * 3;
        temp = peakTemp * Math.exp(-rate * 0.2) + Math.random() * 10000;
        bz = minBz * Math.exp(-rate * 0.12) + Math.random() * 1.5;
      }
    } else if (hourElapsed >= onsetHour && hourElapsed < impactHour) {
      // Small transit velocity prep elevation
      const prep = (hourElapsed - onsetHour) / (impactHour - onsetHour);
      speed += prep * 15;
      bz -= prep * 2.5;
    }

    // Bt mapping
    const bt = Math.sqrt(speed * 0.005 + bz * bz + 4);

    // Dynamic Kp calculator
    let kp = 1 + Math.random() * 0.8;
    if (speed >= 1800 && bz <= -80) kp = 9.0;
    else if (speed >= 1200 && bz <= -40) kp = 8.8 + Math.random() * 0.2;
    else if (speed >= 800 && bz <= -20) kp = 8.0 + Math.random() * 0.9;
    else if (speed >= 650 && bz <= -12) kp = 6.5 + Math.random() * 1.5;
    else if (speed >= 500 && bz <= -6) kp = 4.5 + Math.random() * 1.5;
    else if (speed >= 430 && bz <= -2) kp = 3.0 + Math.random() * 1.2;
    else if (speed > 400 && bz < 0) kp = 2.0 + Math.random() * 1.0;
    
    kp = Math.max(0, Math.min(9, Math.round(kp * 10) / 10));

    points.push({
      time: pointTime.toISOString(),
      speed: Math.round(speed * 10) / 10,
      density: Math.round(density * 10) / 10,
      temperature: Math.round(temp),
      bz: Math.round(bz * 10) / 10,
      bt: Math.round(bt * 10) / 10,
      xrayShort,
      xrayLong,
      kp,
    });
  }

  return points;
}
