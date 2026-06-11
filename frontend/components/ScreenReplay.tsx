'use client';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '@/lib/useBreakpoint';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Topbar from './Topbar';
import { tempVar, makeSeries, riskTier } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import type { RiskScoreResponse, SnapshotSummary, Palette } from '@/lib/types';

interface Props {
  data: RiskScoreResponse | null;
  snapshots: SnapshotSummary[];
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

const CRISIS_EVENTS = [
  { year: 1990, label: '1990 Recession' },
  { year: 1994, label: '94 Bond Crisis' },
  { year: 2000, label: 'Dot-com Peak' },
  { year: 2008, label: 'GFC' },
  { year: 2020, label: 'Covid Crash' },
  { year: 2022, label: '2022 Bear' },
];

type Speed = '1×' | '2×' | '8×' | '64×';
const SPEED_MS: Record<Speed, number> = { '1×': 600, '2×': 300, '8×': 80, '64×': 20 };
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface NewsItem {
  title: string;
  desc: string;
  impact: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'STABLE';
  imgUrl: string;
}

function getImpactColor(impact: string) {
  if (impact === 'CRITICAL') return 'oklch(0.62 0.22 18)'; // Red
  if (impact === 'HIGH') return 'oklch(0.72 0.18 38)'; // Orange
  if (impact === 'MODERATE') return 'oklch(0.80 0.14 130)'; // Yellow
  return 'oklch(0.78 0.13 165)'; // Green
}

function getImpactBg(impact: string) {
  if (impact === 'CRITICAL') return 'color-mix(in srgb, oklch(0.62 0.22 18) 12%, transparent)';
  if (impact === 'HIGH') return 'color-mix(in srgb, oklch(0.72 0.18 38) 12%, transparent)';
  if (impact === 'MODERATE') return 'color-mix(in srgb, oklch(0.80 0.14 130) 12%, transparent)';
  return 'color-mix(in srgb, oklch(0.78 0.13 165) 12%, transparent)';
}

const YEARLY_BACKDROPS: Record<number, NewsItem> = {
  1990: {
    title: "1990 Recession & Oil Shock",
    desc: "US economy enters a recession following the Fed's rate hike campaign and a massive crude oil price shock after Iraq invades Kuwait.",
    impact: "HIGH",
    imgUrl: "/images/news/news-1990.jpg"
  },
  1991: {
    title: "Operation Desert Storm Begins",
    desc: "Allied military intervention in Iraq triggers a major relief rally on Wall Street as energy market supply fears subside.",
    impact: "MODERATE",
    imgUrl: "/images/news/news-1991.jpg"
  },
  1992: {
    title: "Black Wednesday Currency Panic",
    desc: "The UK is forced to withdraw the Pound Sterling from the European Exchange Rate Mechanism after speculative attacks led by George Soros.",
    impact: "HIGH",
    imgUrl: "/images/news/news-1992.jpg"
  },
  1993: {
    title: "Clinton Deficit Reduction Plan",
    desc: "President Clinton signs the Omnibus Budget Act, raising taxes on high earners and implementing budget cuts to stabilize federal deficit concerns.",
    impact: "STABLE",
    imgUrl: "/images/news/news-1993.jpg"
  },
  1994: {
    title: "Surprise Fed Rate Hikes",
    desc: "The Federal Reserve begins a surprise policy tightening campaign, doubling rates and triggering a global crash in bond markets.",
    impact: "HIGH",
    imgUrl: "/images/news/news-1994.jpg"
  },
  1995: {
    title: "Netscape IPO Sparks Internet Era",
    desc: "Netscape goes public, its shares skyrocketing 108% on day one, triggering the birth of the Dot-com tech speculation bubble.",
    impact: "MODERATE",
    imgUrl: "/images/news/news-1995.jpg"
  },
  1996: {
    title: "Greenspan warns of 'Irrational Exuberance'",
    desc: "Fed Chairman Alan Greenspan warns that markets may be displaying 'irrational exuberance', causing a brief temporary correction in global indices.",
    impact: "MODERATE",
    imgUrl: "/images/news/news-1996.jpg"
  },
  1997: {
    title: "Asian Financial Crisis Spreads",
    desc: "Financial contagion spreads from Thailand across South East Asia, causing currency collapses and forcing emergency IMF bailouts.",
    impact: "HIGH",
    imgUrl: "/images/news/news-1997.jpg"
  },
  1998: {
    title: "LTCM Hedge Fund Collapse",
    desc: "Russian default triggers extreme volatility, leading to the near-collapse of LTCM. Fed coordinates a $3.6 billion rescue plan.",
    impact: "HIGH",
    imgUrl: "/images/news/news-1998.jpg"
  },
  1999: {
    title: "Dow Jones Crosses 10,000",
    desc: "The Dow Jones Industrial Average closes above the 10,000 mark for the first time, fueled by tech sector euphoria.",
    impact: "STABLE",
    imgUrl: "/images/news/news-1999.jpg"
  },
  2000: {
    title: "Dot-com Speculative Bubble Peaks",
    desc: "The NASDAQ Composite peaks at 5,048, marking the absolute high point of the internet technology speculation mania.",
    impact: "CRITICAL",
    imgUrl: "/images/news/news-2000.jpg"
  },
  2001: {
    title: "September 11 Terror Attacks",
    desc: "9/11 attacks shut down the US stock market for four sessions. Markets plunge upon reopening, with the S&P 500 falling 11%.",
    impact: "CRITICAL",
    imgUrl: "/images/news/news-2001.jpg"
  },
  2002: {
    title: "WorldCom Accounting Collapse",
    desc: "WorldCom files for bankruptcy after a massive $3.8 billion accounting fraud is exposed, marking the peak of corporate scandals.",
    impact: "HIGH",
    imgUrl: "/images/news/news-2002.jpg"
  },
  2003: {
    title: "Invasion of Iraq Begins",
    desc: "US-led military forces enter Iraq, removing geopolitical uncertainty and starting a market recovery cycle.",
    impact: "STABLE",
    imgUrl: "/images/news/news-2003.jpg"
  },
  2004: {
    title: "Google IPO Landmark Debut",
    desc: "Google goes public using a unique Dutch auction IPO format, raising $1.67 billion and triggering a renewal of tech growth interest.",
    impact: "STABLE",
    imgUrl: "/images/news/news-2004.jpg"
  },
  2005: {
    title: "Hurricane Katrina Oil Disruption",
    desc: "Katrina devastates the Gulf Coast, shutting down refining capacity and pushing oil and gasoline prices to historic highs.",
    impact: "MODERATE",
    imgUrl: "/images/news/news-2005.jpg"
  },
  2006: {
    title: "Housing Bubble Cooling Signs",
    desc: "US housing indicators cool rapidly as subprime defaults rise and home construction starts suffer double-digit declines.",
    impact: "MODERATE",
    imgUrl: "/images/news/news-2006.jpg"
  },
  2007: {
    title: "Early Subprime Mortgage Freeze",
    desc: "BNP Paribas freezes credit funds due to subprime exposure, triggering a systemic freeze in global short-term debt and credit markets.",
    impact: "HIGH",
    imgUrl: "/images/news/news-2007.jpg"
  },
  2008: {
    title: "Lehman Bankruptcy & GFC Panic",
    desc: "Lehman Brothers files for bankruptcy, prompting a systemic global credit freeze, major banking rescues, and extreme risk aversion.",
    impact: "CRITICAL",
    imgUrl: "/images/news/news-2008.jpg"
  },
  2009: {
    title: "GFC Bottom & Launch of QE1",
    desc: "US indices hit multi-decade bear bottoms in March before reversing as the Fed initiates massive asset buyback QE programs.",
    impact: "HIGH",
    imgUrl: "/images/news/news-2009.jpg"
  },
  2010: {
    title: "Flash Crash Algorithm Panic",
    desc: "Dow Jones drops 1,000 points in minutes due to algorithmic high-frequency trading sell feedback before rebounding rapidly.",
    impact: "MODERATE",
    imgUrl: "/images/news/news-2010.jpg"
  },
  2011: {
    title: "US Debt Downgraded by S&P",
    desc: "Standard & Poor's cuts the United States long-term credit rating from AAA to AA+ for the first time in history amid debt ceiling disputes.",
    impact: "HIGH",
    imgUrl: "/images/news/news-2011.jpg"
  },
  2012: {
    title: "ECB 'Whatever It Takes' Pledge",
    desc: "ECB President Mario Draghi vows to do 'whatever it takes' to protect the Eurozone from debt collapse, turning market sentiment.",
    impact: "STABLE",
    imgUrl: "/images/news/news-2012.jpg"
  },
  2013: {
    title: "Bernanke Hints QE Tapering",
    desc: "Fed Chairman Ben Bernanke signals a potential reduction in monthly bond buybacks, causing the global 'Taper Tantrum' yield spike.",
    impact: "MODERATE",
    imgUrl: "/images/news/news-2013.jpg"
  },
  2014: {
    title: "Global Crude Oil Crash",
    desc: "Oil prices plummet from $100 to under $50 a barrel due to OPEC supply battles and surging US shale extraction volumes.",
    impact: "MODERATE",
    imgUrl: "/images/news/news-2014.jpg"
  },
  2015: {
    title: "China Renminbi Devaluation",
    desc: "China devalues the Yuan, triggering global capital outflow fears and causing a sharp correction in major western indices.",
    impact: "HIGH",
    imgUrl: "/images/news/news-2015.jpg"
  },
  2016: {
    title: "UK Brexit Referendum Shock",
    desc: "The UK votes to leave the European Union, triggering sudden volatility and driving the British Pound to 30-year lows.",
    impact: "HIGH",
    imgUrl: "/images/news/news-2016.jpg"
  },
  2017: {
    title: "Bitcoin Retail Crypto Mania",
    desc: "Bitcoin surges towards the $20,000 mark in a massive speculative mania, drawing retail and regulatory attention globally.",
    impact: "STABLE",
    imgUrl: "/images/news/news-2017.jpg"
  },
  2018: {
    title: "Volpocalypse Volatility Spike",
    desc: "The VIX index doubles in a single day, destroying short-volatility exchange-traded assets and triggering a broad market drop.",
    impact: "HIGH",
    imgUrl: "/images/news/news-2018.jpg"
  },
  2019: {
    title: "Fed Interest Rate Cut Cycle",
    desc: "The Federal Reserve cuts interest rates for the first time since 2008 as trade tensions raise global growth concerns.",
    impact: "STABLE",
    imgUrl: "/images/news/news-2019.jpg"
  },
  2020: {
    title: "COVID-19 Pandemic Collapse",
    desc: "COVID lockdowns trigger the sharpest bear correction in history, followed by an unprecedented Fed liquidity injection.",
    impact: "CRITICAL",
    imgUrl: "/images/news/news-2020.jpg"
  },
  2021: {
    title: "Reddit GameStop Short Squeeze",
    desc: "Retail traders on WallStreetBets drive extreme short squeeze rallies in 'meme stocks' like GME, causing massive hedge fund losses.",
    impact: "HIGH",
    imgUrl: "/images/news/news-2021.jpg"
  },
  2022: {
    title: "Highest Inflation in 40 Years",
    desc: "US inflation hits 9.1%, forcing the Federal Reserve to launch a historically aggressive interest rate hike campaign.",
    impact: "HIGH",
    imgUrl: "/images/news/news-2022.jpg"
  },
  2023: {
    title: "Silicon Valley Bank Collapse",
    desc: "SVB collapses in a major deposit bank run, prompting federal agencies to step in and guarantee all bank deposits.",
    impact: "HIGH",
    imgUrl: "/images/news/news-2023.jpg"
  },
  2024: {
    title: "NVIDIA Joins $2T Club in AI Boom",
    desc: "Generative AI demand pushes tech stocks higher, with NVIDIA value crossing $2 trillion amid massive market rally focus.",
    impact: "STABLE",
    imgUrl: "/images/news/news-2024.jpg"
  },
  2025: {
    title: "Fed Successfully Navigates Soft Landing",
    desc: "US inflation falls back to target without triggering a recession, leading to a period of steady growth and rate stabilization.",
    impact: "STABLE",
    imgUrl: "/images/news/news-2025.jpg"
  },
  2026: {
    title: "Markets Reach All-Time Highs",
    desc: "Stock indices hit new historic milestones, driven by strong corporate earnings and steady interest rate outlooks.",
    impact: "STABLE",
    imgUrl: "/images/news/news-2026.jpg"
  }
};

const MONTHLY_EVENTS: Record<string, NewsItem> = {
  "2008-09": {
    title: "Lehman Brothers Bankruptcy",
    desc: "Lehman Brothers files for Chapter 11 bankruptcy, triggering a global credit freeze and marking the peak of the banking crisis.",
    impact: "CRITICAL",
    imgUrl: "/images/news/news-monthly-2008-09.jpg"
  },
  "2000-03": {
    title: "Dot-com Bubble Peak reached",
    desc: "The NASDAQ Composite peaks at 5,048, marking the absolute high point of the internet technology speculation mania.",
    impact: "CRITICAL",
    imgUrl: "/images/news/news-monthly-2000-03.jpg"
  },
  "2020-03": {
    title: "COVID Global Market Crash",
    desc: "Markets experience extreme panic, triggering multiple circuit breakers. The Fed cuts rates to near-zero and launches unlimited QE.",
    impact: "CRITICAL",
    imgUrl: "/images/news/news-monthly-2020-03.jpg"
  },
  "2023-03": {
    title: "Silicon Valley Bank Collapse",
    desc: "Silicon Valley Bank (SVB) collapses in a classic bank run, freezing deposits and triggering a sudden regional banking panic.",
    impact: "HIGH",
    imgUrl: "/images/news/news-monthly-2023-03.jpg"
  }
};

// Odometer digit sub-component for rolling animation effect
interface OdometerDigitProps {
  digit: string;
  direction: 'forward' | 'backward';
}

function OdometerDigit({ digit, direction }: OdometerDigitProps) {
  const initialY = direction === 'forward' ? '100%' : '-100%';
  const exitY = direction === 'forward' ? '-100%' : '100%';

  return (
    <div
      style={{
        height: '1.2em',
        overflow: 'hidden',
        position: 'relative',
        width: '0.62em',
        display: 'inline-block',
        verticalAlign: 'bottom',
      }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: initialY, opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: exitY, opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            textAlign: 'center',
            display: 'block',
          }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Odometer text wrapper to split words/numbers into rolling digits
interface OdometerTextProps {
  text: string;
  direction: 'forward' | 'backward';
}

function OdometerText({ text, direction }: OdometerTextProps) {
  const isNumeric = /^[0-9.,\s-]+$/.test(text);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', direction: isNumeric ? 'ltr' : undefined }}>
      {text.split('').map((char, idx) => {
        if (char === ' ' || char === '-' || char === '/') {
          return (
            <span key={idx} style={{ width: '0.3em', display: 'inline-block', textAlign: 'center' }}>
              {char}
            </span>
          );
        }
        return <OdometerDigit key={`${idx}-${char}`} digit={char} direction={direction} />;
      })}
    </div>
  );
}

export default function ScreenReplay({ data, snapshots, palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const isMobile = useIsMobile();
  const sorted = useMemo(() =>
    [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)),
  [snapshots]);

  const usingRealData = sorted.length >= 4;

  const ABBR: Record<string, string> = isRtl ? {
    valuation: 'תמח',
    macro_stress: 'מאק',
    leverage_credit: 'מינ',
    sentiment: 'סנט',
    concentration: 'ריכ',
  } : {
    valuation: 'VAL',
    macro_stress: 'MAC',
    leverage_credit: 'LEV',
    sentiment: 'SEN',
    concentration: 'CON',
  };

  const getLocalizedImpact = (imp: string) => {
    if (!isRtl) return `${imp} IMPACT`;
    const map: Record<string, string> = {
      CRITICAL: 'קריטית',
      HIGH: 'גבוהה',
      MODERATE: 'בינונית',
      STABLE: 'נמוכה/יציבה',
    };
    return `השפעה: ${map[imp] || imp}`;
  };

  // Fallback: generate 600-point simulated series when no real snapshots exist
  const fallback = useMemo(() => makeSeries(600, 31, 0.04, 0.58), []);

  const [scrubIdx, setScrubIdx] = useState(() =>
    usingRealData ? sorted.length - 1 : Math.round(0.97 * 599)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playDirection, setPlayDirection] = useState<'forward' | 'backward'>('forward');
  const [speed, setSpeed] = useState<Speed>('8×');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDialDragging, setIsDialDragging] = useState(false);
  const [imgError, setImgError] = useState(false);

  const totalPoints = usingRealData ? sorted.length : 600;
  const clampedIdx = Math.min(Math.max(scrubIdx, 0), totalPoints - 1);

  const scrubIdxRef = useRef<number>(usingRealData ? sorted.length - 1 : Math.round(0.97 * 599));

  const [mobileStartYear, setMobileStartYear] = useState<number>(() => {
    if (usingRealData && sorted.length > 0) {
      return Math.floor(parseInt(sorted[0].snapshot_date.slice(0, 4)) / 10) * 10;
    }
    return 1900;
  });

  const mobilePointsRange = useMemo(() => {
    if (!isMobile) return { startIdx: 0, endIdx: totalPoints - 1 };
    
    let startIdx = 0;
    let endIdx = totalPoints - 1;
    
    if (usingRealData) {
      const startStr = `${mobileStartYear}-01-01`;
      const endStr = `${mobileStartYear + 10}-01-01`;
      
      const first = sorted.findIndex(s => s.snapshot_date >= startStr);
      const last = [...sorted].reverse().findIndex(s => s.snapshot_date < endStr);
      
      if (first !== -1) startIdx = first;
      if (last !== -1) endIdx = sorted.length - 1 - last;
      
      if (startIdx > endIdx) {
        startIdx = 0;
        endIdx = sorted.length - 1;
      }
    } else {
      const yearsSpan = 125;
      const pointsPerYear = 600 / yearsSpan;
      startIdx = Math.max(0, Math.min(599, Math.round((mobileStartYear - 1900) * pointsPerYear)));
      endIdx = Math.max(0, Math.min(599, Math.round((mobileStartYear + 10 - 1900) * pointsPerYear)));
    }
    
    return { startIdx, endIdx };
  }, [isMobile, mobileStartYear, totalPoints, usingRealData, sorted]);

  const chartPts = useMemo(() => {
    const pts = usingRealData ? sorted : fallback.map((v, i) => ({ composite_score: v * 100, _i: i }));
    return pts.slice(mobilePointsRange.startIdx, mobilePointsRange.endIdx + 1);
  }, [usingRealData, sorted, fallback, mobilePointsRange]);

  const timelineBounds = useMemo(() => {
    let firstMs = 0;
    let lastMs = 0;
    if (isMobile) {
      firstMs = new Date(`${mobileStartYear}-01-01`).getTime();
      lastMs  = new Date(`${mobileStartYear + 10}-01-01`).getTime();
    } else {
      if (usingRealData && sorted.length > 0) {
        firstMs = new Date(sorted[0].snapshot_date).getTime();
        lastMs  = new Date(sorted[sorted.length - 1].snapshot_date).getTime();
      } else {
        firstMs = new Date('1900-01-01').getTime();
        lastMs  = new Date('2025-01-01').getTime();
      }
    }
    return { firstMs, lastMs };
  }, [isMobile, mobileStartYear, usingRealData, sorted]);

  const getPointTimeMs = useCallback((p: any, index: number) => {
    if (usingRealData) {
      return new Date(p.snapshot_date).getTime();
    } else {
      const origIdx = p._i ?? index;
      const year = 1900 + (origIdx / 599) * 125;
      const yearInt = Math.floor(year);
      const yearFrac = year - yearInt;
      const date = new Date(`${yearInt}-01-01`);
      date.setMilliseconds(date.getMilliseconds() + yearFrac * 365 * 24 * 60 * 60 * 1000);
      return date.getTime();
    }
  }, [usingRealData]);

  // Sync scrubIdxRef when not dragging the dial
  useEffect(() => {
    if (!isDialDragging) {
      scrubIdxRef.current = scrubIdx;
    }
  }, [scrubIdx, isDialDragging]);

  // Auto-reset scrubIdx when data loads
  useEffect(() => {
    if (usingRealData) setScrubIdx(sorted.length - 1);
  }, [usingRealData, sorted.length]);

  // Playback interval logic supporting both directions
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setScrubIdx(prev => {
        if (playDirection === 'forward') {
          if (prev >= totalPoints - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        } else {
          if (prev <= 0) {
            setIsPlaying(false);
            return prev;
          }
          return prev - 1;
        }
      });
    }, SPEED_MS[speed]);
    return () => clearInterval(id);
  }, [isPlaying, speed, totalPoints, playDirection]);

  const handleChartInteraction = useCallback((clientX: number) => {
    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    const targetTimeMs = timelineBounds.firstMs + frac * (timelineBounds.lastMs - timelineBounds.firstMs);
    const pts = usingRealData ? sorted : fallback.map((v, i) => ({ composite_score: v * 100, _i: i }));
    
    let minDiff = Infinity;
    let targetIdx = 0;
    
    for (let i = 0; i < pts.length; i++) {
      const t = getPointTimeMs(pts[i], i);
      const diff = Math.abs(t - targetTimeMs);
      if (diff < minDiff) {
        minDiff = diff;
        targetIdx = i;
      }
    }
    
    setPlayDirection(targetIdx >= scrubIdxRef.current ? 'forward' : 'backward');
    setScrubIdx(targetIdx);
    scrubIdxRef.current = targetIdx;
    setIsPlaying(false);
  }, [usingRealData, sorted, fallback, timelineBounds, getPointTimeMs]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    handleChartInteraction(e.clientX);
  }, [handleChartInteraction]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleChartInteraction(e.clientX);
  }, [isDragging, handleChartInteraction]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    if (e.touches[0]) {
      handleChartInteraction(e.touches[0].clientX);
    }
  }, [handleChartInteraction]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (e.touches[0]) {
      handleChartInteraction(e.touches[0].clientX);
    }
  }, [isDragging, handleChartInteraction]);

  const getPointerAngle = (clientX: number, clientY: number) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    return Math.atan2(dy, dx);
  };

  const handleDialInteraction = useCallback((clientX: number, clientY: number) => {
    const newAngle = getPointerAngle(clientX, clientY);
    if (lastAngleRef.current === null) {
      lastAngleRef.current = newAngle;
      return;
    }

    let delta = newAngle - lastAngleRef.current;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    lastAngleRef.current = newAngle;

    // 240 index points per full 360 degree rotation (damped for precision)
    const pointsPerRotation = 240;
    const deltaIdx = (delta / (2 * Math.PI)) * pointsPerRotation;

    scrubIdxRef.current = Math.max(0, Math.min(totalPoints - 1, scrubIdxRef.current + deltaIdx));
    const targetIdx = Math.round(scrubIdxRef.current);

    if (targetIdx !== scrubIdx) {
      setPlayDirection(targetIdx >= scrubIdx ? 'forward' : 'backward');
      setScrubIdx(targetIdx);
    }
    setIsPlaying(false);
  }, [totalPoints, scrubIdx]);

  const handleDialMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    lastAngleRef.current = null;
    setIsDialDragging(true);
    handleDialInteraction(e.clientX, e.clientY);
  }, [handleDialInteraction]);

  const handleDialMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDialDragging) return;
    handleDialInteraction(e.clientX, e.clientY);
  }, [isDialDragging, handleDialInteraction]);

  const handleDialTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    lastAngleRef.current = null;
    setIsDialDragging(true);
    if (e.touches[0]) {
      handleDialInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleDialInteraction]);

  const handleDialTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDialDragging) return;
    if (e.touches[0]) {
      handleDialInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [isDialDragging, handleDialInteraction]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsDialDragging(false);
      lastAngleRef.current = null;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  const handlePlayControl = (action: 'jump-start' | 'play-reverse' | 'pause' | 'play-forward' | 'jump-end') => {
    if (action === 'jump-start') {
      setPlayDirection('backward');
      setScrubIdx(0);
      setIsPlaying(false);
    } else if (action === 'jump-end') {
      setPlayDirection('forward');
      setScrubIdx(totalPoints - 1);
      setIsPlaying(false);
    } else if (action === 'play-reverse') {
      setPlayDirection('backward');
      setIsPlaying(true);
    } else if (action === 'play-forward') {
      setPlayDirection('forward');
      setIsPlaying(true);
    } else if (action === 'pause') {
      setIsPlaying(false);
    }
  };

  // Current snapshot info at scrub position
  const currentSnap = usingRealData ? sorted[clampedIdx] : null;
  const currentScore = currentSnap
    ? currentSnap.composite_score
    : Math.round((fallback[clampedIdx] ?? 0.58) * 100);
  const currentDate = currentSnap
    ? currentSnap.snapshot_date
    : `${1900 + Math.round((clampedIdx / 599) * 125)}-01-01`;

  const scrubFrac = totalPoints > 1 ? clampedIdx / (totalPoints - 1) : 0;

  // State for displayed odometer numbers (throttled/debounced during fast dragging)
  const [displayedValues, setDisplayedValues] = useState({
    date: currentDate,
    score: currentScore,
  });

  // Sync displayed values at year boundaries or when dragging stops
  useEffect(() => {
    const liveYear = parseInt(currentDate.slice(0, 4), 10);
    const lastDispYear = parseInt(displayedValues.date.slice(0, 4), 10);

    // Update if not dragging, if playing, or if the year has shifted by 1 or more
    if (!isDragging || isPlaying || Math.abs(liveYear - lastDispYear) >= 1) {
      setDisplayedValues({
        date: currentDate,
        score: currentScore,
      });
    }
  }, [currentDate, currentScore, isDragging, isPlaying, displayedValues.date]);

  // Year & Month parsed for static dial core
  const displayYear = displayedValues.date.slice(0, 4);
  const monthNum = parseInt(displayedValues.date.slice(5, 7), 10);

  useEffect(() => {
    setImgError(false);
  }, [displayYear, monthNum]);

  const localizedMonths = isRtl
    ? ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']
    : MONTH_NAMES;

  const displayMonth = isNaN(monthNum) ? (isRtl ? 'ינו' : 'Jan') : localizedMonths[monthNum - 1] || (isRtl ? 'ינו' : 'Jan');
  const displayScore = displayedValues.score;

  // Sub-scores for metrics panel
  const valScore = currentSnap ? currentSnap.valuation_score : Math.max(10, Math.min(95, currentScore * 0.9 + Math.sin(clampedIdx * 0.05) * 8));
  const macScore = currentSnap ? currentSnap.macro_stress_score : Math.max(10, Math.min(95, currentScore * 1.1 + Math.cos(clampedIdx * 0.04) * 12));
  const levScore = currentSnap ? currentSnap.leverage_credit_score : Math.max(10, Math.min(95, currentScore * 0.85 + Math.sin(clampedIdx * 0.03) * 10));
  const senScore = currentSnap ? currentSnap.sentiment_score : Math.max(10, Math.min(95, currentScore * 1.05 + Math.cos(clampedIdx * 0.07) * 7));
  const conScore = currentSnap ? currentSnap.concentration_score : Math.max(10, Math.min(95, currentScore * 0.95 + Math.sin(clampedIdx * 0.06) * 9));

  // Determine starting and ending years of timeline
  const startYear = useMemo(() => {
    if (usingRealData && sorted.length > 0) {
      return parseInt(sorted[0].snapshot_date.slice(0, 4));
    }
    return 1900;
  }, [usingRealData, sorted]);

  const endYear = useMemo(() => {
    if (usingRealData && sorted.length > 0) {
      return parseInt(sorted[sorted.length - 1].snapshot_date.slice(0, 4));
    }
    return 2025;
  }, [usingRealData, sorted]);

  // Auto-shift the mobile decade window if the active index goes out of bounds
  useEffect(() => {
    if (!isMobile) return;
    const currentYear = parseInt(currentDate.slice(0, 4), 10);
    if (isNaN(currentYear)) return;
    
    if (currentYear < mobileStartYear || currentYear >= mobileStartYear + 10) {
      const targetDecade = Math.floor(currentYear / 10) * 10;
      setMobileStartYear(targetDecade);
    }
  }, [currentDate, isMobile, mobileStartYear]);

  const handleDecadeChange = (targetDecade: number) => {
    setMobileStartYear(targetDecade);
    
    if (usingRealData) {
      const targetDate = `${targetDecade}-01-01`;
      const matchedIdx = sorted.findIndex(s => s.snapshot_date >= targetDate);
      if (matchedIdx !== -1) {
        setPlayDirection(matchedIdx >= scrubIdx ? 'forward' : 'backward');
        setScrubIdx(matchedIdx);
      }
    } else {
      const targetIdx = Math.max(0, Math.min(599, Math.round(((targetDecade - 1900) / 125) * 599)));
      setPlayDirection(targetIdx >= scrubIdx ? 'forward' : 'backward');
      setScrubIdx(targetIdx);
    }
  };

  // Generate Year labels positioned along the dial perimeter
  const dialYearLabels = useMemo(() => {
    const yearsArray: number[] = [];
    // Guard: all snapshots may fall within a single year (fresh deployments)
    const span = Math.max(1, endYear - startYear);
    // Aim for ~8 labels around the circle
    const step = Math.max(5, Math.ceil(span / 8 / 5) * 5); 
    const firstLabel = Math.ceil(startYear / step) * step;
    for (let y = firstLabel; y <= endYear; y += step) {
      yearsArray.push(y);
    }
    
    // Filter to prevent overlap (especially at start/end boundary)
    const filtered: number[] = [];
    for (const y of yearsArray) {
      const angle = ((y - startYear) / span) * 360;
      // Check distance to all already added labels
      const hasOverlap = filtered.some(existing => {
        const existingAngle = ((existing - startYear) / span) * 360;
        const diff = Math.abs(angle - existingAngle);
        const distance = Math.min(diff, 360 - diff);
        return distance < 28; // minimum 28 degrees separation
      });
      if (!hasOverlap) {
        filtered.push(y);
      }
    }
    return filtered;
  }, [startYear, endYear]);

  // Dynamic rotation calculations
  // Keep the active year at 12 o'clock (0 degrees)
  const yearSpan = Math.max(1, endYear - startYear);
  const currentYearVal = startYear + scrubFrac * (endYear - startYear);
  const wheelRotation = -((currentYearVal - startYear) / yearSpan) * 360;

  // Build SVG path
  const chartPath = useMemo(() => {
    if (chartPts.length < 2) return '';
    return chartPts.map((p, i) => {
      const t = getPointTimeMs(p, (p as any)._i ?? (mobilePointsRange.startIdx + i));
      const x = ((t - timelineBounds.firstMs) / (timelineBounds.lastMs - timelineBounds.firstMs)) * 1280;
      const score = usingRealData ? (p as SnapshotSummary).composite_score : (p as { composite_score: number }).composite_score;
      const y = 20 + (1 - score / 100) * 260;
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
  }, [usingRealData, chartPts, timelineBounds, getPointTimeMs, mobilePointsRange]);

  // Crisis marker positions
  const crisisMarkers = useMemo(() => {
    if (!usingRealData || sorted.length < 2) return [];
    return CRISIS_EVENTS.flatMap(ev => {
      const t = new Date(`${ev.year}-06-01`).getTime();
      if (t < timelineBounds.firstMs || t > timelineBounds.lastMs) return [];
      const x = ((t - timelineBounds.firstMs) / (timelineBounds.lastMs - timelineBounds.firstMs)) * 1280;
      return [{ ...ev, x }];
    });
  }, [usingRealData, sorted, timelineBounds]);

  // Scrubber timeline markers
  const scrubYears = useMemo(() => {
    if (isMobile) {
      return Array.from({ length: 6 }, (_, i) => mobileStartYear + i * 2);
    }
    if (usingRealData && sorted.length >= 2) {
      const first = parseInt(sorted[0].snapshot_date.slice(0, 4));
      const last  = parseInt(sorted[sorted.length - 1].snapshot_date.slice(0, 4));
      const step  = Math.max(1, Math.ceil((last - first) / 5));
      return Array.from({ length: 6 }, (_, i) => Math.min(first + i * step, last));
    }
    return [1900, 1925, 1950, 1975, 2000, 2025];
  }, [isMobile, mobileStartYear, usingRealData, sorted]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div className="replay-grid" style={{ flex: 1, padding: 'var(--pad-screen)', display: 'grid', gap: 'var(--gap-grid)', minHeight: 0 }}>

        {/* LEFT COLUMN: Controls, Graph and Scrubber */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
          
          {/* Header & Controls Panel */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexDirection: isRtl ? 'row-reverse' : 'row',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ flex: '1 1 300px', textAlign: isRtl ? 'right' : 'left' }}>
              <div className="bi-eyebrow">{t('replay.title')}</div>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--ink-1)' }}>
                {usingRealData
                  ? t('replay.subtitle', { start: sorted[0]?.snapshot_date?.slice(0, 4), count: sorted.length })
                  : t('replay.subtitleFallback')}
              </h1>
            </div>

            {/* Playback & Speed controls */}
            <div style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: isRtl ? 'flex-end' : 'flex-start',
              flexDirection: isRtl ? 'row-reverse' : 'row'
            }}>
              <div style={{ display: 'flex', gap: 4, background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 8, padding: 3, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <button
                  onClick={() => handlePlayControl('jump-start')}
                  title={isRtl ? 'קפוץ להתחלה' : 'Jump to Start'}
                  style={{
                    width: 32, height: 28, display: 'grid', placeItems: 'center',
                    border: 'none', background: 'transparent', color: 'var(--ink-3)',
                    cursor: 'pointer', borderRadius: 4, transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-3)'; }}
                >⏮</button>
                <button
                  onClick={() => handlePlayControl(isPlaying && playDirection === 'backward' ? 'pause' : 'play-reverse')}
                  title={isPlaying && playDirection === 'backward' ? (isRtl ? 'השהה' : 'Pause') : (isRtl ? 'נגן לאחור' : 'Play Backwards')}
                  style={{
                    width: 32, height: 28, display: 'grid', placeItems: 'center',
                    border: 'none', background: (isPlaying && playDirection === 'backward') ? 'var(--panel-3)' : 'transparent',
                    color: (isPlaying && playDirection === 'backward') ? 'var(--ink-1)' : 'var(--ink-3)',
                    cursor: 'pointer', borderRadius: 4, transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = (isPlaying && playDirection === 'backward') ? 'var(--ink-1)' : 'var(--ink-3)'; }}
                >
                  {isPlaying && playDirection === 'backward' ? '⏸' : '◀'}
                </button>
                <button
                  onClick={() => handlePlayControl(isPlaying && playDirection === 'forward' ? 'pause' : 'play-forward')}
                  title={isPlaying && playDirection === 'forward' ? (isRtl ? 'השהה' : 'Pause') : (isRtl ? 'נגן קדימה' : 'Play Forwards')}
                  style={{
                    width: 32, height: 28, display: 'grid', placeItems: 'center',
                    border: 'none', background: (isPlaying && playDirection === 'forward') ? 'var(--panel-3)' : 'transparent',
                    color: (isPlaying && playDirection === 'forward') ? 'var(--ink-1)' : 'var(--ink-3)',
                    cursor: 'pointer', borderRadius: 4, transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = (isPlaying && playDirection === 'forward') ? 'var(--ink-1)' : 'var(--ink-3)'; }}
                >
                  {isPlaying && playDirection === 'forward' ? '⏸' : '▶'}
                </button>
                <button
                  onClick={() => handlePlayControl('jump-end')}
                  title={isRtl ? 'קפוץ לסוף' : 'Jump to End'}
                  style={{
                    width: 32, height: 28, display: 'grid', placeItems: 'center',
                    border: 'none', background: 'transparent', color: 'var(--ink-3)',
                    cursor: 'pointer', borderRadius: 4, transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-3)'; }}
                >⏭</button>
              </div>

              <div style={{ width: 1, background: 'var(--hairline)', margin: '0 4px', height: 20 }} />

              <div style={{ display: 'flex', gap: 3, background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 8, padding: 3, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                {(['1×', '2×', '8×', '64×'] as Speed[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    style={{
                      padding: '4px 8px', display: 'grid', placeItems: 'center',
                      border: 'none', borderRadius: 4,
                      fontFamily: 'var(--font-mono)', fontSize: 11,
                      color: speed === s ? 'var(--ink-1)' : 'var(--ink-3)',
                      background: speed === s ? 'var(--panel-3)' : 'transparent',
                      cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.15s'
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart & Timeline Card */}
          <div className="bi-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <h2 className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', margin: 0 }}>
                  {t('replay.riskScoreLabel', { range: usingRealData ? `${sorted[0]?.snapshot_date?.slice(0, 4)} → ${isRtl ? 'היום' : 'TODAY'}` : `1900 → ${isRtl ? 'היום' : 'TODAY'}` })}
                </h2>
                {isPlaying && playDirection === 'backward' && (
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--t-8)', fontWeight: 600, letterSpacing: '0.08em' }}
                  >
                    {t('replay.rewind')}
                  </motion.span>
                )}
              </div>

              {isMobile && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', direction: 'ltr' }}>
                  <button
                    onClick={() => handleDecadeChange(mobileStartYear - 10)}
                    disabled={mobileStartYear <= Math.floor(startYear / 10) * 10}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid var(--hairline)',
                      borderRadius: 6,
                      background: 'var(--panel-2)',
                      color: 'var(--ink-1)',
                      fontSize: 12,
                      cursor: 'pointer',
                      opacity: mobileStartYear <= Math.floor(startYear / 10) * 10 ? 0.35 : 1,
                    }}
                  >
                    ‹ {isRtl ? 'קודם' : 'Prev'}
                  </button>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink-1)', fontWeight: 600, minWidth: 46, textAlign: 'center' }}>
                    {mobileStartYear}s
                  </span>
                  <button
                    onClick={() => handleDecadeChange(mobileStartYear + 10)}
                    disabled={mobileStartYear >= Math.floor(endYear / 10) * 10}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid var(--hairline)',
                      borderRadius: 6,
                      background: 'var(--panel-2)',
                      color: 'var(--ink-1)',
                      fontSize: 12,
                      cursor: 'pointer',
                      opacity: mobileStartYear >= Math.floor(endYear / 10) * 10 ? 0.35 : 1,
                    }}
                  >
                    {isRtl ? 'הבא' : 'Next'} ›
                  </button>
                </div>
              )}
            </div>

            <div
              ref={chartContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              style={{
                width: '100%',
                aspectRatio: '1280 / 360',
                position: 'relative',
                cursor: isPlaying ? 'pointer' : 'ew-resize',
                userSelect: 'none',
              }}
            >
              <svg viewBox="0 0 1280 360" width="100%" height="100%" style={{ display: 'block', pointerEvents: 'none' }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <line key={i} x1="0" x2="1280" y1={20 + i * 65} y2={20 + i * 65} stroke="var(--hairline)" strokeDasharray="2 4" />
                ))}
                <rect x="0" y="20" width="1280" height="65" fill="var(--t-8)" opacity="0.04" />

                {chartPath && (
                  <>
                    <defs>
                      <linearGradient id="replayAreaGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="var(--t-9)" />
                        <stop offset="1" stopColor="var(--t-1)" />
                      </linearGradient>
                    </defs>
                    <path d={chartPath + ' L 1280 280 L 0 280 Z'} fill="url(#replayAreaGrad)" opacity="0.12" />
                    <motion.path
                      d={chartPath}
                      fill="none"
                      stroke="var(--ink-2)"
                      strokeWidth="1.4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.4, ease: 'easeOut' }}
                    />
                  </>
                )}

                {crisisMarkers.map(m => (
                  <g key={m.year}>
                    <line x1={m.x} x2={m.x} y1="20" y2="280"
                      stroke="var(--hairline-2)" strokeDasharray="2 3" strokeWidth="1" opacity="0.8" />
                    <text x={m.x} y="300" fontSize="9" fontFamily="var(--font-mono)"
                      fill="var(--ink-4)" textAnchor="middle" letterSpacing="0.04em">
                      {m.year}
                    </text>
                    <text x={m.x} y="314" fontSize="8" fontFamily="var(--font-mono)"
                      fill="var(--ink-5)" textAnchor="middle">
                      {m.label.toUpperCase()}
                    </text>
                  </g>
                ))}

                {/* Scrub cursor line */}
                {(() => {
                  const pts = usingRealData ? sorted : fallback.map((v, i) => ({ composite_score: v * 100, _i: i }));
                  const activePt = pts[clampedIdx];
                  if (!activePt) return null;
                  
                  const t = getPointTimeMs(activePt, clampedIdx);
                  if (t < timelineBounds.firstMs || t > timelineBounds.lastMs) {
                    return null;
                  }
                  
                  const x = ((t - timelineBounds.firstMs) / (timelineBounds.lastMs - timelineBounds.firstMs)) * 1280;
                  const y = currentSnap
                    ? 20 + (1 - currentScore / 100) * 260
                    : 20 + (1 - (fallback[clampedIdx] ?? 0.58)) * 260;
                  return (
                    <g>
                      <line x1={x} x2={x} y1="20" y2="280" stroke="var(--ink-1)" strokeWidth="1.5" opacity="0.7" />
                      <circle cx={x} cy={y} r="5" fill={tempVar(currentScore)} stroke="var(--bg)" strokeWidth="2" />
                    </g>
                  );
                })()}

                {[0, 25, 50, 75, 100].map((m, i) => (
                  <text key={m} x={isRtl ? '1272' : '8'} y={20 + (4 - i) * 65 + 4} fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-4)" textAnchor={isRtl ? 'end' : 'start'}>{m}</text>
                ))}
              </svg>
            </div>

            {/* Timeline Year Labels Scale */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginTop: 10, borderTop: '1px solid var(--hairline)', paddingTop: 10, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              {scrubYears.map(y => (
                <div key={y} className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', userSelect: 'none' }}>
                  {y}
                </div>
              ))}
            </div>

            {/* Financial News Wire Panel */}
            {(() => {
              const activeKey = `${displayYear}-${displayedValues.date.slice(5, 7)}`;
              
              // Retrieve baseline news object
              const newsBase = MONTHLY_EVENTS[activeKey] || YEARLY_BACKDROPS[parseInt(displayYear, 10)] || {
                title: "Stable Market Regime",
                desc: "No major systemic crises recorded. General market parameters remain within normal statistical bounds.",
                impact: "STABLE",
                imgUrl: "/images/news/news-stable.jpg"
              };

              // Localize dynamically
              const news = {
                ...newsBase,
                title: activeKey in MONTHLY_EVENTS 
                  ? t(`replay.monthlyEvents.${activeKey}.title`)
                  : (parseInt(displayYear, 10) in YEARLY_BACKDROPS 
                    ? t(`replay.yearlyEvents.${displayYear}.title`) 
                    : (isRtl ? 'משטר שוק יציב' : 'Stable Market Regime')),
                desc: activeKey in MONTHLY_EVENTS
                  ? t(`replay.monthlyEvents.${activeKey}.desc`)
                  : (parseInt(displayYear, 10) in YEARLY_BACKDROPS
                    ? t(`replay.yearlyEvents.${displayYear}.desc`)
                    : (isRtl ? 'לא נרשמו משברים מערכתיים משמעותיים. מדדי השוק הכלליים נותרו בטווחים סטטיסטיים נורמליים.' : 'No major systemic crises recorded. General market parameters remain within normal statistical bounds.')),
              };
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: isRtl ? 'right' : 'left' }}>
                  <div style={{ height: '1px', background: 'var(--hairline)', margin: '20px 0 16px 0' }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>{isRtl ? 'מבזק חדשות היסטורי' : 'HISTORICAL NEWS WIRE'}</span>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: getImpactColor(news.impact), animation: 'pulseGlow 1.5s infinite' }} />
                  </div>

                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: 'var(--panel-2)', border: '1px solid var(--hairline)', padding: 14, borderRadius: 8, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    {!imgError ? (
                      <Image
                        src={news.imgUrl}
                        alt={news.title}
                        width={80}
                        height={80}
                        onError={() => setImgError(true)}
                        style={{
                          borderRadius: 6,
                          objectFit: 'cover',
                          border: '1px solid var(--hairline-2)',
                          flexShrink: 0,
                          background: 'var(--panel-3)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 6,
                          background: `linear-gradient(135deg, ${getImpactColor(news.impact)}1A 0%, ${getImpactColor(news.impact)}33 100%)`,
                          border: `1px solid ${getImpactColor(news.impact)}4D`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 24 }}>
                          {news.impact === 'CRITICAL' || news.impact === 'HIGH' ? '⚠️' : '📰'}
                        </span>
                        <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: getImpactColor(news.impact), opacity: 0.8 }}>
                          {displayYear}
                        </span>
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0, textAlign: isRtl ? 'right' : 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <h3 className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.01em' }}>
                          {news.title.toUpperCase()}
                        </h3>
                        <span
                          className="mono"
                          style={{
                            fontSize: 8.5,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: getImpactBg(news.impact),
                            color: getImpactColor(news.impact),
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {getLocalizedImpact(news.impact)}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.45, margin: '6px 0 0 0', textWrap: 'pretty' }}>
                        {news.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* RIGHT COLUMN: Spinning Dial (Time Dial) and Category Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>
          
          {/* Time Dial Card */}
          <div className="bi-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.10em', alignSelf: isRtl ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
              {isRtl ? 'מד זמן ומצב השוק' : 'TIME DIAL & REAL-TIME STATE'}
            </div>

            {/* Rotating Wheel Plate */}
            <div
              ref={dialRef}
              className="time-dial-wheel"
              onMouseDown={handleDialMouseDown}
              onMouseMove={handleDialMouseMove}
              onTouchStart={handleDialTouchStart}
              onTouchMove={handleDialTouchMove}
              style={{
                position: 'relative',
                width: 250,
                height: 250,
                transformOrigin: 'center center',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 50% 50%, #15151b 0%, #0d0d11 60%, #08080a 100%)',
                boxShadow: `
                  0 12px 36px rgba(0,0,0,0.65), 
                  inset 0 1px 0 rgba(255,255,255,0.06), 
                  0 0 30px color-mix(in srgb, ${tempVar(displayScore)} 18%, transparent)
                `,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 'auto',
                transition: 'box-shadow 0.25s ease',
                cursor: isDialDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                userSelect: 'none',
              }}
            >
              {/* Outer physical ticks bezel */}
              <div
                style={{
                  position: 'absolute',
                  width: '92%',
                  height: '92%',
                  borderRadius: '50%',
                  border: '1.5px solid var(--hairline-2)',
                  opacity: 0.5,
                }}
              />

              {/* Indicator Needle at 12 o'clock */}
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderTop: `10px solid ${tempVar(displayScore)}`,
                  zIndex: 20,
                  filter: `drop-shadow(0 0 5px ${tempVar(displayScore)})`,
                  transition: 'border-top-color 0.25s ease',
                }}
              />

              {/* ROTATING CONTENT WHEEL */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isPlaying && speed === '64×' ? 'none' : 'transform 0.08s linear',
                  willChange: 'transform',
                }}
              >
                {/* 72 Chronometer bezel ticks */}
                {Array.from({ length: 72 }).map((_, idx) => {
                  const tickAngle = idx * 5;
                  const isMajor = tickAngle % 30 === 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${tickAngle}deg) translateY(-114px)`,
                        width: '1.5px',
                        height: isMajor ? '7px' : '4px',
                        background: isMajor ? 'var(--ink-2)' : 'var(--ink-4)',
                        opacity: isMajor ? 0.8 : 0.4,
                      }}
                    />
                  );
                })}

                {/* Ferris-Wheel Upright Year Labels */}
                {dialYearLabels.map(y => {
                  const labelAngle = ((y - startYear) / yearSpan) * 360;
                  // Compute text color based on proximity to active year
                  const isMatch = displayYear === y.toString();

                  return (
                    <div
                      key={y}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        // Double rotation keeps letters perfectly horizontal as wheel revolves
                        transform: `translate(-50%, -50%) rotate(${labelAngle}deg) translateY(-94px) rotate(${- (wheelRotation + labelAngle)}deg)`,
                        fontFamily: 'var(--font-mono)',
                        fontSize: isMatch ? '11px' : '9.5px',
                        fontWeight: isMatch ? 600 : 400,
                        color: isMatch ? 'var(--ink-1)' : 'var(--ink-4)',
                        transition: 'color 0.18s, font-size 0.18s',
                        pointerEvents: 'none',
                        textAlign: 'center',
                        width: 32,
                      }}
                    >
                      {y}
                    </div>
                  );
                })}
              </div>

              {/* STATIC CENTER CORE DIAL */}
              <div
                style={{
                  position: 'absolute',
                  width: '62%',
                  height: '62%',
                  borderRadius: '50%',
                  background: 'var(--panel)',
                  border: '1.5px solid var(--hairline-2)',
                  boxShadow: 'inset 0 4px 14px rgba(0,0,0,0.85), 0 3px 6px rgba(0,0,0,0.4)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                {/* Score halo pulse in background */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, color-mix(in srgb, ${tempVar(displayScore)} 18%, transparent) 0%, transparent 70%)`,
                    animation: isPlaying ? 'pulseGlow 2.5s ease-in-out infinite' : 'none',
                    pointerEvents: 'none',
                  }}
                />

                <div className="mono" style={{ fontSize: 9.5, color: tempVar(displayScore), letterSpacing: '0.08em', marginBottom: 2, fontWeight: 600 }}>
                  {t('riskTiers.' + riskTier(displayScore).tier.toLowerCase() + '.tier').toUpperCase()}
                </div>

                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 200,
                    color: tempVar(displayScore),
                    fontFamily: 'var(--font-display)',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    transition: 'color 0.25s ease',
                  }}
                >
                  <OdometerText text={displayScore.toString()} direction={playDirection} />
                </div>

                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500, marginTop: 4, letterSpacing: '0.02em', flexDirection: isRtl ? 'row-reverse' : 'row', display: 'flex', gap: 4 }}>
                  <OdometerText text={displayMonth.toUpperCase()} direction={playDirection} />
                  <span style={{ color: 'var(--ink-4)' }}>·</span>
                  <OdometerText text={displayYear} direction={playDirection} />
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown Panel */}
          <div className="bi-card" style={{ padding: '20px 24px', textAlign: isRtl ? 'right' : 'left' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.10em', marginBottom: 14 }}>
              {isRtl ? 'אחוזוני מדדי משנה' : 'SUB-COMPONENTS PERCENTILES'}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { id: 'valuation', label: isRtl ? `${t('indicators.rowLabels.valuation.name')} (${ABBR.valuation})` : 'VALUATIONS (VAL)', score: valScore },
                { id: 'macro_stress', label: isRtl ? `${t('indicators.rowLabels.macro_stress.name')} (${ABBR.macro_stress})` : 'MACRO STRESS (MAC)', score: macScore },
                { id: 'leverage_credit', label: isRtl ? `${t('indicators.rowLabels.leverage_credit.name')} (${ABBR.leverage_credit})` : 'LEVERAGE & CREDIT (LEV)', score: levScore },
                { id: 'sentiment', label: isRtl ? `${t('indicators.rowLabels.sentiment.name')} (${ABBR.sentiment})` : 'SENTIMENT TRENDS (SEN)', score: senScore },
                { id: 'concentration', label: isRtl ? `${t('indicators.rowLabels.concentration.name')} (${ABBR.concentration})` : 'CONCENTRATION (CON)', score: conScore },
              ].map((c) => (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>{c.label}</span>
                    <span className="mono tnum" style={{ fontSize: 11, color: tempVar(c.score), fontWeight: 600 }}>{c.score.toFixed(0)}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--panel-2)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.score}%` }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      style={{ height: '100%', background: tempVar(c.score), borderRadius: 2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 0.95; transform: scale(1.08); }
        }
        .replay-grid {
          grid-template-columns: minmax(0, 1fr) 380px;
        }
        @media (max-width: 900px) {
          .replay-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @media (max-width: 480px) {
          .time-dial-wheel {
            transform: scale(0.8) !important;
            transform-origin: center center;
          }
        }
      `}</style>
    </div>
  );
}
