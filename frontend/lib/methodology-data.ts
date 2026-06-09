// Shared methodology category data — used by both Server Components (route metadata,
// sitemap, generateStaticParams) and Client Components (ScreenMethodology, ScreenMethodologyDetail).

export interface CategorySummary {
  id: string;
  display_name: string;
  weight: number;
  score: number | null;
  summary: string;
  why: string;
}

export const CATEGORY_IDS = [
  'valuation',
  'macro_stress',
  'leverage_credit',
  'sentiment',
  'concentration',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const STATIC_CATEGORIES: CategorySummary[] = [
  {
    id: 'valuation',
    display_name: 'Valuation',
    weight: 0.30,
    score: null,
    summary: 'Is the market overvalued relative to history and to actual economic output?',
    why: 'High valuations historically precede major corrections; mean-reversion is the strongest single signal across 124 years.',
  },
  {
    id: 'macro_stress',
    display_name: 'Macro Stress',
    weight: 0.20,
    score: null,
    summary: 'How healthy is the broader economy, and is monetary policy tightening into a slowdown?',
    why: 'Inverted yield curves have preceded every US recession since 1955. Macro stress is a leading indicator on a 6–18 month lag.',
  },
  {
    id: 'leverage_credit',
    display_name: 'Leverage & Credit',
    weight: 0.20,
    score: null,
    summary: 'How much systemic leverage and credit stress is embedded in the market right now?',
    why: 'Bubbles pop when leveraged players are forced to unwind. Credit spreads widen weeks before equity drawdowns.',
  },
  {
    id: 'sentiment',
    display_name: 'Sentiment',
    weight: 0.15,
    score: null,
    summary: 'Is fear or euphoria the dominant mood among market participants?',
    why: 'Sentiment extremes are contrarian signals. The trend in fear matters more than the absolute level.',
  },
  {
    id: 'concentration',
    display_name: 'Concentration',
    weight: 0.15,
    score: null,
    summary: 'How fragile is the index? Does performance rely on a handful of mega-caps?',
    why: 'When 10 stocks drive an index, a shock in one sector takes the whole market down.',
  },
];

export interface Metric {
  name: string;
  description: string;
  thresholds: { label: string; value: string; level: number }[];
  source: string;
}

export interface Episode {
  date: string;
  event: string;
  signal: string;
  outcome: string;
}

export interface CategoryDetail {
  id: string;
  display_name: string;
  weight: number;
  tagline: string;
  overview: string;
  why_matters: string;
  mechanics: string;
  metrics: Metric[];
  episodes: Episode[];
  interpretation: { range: string; label: string; description: string; level: number }[];
  sources: { author: string; title: string; year: string }[];
}

export const DETAILS: Record<string, CategoryDetail> = {
  valuation: {
    id: 'valuation',
    display_name: 'Valuation',
    weight: 30,
    tagline: 'Are markets priced for perfection, or for disappointment?',
    overview:
      'Valuation compares current market prices to fundamental measures of economic output and corporate earnings. When prices detach from the underlying reality of what businesses actually produce, a reversion toward fair value becomes increasingly likely. This category aggregates multiple metrics to create a robust picture of whether the market is cheap, fair, or dangerously expensive.',
    why_matters:
      'High valuations are the single best long-term predictor of poor forward returns. Across 124 years of US market history, every major bubble has been preceded by extreme valuations: the 1929 crash, the dot-com collapse, and the 2022 correction all began from elevated starting points. Overvaluation does not tell you when the market will correct, but it tells you the risk/reward is skewed unfavorably.',
    mechanics:
      'Each metric is normalized against a 20-year rolling window and scored 0–100 (a score of 70 means more extreme than 70% of historical readings). The Valuation category combines multiple normalized metrics using equal weighting, then contributes 30% of the overall composite score.',
    metrics: [
      {
        name: 'Shiller CAPE (PE10)',
        description:
          'Cyclically Adjusted Price-to-Earnings ratio: divides the S&P 500 price by the 10-year rolling average of real (inflation-adjusted) earnings. Developed by Nobel laureate Robert Shiller, it smooths out business-cycle volatility in earnings.',
        thresholds: [
          { label: 'Undervalued', value: '< 15', level: 0 },
          { label: 'Fair Value', value: '15 – 22', level: 2 },
          { label: 'Elevated', value: '22 – 30', level: 5 },
          { label: 'High', value: '30 – 37', level: 7 },
          { label: 'Extreme', value: '> 37', level: 9 },
        ],
        source: 'Robert J. Shiller, Yale University (shillerdata.com)',
      },
      {
        name: 'Buffett Indicator',
        description:
          'Total US stock market capitalisation divided by nominal GDP. Warren Buffett described it in 2001 as "the best single measure of where valuations stand at any given moment." It captures how much of the real economy is priced into equities.',
        thresholds: [
          { label: 'Undervalued', value: '< 75%', level: 0 },
          { label: 'Fair Value', value: '75 – 100%', level: 2 },
          { label: 'Elevated', value: '100 – 135%', level: 5 },
          { label: 'High', value: '135 – 165%', level: 7 },
          { label: 'Extreme', value: '> 165%', level: 9 },
        ],
        source: 'Warren Buffett, Fortune Magazine (2001); Wilshire 5000 / BEA GDP',
      },
      {
        name: 'Price-to-Sales (P/S)',
        description:
          'Market capitalisation divided by aggregate revenues of S&P 500 companies. Unlike P/E, it cannot be distorted by earnings manipulation or temporarily depressed earnings during recessions. A reliable cross-cycle measure.',
        thresholds: [
          { label: 'Cheap', value: '< 1.2', level: 0 },
          { label: 'Fair', value: '1.2 – 1.8', level: 2 },
          { label: 'Rich', value: '1.8 – 2.4', level: 5 },
          { label: 'Very Rich', value: '2.4 – 3.0', level: 7 },
          { label: 'Extreme', value: '> 3.0', level: 9 },
        ],
        source: 'S&P Global, Bloomberg Financial Data',
      },
    ],
    episodes: [
      { date: 'Sep 1929', event: 'Great Crash', signal: 'Shiller CAPE ~32.5', outcome: 'Dow Jones fell 89% by 1932' },
      { date: 'Mar 2000', event: 'Dot-com Peak', signal: 'Shiller CAPE 44.2, an all-time high at the time', outcome: 'S&P 500 fell 49% over 2000–2002' },
      { date: 'Oct 2007', event: 'Pre-GFC Peak', signal: 'CAPE ~27, Buffett Indicator ~110%', outcome: 'S&P 500 fell 57% over 2007–2009' },
      { date: 'Jan 2022', event: 'Post-COVID Peak', signal: 'CAPE ~40, Buffett Indicator ~210% (all-time high)', outcome: 'S&P 500 fell 25% in 2022 bear market' },
    ],
    interpretation: [
      { range: '0 – 30', label: 'Low Risk', description: 'Valuations are below or near historical averages. Risk/reward is favorable.', level: 1 },
      { range: '30 – 55', label: 'Moderate', description: 'Moderately elevated. Not alarming but warrants monitoring.', level: 4 },
      { range: '55 – 75', label: 'Elevated', description: 'Significantly above historical norms. Forward returns are likely muted.', level: 6 },
      { range: '75 – 100', label: 'Extreme', description: 'Historically rare territory. Major corrections have originated from these levels.', level: 9 },
    ],
    sources: [
      { author: 'Shiller, R.J.', title: 'Irrational Exuberance', year: '2000, 2015' },
      { author: 'Shiller, R.J. & Campbell, J.Y.', title: 'Stock Prices, Earnings and Expected Dividends', year: '1988' },
      { author: 'Buffett, W.', title: 'Buy American. I Am. (Fortune)', year: '2001' },
      { author: 'Hussman, J.', title: 'Weekly Market Comment (HussmanFunds.com)', year: '2000–present' },
    ],
  },

  macro_stress: {
    id: 'macro_stress',
    display_name: 'Macro Stress',
    weight: 20,
    tagline: 'The economy is the tide, and bubbles need a rising tide.',
    overview:
      'Macro Stress captures how healthy the broader economy is and whether monetary policy is tightening into a slowdown. It focuses on leading indicators (signals that change before the broader economy turns) and is designed to flag stress 6 to 18 months before it becomes visible in corporate earnings or unemployment data.',
    why_matters:
      'Bubbles rarely burst in isolation. They almost always coincide with a macro turning point: rising rates choking off cheap money, or credit conditions deteriorating before equity prices reflect it. The yield curve has preceded every US recession since 1955 with no false negatives, making it one of the most reliable macro signals in financial history.',
    mechanics:
      'Indicators are normalised relative to their own 20-year history. An inverted yield curve, tightening Fed, and falling Leading Economic Index all contribute positively to the stress score. The stress component has a natural 6–18 month forward lag relative to actual economic turning points.',
    metrics: [
      {
        name: 'Yield Curve (10Y – 2Y)',
        description:
          'The spread between 10-year and 2-year US Treasury yields. When short-term rates exceed long-term rates (inversion), the market is pricing in future rate cuts, typically because it expects a recession. This signal has preceded every US recession since 1955, with an average lead time of 12–18 months.',
        thresholds: [
          { label: 'Steep (Strong Growth)', value: '> +150bps', level: 0 },
          { label: 'Normal', value: '+50 to +150bps', level: 2 },
          { label: 'Flat (Caution)', value: '0 to +50bps', level: 4 },
          { label: 'Inverted (Warning)', value: '-50 to 0bps', level: 7 },
          { label: 'Deeply Inverted', value: '< -50bps', level: 9 },
        ],
        source: 'US Treasury / FRED (DGS10, DGS2); NY Fed Recession Probability Model',
      },
      {
        name: 'Federal Funds Rate (Real)',
        description:
          'The Fed\'s policy rate minus inflation (CPI). When the real rate is sharply positive and rising, borrowing is genuinely expensive: this tightens financial conditions and raises the discount rate applied to future earnings, pressuring equity valuations.',
        thresholds: [
          { label: 'Accommodative', value: '< 0%', level: 1 },
          { label: 'Neutral', value: '0 – 1%', level: 2 },
          { label: 'Mild Tightening', value: '1 – 2%', level: 4 },
          { label: 'Restrictive', value: '2 – 3%', level: 7 },
          { label: 'Very Restrictive', value: '> 3%', level: 9 },
        ],
        source: 'Federal Reserve (federalreserve.gov); BLS CPI-U',
      },
      {
        name: 'Conference Board LEI',
        description:
          'The Leading Economic Index, a composite of 10 forward-looking indicators including manufacturing hours, building permits, consumer expectations, and credit conditions. Three consecutive monthly declines have historically signalled a recession within 6–12 months.',
        thresholds: [
          { label: 'Expanding', value: 'Rising MoM', level: 1 },
          { label: 'Slowing', value: 'Flat (±0.1%)', level: 4 },
          { label: 'Contracting', value: '1–2 months declining', level: 6 },
          { label: 'Recession Signal', value: '3+ months declining', level: 9 },
        ],
        source: 'The Conference Board (conference-board.org)',
      },
    ],
    episodes: [
      { date: 'Dec 1999', event: 'Pre Dot-com', signal: 'Yield curve inverted; Fed tightening aggressively', outcome: 'Nasdaq fell 78% over 2000–2002' },
      { date: 'Aug 2006', event: 'Pre-GFC', signal: '10Y–2Y inverted; LEI declining 6 months', outcome: 'S&P 500 fell 57% over 2007–2009' },
      { date: 'Aug 2019', event: 'Pre-COVID (brief inversion)', signal: 'Yield curve briefly inverted', outcome: 'Mild recession in 2020 (COVID accelerated)' },
      { date: 'Mar 2022', event: 'Inflation Shock Tightening', signal: 'Most aggressive Fed hike cycle since 1981; curve inverted to -100bps', outcome: 'S&P 500 -25%, bond market worst year in 100+ years' },
    ],
    interpretation: [
      { range: '0 – 25', label: 'Benign', description: 'Macro environment is supportive. Economy is healthy and policy is accommodative.', level: 1 },
      { range: '25 – 50', label: 'Cautious', description: 'Some signals of tightening or slowdown. Risk of deterioration in 6–12 months.', level: 4 },
      { range: '50 – 75', label: 'Stressed', description: 'Multiple indicators flashing warning. Recession probability is elevated.', level: 7 },
      { range: '75 – 100', label: 'Critical', description: 'Conditions consistent with late-cycle or recession onset. Historical analog: pre-2008.', level: 9 },
    ],
    sources: [
      { author: 'Estrella, A. & Mishkin, F.S.', title: 'Predicting U.S. Recessions: Financial Variables as Leading Indicators', year: '1998' },
      { author: 'Friedman, M.', title: 'A Program for Monetary Stability', year: '1960' },
      { author: 'Federal Reserve Bank of New York', title: 'Yield Curve as a Predictor of Recessions', year: 'Updated quarterly' },
      { author: 'The Conference Board', title: 'US Leading Economic Index Methodology', year: 'Ongoing' },
    ],
  },

  leverage_credit: {
    id: 'leverage_credit',
    display_name: 'Leverage & Credit',
    weight: 20,
    tagline: 'Debt is the accelerant. Credit spreads are the smoke detector.',
    overview:
      'Leverage & Credit measures how much systemic debt is embedded in the financial system, and how the credit market is pricing the probability of defaults and stress. Credit markets are typically smarter and more forward-looking than equity markets: they sense trouble before stock prices reflect it. When spreads widen, it means lenders are demanding more compensation for risk they are beginning to see.',
    why_matters:
      'Almost every major financial crisis in history was preceded by a credit bubble. Irving Fisher\'s Debt-Deflation Theory (1933) described the self-reinforcing spiral: falling asset prices trigger margin calls, forced selling drives prices lower, which triggers more margin calls. Credit spreads are the earliest warning because the bond market prices defaults before equity investors acknowledge them.',
    mechanics:
      'High Yield and Investment Grade credit spreads are normalised against their 20-year history. Margin debt as a percentage of GDP is tracked for systemic leverage. Each component is scored 0–100 and combined to produce the Leverage & Credit category score, which contributes 20% of the composite.',
    metrics: [
      {
        name: 'High Yield (HY) OAS',
        description:
          'The Option-Adjusted Spread of the ICE BofA US High Yield Index: the extra yield "junk" bonds pay above equivalent Treasuries. When HY spreads widen sharply, it signals credit stress and that lenders are pulling back from risky borrowers. This typically leads equity market stress by 4–12 weeks.',
        thresholds: [
          { label: 'Tight (Risk-On)', value: '< 300bps', level: 1 },
          { label: 'Normal', value: '300 – 450bps', level: 2 },
          { label: 'Elevated', value: '450 – 650bps', level: 5 },
          { label: 'Stress', value: '650 – 900bps', level: 7 },
          { label: 'Crisis', value: '> 900bps', level: 9 },
        ],
        source: 'ICE BofA Index (FRED: BAMLH0A0HYM2)',
      },
      {
        name: 'Investment Grade (IG) Spread',
        description:
          'The extra yield investment-grade corporate bonds pay above Treasuries. IG spreads are less volatile than HY but serve as an important cross-check: when even high-quality borrowers see spreads widen significantly, systemic stress is broad-based.',
        thresholds: [
          { label: 'Tight', value: '< 80bps', level: 1 },
          { label: 'Normal', value: '80 – 150bps', level: 2 },
          { label: 'Elevated', value: '150 – 250bps', level: 5 },
          { label: 'Stress', value: '250 – 400bps', level: 7 },
          { label: 'Crisis', value: '> 400bps', level: 9 },
        ],
        source: 'ICE BofA IG Index (FRED: BAMLC0A0CM)',
      },
      {
        name: 'Margin Debt / GDP',
        description:
          'Total margin debt outstanding (money borrowed from brokers to buy securities) as a percentage of GDP. When leverage is high and markets fall, margin calls create forced selling, which drives prices lower and triggers more margin calls: a self-reinforcing spiral described by Hyman Minsky.',
        thresholds: [
          { label: 'Low Leverage', value: '< 1.5% GDP', level: 1 },
          { label: 'Normal', value: '1.5 – 2.5% GDP', level: 3 },
          { label: 'Elevated', value: '2.5 – 3.5% GDP', level: 6 },
          { label: 'High Risk', value: '> 3.5% GDP', level: 9 },
        ],
        source: 'FINRA Monthly Margin Statistics; BEA GDP',
      },
    ],
    episodes: [
      { date: '2007 – 2008', event: 'Global Financial Crisis', signal: 'HY spreads rose from 250bps to 2,000bps over 18 months', outcome: 'S&P 500 fell 57%; global credit markets froze' },
      { date: 'Sep 2008', event: 'Lehman Collapse', signal: 'TED Spread hit 460bps; overnight funding markets seized', outcome: 'Worst financial crisis since 1929' },
      { date: 'Mar 2020', event: 'COVID Crash', signal: 'HY spreads hit 1,100bps in 3 weeks', outcome: 'S&P 500 fell 34% in 33 days; Fed intervened at record speed' },
      { date: '2022', event: 'Rate Shock Bear Market', signal: 'HY spreads reached 600bps as Fed hiked 425bps in 12 months', outcome: 'S&P 500 fell 25%; bond market worst year in 100+ years' },
    ],
    interpretation: [
      { range: '0 – 25', label: 'Low Stress', description: 'Credit is flowing freely. Spreads are tight, leverage is contained.', level: 1 },
      { range: '25 – 50', label: 'Moderate', description: 'Spreads drifting wider. Leverage building. Warrants monitoring.', level: 4 },
      { range: '50 – 75', label: 'Stressed', description: 'Credit tightening visibly. Lenders pulling back. Equity markets typically follow within weeks.', level: 7 },
      { range: '75 – 100', label: 'Crisis Territory', description: 'System-wide credit stress. Consistent with 2008 or 2020-level dislocations.', level: 9 },
    ],
    sources: [
      { author: 'Fisher, I.', title: 'The Debt-Deflation Theory of Great Depressions', year: '1933' },
      { author: 'Minsky, H.', title: 'Stabilizing an Unstable Economy', year: '1986' },
      { author: 'Borio, C. & Lowe, P.', title: 'Asset Prices, Financial and Monetary Stability: Exploring the Nexus (BIS)', year: '2002' },
      { author: 'Reinhart, C. & Rogoff, K.', title: 'This Time Is Different: Eight Centuries of Financial Folly', year: '2009' },
    ],
  },

  sentiment: {
    id: 'sentiment',
    display_name: 'Sentiment',
    weight: 15,
    tagline: 'When everyone is euphoric, nobody is left to buy.',
    overview:
      'Sentiment measures the collective mood of market participants, from retail investors to professional managers. It is a contrarian indicator: when sentiment reaches extremes in either direction, the market often reverses. Euphoria signals complacency and a lack of buyers left; fear and panic signal potential capitulation where sellers are exhausted.',
    why_matters:
      'Markets are driven by the psychology of their participants as much as by fundamentals. Academic research by Baker & Wurgler (2007) showed that high investor sentiment predicts low subsequent returns, particularly for speculative and small-cap stocks. At sentiment extremes, market prices diverge from rational valuations, and those gaps always close eventually.',
    mechanics:
      'The VIX provides a real-time market-implied measure of fear. AAII and Investors Intelligence surveys capture self-reported positioning. The Put/Call ratio reflects actual money at risk. Each signal is normalised against its own history and combined into the Sentiment score, contributing 15% of the composite.',
    metrics: [
      {
        name: 'VIX (Volatility Index)',
        description:
          'The CBOE Volatility Index measures implied volatility of S&P 500 options over the next 30 days. Known as the "Fear Gauge," it rises when market participants are buying protective puts and falls when they are complacent. A persistently low VIX (< 13) is itself a warning sign of excessive complacency.',
        thresholds: [
          { label: 'Complacency (Risk-On)', value: '< 13', level: 8 },
          { label: 'Calm', value: '13 – 18', level: 2 },
          { label: 'Elevated Anxiety', value: '18 – 28', level: 4 },
          { label: 'Fear', value: '28 – 40', level: 6 },
          { label: 'Panic / Capitulation', value: '> 40', level: 1 },
        ],
        source: 'CBOE (cboe.com/vix); launched 1993, back-calculated to 1990',
      },
      {
        name: 'AAII Bull / Bear Spread',
        description:
          'The American Association of Individual Investors runs a weekly survey asking members whether they are Bullish, Neutral, or Bearish over the next 6 months. The Bull-Bear Spread is the percentage of bulls minus bears. Published every Thursday since 1987. Historical average: ~38% bullish, ~30.5% bearish.',
        thresholds: [
          { label: 'Extreme Fear (Opportunity)', value: 'Spread < -30%', level: 1 },
          { label: 'Bearish Sentiment', value: 'Spread -30% to -10%', level: 3 },
          { label: 'Neutral', value: 'Spread -10% to +15%', level: 2 },
          { label: 'Bullish', value: 'Spread +15% to +35%', level: 6 },
          { label: 'Extreme Greed (Warning)', value: 'Spread > +35%', level: 9 },
        ],
        source: 'AAII Investor Sentiment Survey (aaii.com)',
      },
      {
        name: 'Put / Call Ratio',
        description:
          'The ratio of put option volume to call option volume across US equity markets. A high ratio (more puts than calls) signals fear and hedging demand. A very low ratio signals that traders are piling into upside calls with little hedging, a sign of speculative excess that historically coincides with market tops.',
        thresholds: [
          { label: 'Extreme Greed', value: '< 0.6', level: 9 },
          { label: 'Bullish Bias', value: '0.6 – 0.8', level: 6 },
          { label: 'Neutral', value: '0.8 – 1.0', level: 2 },
          { label: 'Cautious', value: '1.0 – 1.2', level: 4 },
          { label: 'Fear / Panic Hedging', value: '> 1.2', level: 1 },
        ],
        source: 'CBOE Daily Market Statistics',
      },
    ],
    episodes: [
      { date: 'Jan 2000', event: 'Dot-com Peak', signal: 'AAII Bulls hit 75% (all-time high); VIX < 20 despite sky-high valuations', outcome: 'S&P 500 -49% over next 2.5 years' },
      { date: 'Mar 2009', event: 'GFC Bottom', signal: 'AAII Bears hit 70%; VIX near 56', outcome: 'S&P 500 +400% over the next decade' },
      { date: 'Nov 2021', event: 'Post-COVID Peak', signal: 'VIX near 15; AAII Bulls ~48%; speculative frenzy in meme stocks and crypto', outcome: 'S&P 500 -25%, Nasdaq -35% in 2022' },
      { date: 'Mar 2020', event: 'COVID Crash Bottom', signal: 'VIX hit 85.47; CNN Fear & Greed at 3/100', outcome: 'Markets bottomed; S&P 500 +114% over next 18 months' },
    ],
    interpretation: [
      { range: '0 – 25', label: 'Fearful Market', description: 'Investors are cautious or panicking. Historically a contrarian buying signal.', level: 1 },
      { range: '25 – 50', label: 'Neutral', description: 'Mixed signals. No strong sentiment extreme in either direction.', level: 3 },
      { range: '50 – 75', label: 'Optimistic', description: 'Bullish sentiment building. Complacency beginning to appear.', level: 6 },
      { range: '75 – 100', label: 'Euphoric', description: 'Extreme greed. Contrarian sell signal: who is left to buy?', level: 9 },
    ],
    sources: [
      { author: 'Baker, M. & Wurgler, J.', title: 'Investor Sentiment in the Stock Market', year: '2007' },
      { author: 'Brown, G.W. & Cliff, M.T.', title: 'Investor Sentiment and the Near-Term Stock Market', year: '2004' },
      { author: 'Shiller, R.J.', title: 'Irrational Exuberance (Chapter on Sentiment)', year: '2000' },
      { author: 'CBOE', title: 'VIX White Paper: CBOE Volatility Index', year: '2009' },
    ],
  },

  concentration: {
    id: 'concentration',
    display_name: 'Concentration',
    weight: 15,
    tagline: 'An index is only as strong as its weakest mega-cap.',
    overview:
      'Concentration measures how fragile the index is, specifically whether its performance is driven by a handful of mega-cap stocks rather than broad participation. When a small number of companies represent an outsize share of the index, a correction in just a few names can drag down the entire market, even if the majority of stocks are healthy.',
    why_matters:
      'The rise of passive investing has created a self-reinforcing concentration dynamic: index funds automatically buy more of the largest stocks as they grow, pushing prices higher, which increases their index weight, which triggers more passive buying. This creates fragility. When the largest holdings sell off (often first in a crisis because they are most liquid), the entire index suffers regardless of the fundamentals of the remaining 490 stocks.',
    mechanics:
      'The primary inputs are: Top 10 Holdings Weight in the S&P 500, the Effective Number of Stocks (derived from the Herfindahl-Hirschman Index), and the divergence between the cap-weighted and equal-weighted S&P 500. Each is normalised and combined to produce the Concentration score.',
    metrics: [
      {
        name: 'Top 10 Holdings Weight',
        description:
          'The combined market capitalisation weight of the 10 largest S&P 500 constituents as a percentage of the total index. The historical average (1980–2010) was 18–22%. When this rises substantially above 28–30%, a shock to any single sector can become a systemic index event.',
        thresholds: [
          { label: 'Diversified', value: '< 20%', level: 1 },
          { label: 'Normal', value: '20 – 25%', level: 2 },
          { label: 'Concentrated', value: '25 – 30%', level: 5 },
          { label: 'High Risk', value: '30 – 35%', level: 7 },
          { label: 'Extreme', value: '> 35%', level: 9 },
        ],
        source: 'S&P Global; FactSet Index Analytics',
      },
      {
        name: 'Cap-Weight vs Equal-Weight Divergence',
        description:
          'The performance gap between the cap-weighted S&P 500 (SPY) and the equal-weighted S&P 500 (RSP, Invesco). When the cap-weighted index significantly outperforms the equal-weighted version, it means a small number of mega-caps are carrying the market while the average stock lags: a classic sign of a narrow, fragile rally.',
        thresholds: [
          { label: 'Broad Rally', value: 'EW outperforming', level: 1 },
          { label: 'Balanced', value: 'Gap < 3% (1-year)', level: 2 },
          { label: 'Narrow', value: 'Gap 3 – 8%', level: 5 },
          { label: 'Very Narrow', value: 'Gap 8 – 15%', level: 7 },
          { label: 'Extreme Narrowness', value: 'Gap > 15%', level: 9 },
        ],
        source: 'Invesco RSP vs SPY (Bloomberg)',
      },
      {
        name: 'Effective Number of Stocks (HHI)',
        description:
          'Derived from the Herfindahl-Hirschman Index applied to index weights, this measures how many stocks are effectively driving index returns. The S&P 500 has 500 components, but if concentration is high, only 50–80 stocks may be "effective" drivers. The lower this number, the more fragile the index.',
        thresholds: [
          { label: 'Well Distributed', value: '> 200 effective stocks', level: 1 },
          { label: 'Moderate', value: '150 – 200', level: 3 },
          { label: 'Concentrated', value: '100 – 150', level: 5 },
          { label: 'High Concentration', value: '60 – 100', level: 7 },
          { label: 'Extreme', value: '< 60', level: 9 },
        ],
        source: 'Herfindahl, O.C. (1950); adapted for equity indices by Research Affiliates',
      },
    ],
    episodes: [
      { date: '1972 – 1974', event: 'Nifty Fifty Bubble', signal: '50 "growth" stocks at P/E 50–90x; dominated institutional portfolios', outcome: 'Nifty Fifty stocks fell 70%+ on average by 1974' },
      { date: '1999 – 2000', event: 'Dot-com Concentration', signal: 'Cisco, Intel, Microsoft dominated; Nasdaq top 10 = ~35% of index', outcome: 'Nasdaq fell 78%; top stocks fell 80–99%' },
      { date: '2007', event: 'Financial Sector Dominance', signal: 'Banks and financials = ~22% of S&P 500', outcome: 'Financial sector fell 80%; S&P 500 fell 57%' },
      { date: '2023 – 2024', event: 'Magnificent 7', signal: 'Apple, Microsoft, Nvidia, Alphabet, Amazon, Meta, Tesla = ~29–33% of S&P 500; drove ~60% of 2023 returns', outcome: 'Ongoing; concentration at highest levels since 1970s' },
    ],
    interpretation: [
      { range: '0 – 25', label: 'Diversified', description: 'Index returns are driven by broad participation. Resilient to single-sector shocks.', level: 1 },
      { range: '25 – 50', label: 'Moderate', description: 'Some narrowing in leadership. Monitor for further concentration.', level: 3 },
      { range: '50 – 75', label: 'Fragile', description: 'A small number of mega-caps are carrying the market. Significant sector-specific vulnerability.', level: 7 },
      { range: '75 – 100', label: 'Extreme Fragility', description: 'Historically rare concentration. A shock to the top holdings will cascade across the entire index.', level: 9 },
    ],
    sources: [
      { author: 'Siegel, J.', title: 'The Nifty Fifty Revisited', year: '1995' },
      { author: 'Herfindahl, O.C.', title: 'Concentration in the Steel Industry (HHI origin)', year: '1950' },
      { author: 'Arnott, R. (Research Affiliates)', title: 'Reports on Concentration Risk in Passive Investing', year: '2020–2024' },
      { author: 'Goldman Sachs Equity Research', title: 'The Magnificent 7 and Market Concentration', year: '2023' },
    ],
  },
};

export const LEVEL_COLORS: Record<number, string> = {
  0: 'var(--t-0)',
  1: 'var(--t-1)',
  2: 'var(--t-2)',
  3: 'var(--t-3)',
  4: 'var(--t-4)',
  5: 'var(--t-5)',
  6: 'var(--t-6)',
  7: 'var(--t-7)',
  8: 'var(--t-8)',
  9: 'var(--t-9)',
};
