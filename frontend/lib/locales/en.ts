import { STATIC_CATEGORIES, DETAILS } from '../methodology-data';

export const en = {
  common: {
    title: 'BUBBLEINDEX',
    med: 'MED',
    loading: 'LOADING...',
    verdict: 'VERDICT',
    closestAnalog: 'CLOSEST ANALOG',
    similarity: 'SIMILARITY',
    oneMonth: '1M',
    threeMonth: '3M',
    oneYear: '1Y',
    weight: 'WEIGHT',
    score: 'SCORE',
    details: 'DETAILS',
    close: 'Close',
    closeExplanation: 'Close Explanation',
    retry: 'RETRY',
    errorBanner: '⚠ Backend unavailable. Showing demo data. {error}',
    contribution: 'CONTRIBUTION',
    pointsOfScore: 'pts / {score}',
    liveInputs: 'LIVE INPUTS',
    imputed: 'IMPUTED',
  },
  topbar: {
    nav: {
      home: 'Home',
      historical: 'Historical',
      indicators: 'Indicators',
      replay: 'Replay',
      ai: 'AI Insights',
      methodology: 'Methodology',
    },
    paletteTooltip: 'Palette · {palette}',
    tweaksTooltip: 'Tweaks',
  },
  tweaks: {
    title: 'TWEAKS',
    riskScorePreview: 'RISK SCORE PREVIEW · {score}',
    reset: 'RESET',
    gaugeStyle: 'GAUGE STYLE',
    density: 'DENSITY',
    theme: 'THEME',
    palette: 'PALETTE',
    fetching: 'FETCHING...',
    refreshData: '↻ REFRESH DATA',
  },
  home: {
    marketRiskLive: 'MARKET RISK · LIVE',
    compositeLabel: 'S&P 500 Composite',
    aiMarketBrief: 'AI MARKET BRIEF',
    asOf: 'AS OF {date}',
    riskBreakdown: 'RISK BREAKDOWN · {count} CATEGORIES',
    vsMedianTrend: 'VS 50Y MEDIAN · TREND',
    weightLabel: '{weight}% WEIGHT',
    vsMedLabel: '{diff} VS MED',
    territoryLabel: 'Market is in {tier} territory.',
    concentrationAlert: ' Concentration risk elevated: top-10 stocks dominate S&P cap weight.',
    macroAlert: ' Macro stress indicators rising; monitor yield curve and credit spreads.',
  },
  historical: {
    title: 'HISTORICAL ANALYSIS',
    subtitleWithAnalog: 'Closest analog: {analog}.',
    subtitleDefault: 'BubbleIndex risk score, 1990 to today.',
    dataStats: '{count} monthly snapshots · {start} → {end}',
    noData: 'No historical data yet. Run backfill_history.py',
    chartTitle: 'RISK SCORE · HISTORY',
    chartSubtitle: 'MONTHLY · PERCENTILE-BASED',
    bubbleLabel: 'BUBBLE · 75+',
    selectMonth: 'SELECT MONTH',
    noDataForYear: 'No data for {year}',
    compositeScore: 'COMPOSITE SCORE',
    historicalSimilarity: 'HISTORICAL SIMILARITY',
    similarityToToday: 'SIMILARITY TO TODAY',
    peakAndDrawdown: 'PEAK {peak} · DRAWDOWN {drawdown}%',
    peakScoreDrawdown: 'PEAK SCORE & DRAWDOWN',
    drawdownLabel: '({drawdown}% drawdown)',
    recoveryTime: 'RECOVERY TIME',
    whatHappened: 'WHAT HAPPENED & WHY',
    crises: {
      "1929_crash": {
        name: "1929 Wall St. Crash",
        period: "1929 – 1954",
        peak: "89.0",
        drawdown: "-89.0%",
        recovery: "25 Years (Nominal price recovery for DJIA & S&P predecessors)",
        why: "A massive speculative bubble fueled by extreme margin debt and unregulated credit expansion during the 'Roaring Twenties'. When the bubble burst, panic selling triggered a complete banking collapse, leading to the Great Depression, mass unemployment, and a prolonged economic recovery.",
        summary: "The deepest and longest financial crisis in modern history, resetting the global economic order."
      },
      "2000_dotcom": {
        name: "2000 Dot-com Bubble",
        period: "2000 – 2007",
        peak: "94.0",
        drawdown: "-78.0%",
        recovery: "7 Years (S&P 500 nominal recovery, NASDAQ took 15 years)",
        why: "Massive speculation in internet startups ('dot-com' companies), driven by hype surrounding the web and loose monetary conditions. Most startups burned through cash with no path to profitability. The bubble popped in March 2000 as interest rates rose and capital dried up.",
        summary: "A technology-driven speculative mania that wiped out trillions in market value but paved the way for the modern internet."
      },
      "2007_gfc": {
        name: "2008 Subprime / GFC",
        period: "2007 – 2013",
        peak: "81.0",
        drawdown: "-57.0%",
        recovery: "5.5 Years (To recover the October 2007 pre-crisis S&P 500 peak)",
        why: "A housing bubble fueled by high-risk subprime mortgages, predatory lending practices, and the proliferation of complex financial derivatives (MBS/CDOs). The collapse of the mortgage market led to huge banking write-downs, the failure of major investment banks like Lehman Brothers, and a global credit freeze.",
        summary: "A systemic credit and banking crisis that pushed the global financial system to the brink of collapse."
      },
      "2020_covid": {
        name: "2020 Covid Crash",
        period: "2020",
        peak: "67.0",
        drawdown: "-34.0%",
        recovery: "8 Months (Fastest bear market recovery in history)",
        why: "The sudden onset of the COVID-19 pandemic led to government-mandated global lockdowns, halting economic activity, disrupting supply chains, and causing extreme panic. The market bottomed rapidly and staged a historic V-shaped recovery due to unprecedented monetary easing (QE) and fiscal stimulus.",
        summary: "An exogenous health crisis that triggered the sharpest, fastest market decline and recovery in history."
      },
      "2021_meme": {
        name: "2021 Meme / SPAC Era",
        period: "2021 – 2024",
        peak: "86.0",
        drawdown: "-25.0%",
        recovery: "2 Years (S&P 500 reached new all-time highs in January 2024)",
        why: "Zero interest rates, lockdown savings, and government stimulus checks combined with fee-free retail trading apps to create a wave of retail speculation. Traders drove massive surges in 'meme stocks' (GME, AMC), SPACs, and hyper-valued tech/growth stocks. The bubble popped in 2022 due to rising inflation and aggressive Fed rate hikes.",
        summary: "A liquidity-driven retail speculation bubble that collapsed in the face of inflation and monetary tightening."
      }
    }
  },
  indicators: {
    title: 'INDICATORS EXPLORER',
    subtitle: '{count} dimensions of bubble risk, scored monthly.',
    liveData: 'LIVE DATA · {count} MONTHS',
    scale: 'SCALE',
    stable: 'STABLE',
    bubble: 'BUBBLE',
    currentValues: 'Current values',
    rowLabels: {
      valuation: { name: 'Valuation', desc: 'CAPE, P/E VS HISTORY' },
      macro_stress: { name: 'Macro', desc: 'YIELD CURVE, PMI' },
      leverage_credit: { name: 'Leverage', desc: 'MARGIN DEBT, CORP. DEBT' },
      sentiment: { name: 'Sentiment', desc: 'RETAIL FLOWS, SURVEYS' },
      concentration: { name: 'Concentration', desc: 'TOP-10 SHARE OF CAP' },
    }
  },
  replay: {
    title: 'MARKET REPLAY',
    subtitle: '{start} → today, {count} monthly snapshots.',
    subtitleFallback: '125 years of risk, scrubbed.',
    rewind: '◀ REWIND',
    riskScoreLabel: 'RISK SCORE · {range}',
    yearlyEvents: {
      1990: {
        title: "1990 Recession & Oil Shock",
        desc: "US economy enters a recession following the Fed's rate hike campaign and a massive crude oil price shock after Iraq invades Kuwait."
      },
      1991: {
        title: "Operation Desert Storm Begins",
        desc: "Allied military intervention in Iraq triggers a major relief rally on Wall Street as energy market supply fears subside."
      },
      1992: {
        title: "Black Wednesday Currency Panic",
        desc: "The UK is forced to withdraw the Pound Sterling from the European Exchange Rate Mechanism after speculative attacks led by George Soros."
      },
      1993: {
        title: "Clinton Deficit Reduction Plan",
        desc: "President Clinton signs the Omnibus Budget Act, raising taxes on high earners and implementing budget cuts to stabilize federal deficit concerns."
      },
      1994: {
        title: "Surprise Fed Rate Hikes",
        desc: "The Federal Reserve begins a surprise policy tightening campaign, doubling rates and triggering a global crash in bond markets."
      },
      1995: {
        title: "Netscape IPO Sparks Internet Era",
        desc: "Netscape goes public, its shares skyrocketing 108% on day one, triggering the birth of the Dot-com tech speculation bubble."
      },
      1996: {
        title: "Greenspan warns of 'Irrational Exuberance'",
        desc: "Fed Chairman Alan Greenspan warns that markets may be displaying 'irrational exuberance', causing a brief temporary correction in global indices."
      },
      1997: {
        title: "Asian Financial Crisis Spreads",
        desc: "Financial contagion spreads from Thailand across South East Asia, causing currency collapses and forcing emergency IMF bailouts."
      },
      1998: {
        title: "LTCM Hedge Fund Collapse",
        desc: "Russian default triggers extreme volatility, leading to the near-collapse of LTCM. Fed coordinates a $3.6 billion rescue plan."
      },
      1999: {
        title: "Dow Jones Crosses 10,000",
        desc: "The Dow Jones Industrial Average closes above the 10,000 mark for the first time, fueled by tech sector euphoria."
      },
      2000: {
        title: "Dot-com Speculative Bubble Peaks",
        desc: "The NASDAQ Composite peaks at 5,048, marking the absolute high point of the internet technology speculation mania."
      },
      2001: {
        title: "September 11 Terror Attacks",
        desc: "9/11 attacks shut down the US stock market for four sessions. Markets plunge upon reopening, with the S&P 500 falling 11%."
      },
      2002: {
        title: "WorldCom Accounting Collapse",
        desc: "WorldCom files for bankruptcy after a massive $3.8 billion accounting fraud is exposed, marking the peak of corporate scandals."
      },
      2003: {
        title: "Invasion of Iraq Begins",
        desc: "US-led military forces enter Iraq, removing geopolitical uncertainty and starting a market recovery cycle."
      },
      2004: {
        title: "Google IPO Landmark Debut",
        desc: "Google goes public using a unique Dutch auction IPO format, raising $1.67 billion and triggering a renewal of tech growth interest."
      },
      2005: {
        title: "Hurricane Katrina Oil Disruption",
        desc: "Katrina devastates the Gulf Coast, shutting down refining capacity and pushing oil and gasoline prices to historic highs."
      },
      2006: {
        title: "Housing Bubble Cooling Signs",
        desc: "US housing indicators cool rapidly as subprime defaults rise and home construction starts suffer double-digit declines."
      },
      2007: {
        title: "Early Subprime Mortgage Freeze",
        desc: "BNP Paribas freezes credit funds due to subprime exposure, triggering a systemic freeze in global short-term debt and credit markets."
      },
      2008: {
        title: "Lehman Bankruptcy & GFC Panic",
        desc: "Lehman Brothers files for bankruptcy, prompting a systemic global credit freeze, major banking rescues, and extreme risk aversion."
      },
      2009: {
        title: "GFC Bottom & Launch of QE1",
        desc: "US indices hit multi-decade bear bottoms in March before reversing as the Fed initiates massive asset buyback QE programs."
      },
      2010: {
        title: "Flash Crash Algorithm Panic",
        desc: "Dow Jones drops 1,000 points in minutes due to algorithmic high-frequency trading sell feedback before rebounding rapidly."
      },
      2011: {
        title: "US Debt Downgraded by S&P",
        desc: "Standard & Poor's cuts the United States long-term credit rating from AAA to AA+ for the first time in history amid debt ceiling disputes."
      },
      2012: {
        title: "ECB 'Whatever It Takes' Pledge",
        desc: "ECB President Mario Draghi vows to do 'whatever it takes' to protect the Eurozone from debt collapse, turning market sentiment."
      },
      2013: {
        title: "Bernanke Hints QE Tapering",
        desc: "Fed Chairman Ben Bernanke signals a potential reduction in monthly bond buybacks, causing the global 'Taper Tantrum' yield spike."
      },
      2014: {
        title: "Global Crude Oil Crash",
        desc: "Oil prices plummet from $100 to under $50 a barrel due to OPEC supply battles and surging US shale extraction volumes."
      },
      2015: {
        title: "China Renminbi Devaluation",
        desc: "China devalues the Yuan, triggering global capital outflow fears and causing a sharp correction in major western indices."
      },
      2016: {
        title: "UK Brexit Referendum Shock",
        desc: "The UK votes to leave the European Union, triggering sudden volatility and driving the British Pound to 30-year lows."
      },
      2017: {
        title: "Bitcoin Retail Crypto Mania",
        desc: "Bitcoin surges towards the $20,000 mark in a massive speculative mania, drawing retail and regulatory attention globally."
      },
      2018: {
        title: "Volpocalypse Volatility Spike",
        desc: "The VIX index doubles in a single day, destroying short-volatility exchange-traded assets and triggering a broad market drop."
      },
      2019: {
        title: "Fed Interest Rate Cut Cycle",
        desc: "The Federal Reserve cuts interest rates for the first time since 2008 as trade tensions raise global growth concerns."
      },
      2020: {
        title: "COVID-19 Pandemic Collapse",
        desc: "COVID lockdowns trigger the sharpest bear correction in history, followed by an unprecedented Fed liquidity injection."
      },
      2021: {
        title: "Reddit GameStop Short Squeeze",
        desc: "Retail traders on WallStreetBets drive extreme short squeeze rallies in 'meme stocks' like GME, causing massive hedge fund losses."
      },
      2022: {
        title: "Highest Inflation in 40 Years",
        desc: "US inflation hits 9.1%, forcing the Federal Reserve to launch a historically aggressive interest rate hike campaign."
      },
      2023: {
        title: "Silicon Valley Bank Collapse",
        desc: "Silicon Valley Bank collapses in a major deposit bank run, prompting federal agencies to step in and guarantee all bank deposits."
      },
      2024: {
        title: "NVIDIA Joins $2T Club in AI Boom",
        desc: "Generative AI demand pushes tech stocks higher, with NVIDIA value crossing $2 trillion amid massive market rally focus."
      },
      2025: {
        title: "Fed Successfully Navigates Soft Landing",
        desc: "US inflation falls back to target without triggering a recession, leading to a period of steady growth and rate stabilization."
      },
      2026: {
        title: "Markets Reach All-Time Highs",
        desc: "Stock indices hit new historic milestones, driven by strong corporate earnings and steady interest rate outlooks."
      }
    },
    monthlyEvents: {
      "2008-09": {
        title: "Lehman Brothers Bankruptcy",
        desc: "Lehman Brothers files for Chapter 11 bankruptcy, triggering a global credit freeze and marking the peak of the banking crisis."
      },
      "2000-03": {
        title: "Dot-com Bubble Peak reached",
        desc: "The NASDAQ Composite peaks at 5,048, marking the absolute high point of the internet technology speculation mania."
      },
      "2020-03": {
        title: "COVID Global Market Crash",
        desc: "Markets experience extreme panic, triggering multiple circuit breakers. The Fed cuts rates to near-zero and launches unlimited QE."
      },
      "2023-03": {
        title: "Silicon Valley Bank Collapse",
        desc: "Silicon Valley Bank (SVB) collapses in a classic bank run, freezing deposits and triggering a sudden regional banking panic."
      }
    }
  },
  ai: {
    title: 'AI INSIGHTS · {date}',
    headline: 'The market shows {tier} risk across multiple dimensions.',
    riskFootprint: 'RISK FOOTPRINT',
    vsAvg: 'VS 50Y AVG',
    compositeScore: 'COMPOSITE SCORE',
    recommendedAction: 'RECOMMENDED ACTION',
    recommendations: {
      bubbleHigh: 'Trim concentrated growth exposure. Rotate 15–20% into short-duration sovereign.',
      elevated: 'Monitor risk indicators closely. Maintain defensive positioning.',
      normal: 'Conditions are within historical norms. No immediate action required.',
    },
    insightsText: {
      valuation: {
        BUBBLE:   'CAPE ratio at extreme 98th-percentile levels; last reading this elevated was Feb 2000.',
        HIGH:     'CAPE elevated, above the 50-year mean. Historically reverts within 4y in 92% of cases.',
        ELEVATED: 'Valuations stretched but below historical extremes. Monitor earnings growth.',
        MODERATE: 'Valuation metrics within normal historical range. No immediate concern.',
        LOW:      'Market appears undervalued relative to historical earnings. Potential upside.',
      },
      macro_stress: {
        BUBBLE:   'Yield curve deeply inverted. Recession probability elevated. Fed in late-cycle tightening.',
        HIGH:     'Macro stress rising: yield curve compression and PMI softening signal caution.',
        ELEVATED: 'Macro indicators mixed; some softening in leading indicators worth watching.',
        MODERATE: 'Macro backdrop relatively stable. No immediate recessionary signals.',
        LOW:      'Strong macro backdrop. Yield curve normal, PMI expansionary across sectors.',
      },
      leverage_credit: {
        BUBBLE:   'Leverage at cycle peak: margin debt and corporate debt both at extremes.',
        HIGH:     'Fed balance sheet contracting, but M2 still above pre-pandemic trend.',
        ELEVATED: 'Credit spreads tightening. Corporate leverage elevated but stable.',
        MODERATE: 'Leverage metrics within historical norms. No systemic risk signal.',
        LOW:      'Balance sheets healthy. Credit spreads historically low.',
      },
      sentiment: {
        BUBBLE:   'Extreme euphoria: AAII bulls at 98th percentile. Retail inflows surging.',
        HIGH:     'AAII bullish reading elevated. Margin debt rising year-over-year.',
        ELEVATED: 'Sentiment moderately optimistic. Retail participation above average.',
        MODERATE: 'Sentiment balanced, neither extreme fear nor greed.',
        LOW:      'Sentiment fearful. A contrarian signal historically associated with market recoveries.',
      },
      concentration: {
        BUBBLE:   'Top-10 names = 38% of S&P cap. Equivalent to peak 2000 concentration.',
        HIGH:     'Concentration risk elevated: mega-cap dominance at historical highs.',
        ELEVATED: 'Index concentration above average. Sector diversification limited.',
        MODERATE: 'Concentration within historical norms.',
        LOW:      'Broad market participation. Index well-diversified across sectors.',
      },
    }
  },
  about: {
    eyebrow: 'ABOUT',
    title: 'A single risk score for the entire market.',
    desc: 'BubbleIndex is a research tool that distills valuation, macro stress, leverage, sentiment, and concentration into one composite reading scored against 125 years of bubble history. It exists to make systemic market risk legible at a glance, with the full reasoning always one click away.',
    whatWeBuildTitle: 'WHAT WE BUILD',
    whatWeBuildDesc: 'The composite risk score combines five weighted categories (Valuation, Macro Stress, Leverage & Credit, Sentiment, and Concentration), each built from public indicators normalized against a rolling 20-year window. The result is a single 0–100 reading that can be compared across decades, not just across the last few quarters.',
    values: [
      {
        title: 'Data over narrative',
        body: 'Every reading on this site is derived from public, verifiable data series, not opinion or punditry.',
      },
      {
        title: 'History as a baseline',
        body: 'The model is calibrated against 125 years of market cycles, so today’s readings are always shown in long-run context.',
      },
      {
        title: 'Transparency by default',
        body: 'The full methodology (every category, weight, and indicator) is public and explained in plain language.',
      },
    ],
    notAdviceTitle: 'Not investment advice.',
    notAdviceDesc: 'BubbleIndex describes historical and current conditions. It does not predict future returns. For the full breakdown of how the score is built, see {link}.'
  },
  contact: {
    eyebrow: 'CONTACT & INFO',
    title: 'Get in touch.',
    desc: 'Information regarding communication channels and privacy principles of BubbleIndex.',
    supportTitle: 'SUPPORT & INQUIRIES',
    supportDesc: 'BubbleIndex is an open dashboard project. For support, feedback, or inquiries, reach out via Telegram:',
    privacyTitle: 'PRIVACY & COOKIES',
    privacyDesc: 'We use Google Analytics 4 to understand how visitors use this site, which sets cookies in your browser. See our Privacy Policy for full details on data handling and how to opt out.'
  },
  privacy: {
    eyebrow: 'PRIVACY POLICY',
    title: 'How we handle your data.',
    desc: 'Our commitment to your privacy. This policy outlines how BubbleIndex handles information.',
    sections: [
      {
        title: 'Information we collect',
        body: 'You do not need to create an account or submit any personal details to use this site. We use Google Analytics 4, which automatically collects standard usage data such as your approximate location, device and browser type, and the pages you visit, to help us understand how the site is used.',
      },
      {
        title: 'How we use information',
        body: 'The analytics data collected through Google Analytics helps us understand visitor traffic and improve the platform. We do not use this data to identify you personally, and we never sell or rent information to third parties.',
      },
      {
        title: 'Cookies & tracking',
        body: 'This site uses Google Analytics 4, which sets cookies in your browser to measure traffic and usage patterns. These cookies do not collect personally identifiable information. You can disable cookies in your browser settings, or opt out of Google Analytics tracking using the Google Analytics Opt-out Browser Add-on.',
      },
      {
        title: 'Data sharing & third parties',
        body: 'Usage data collected via Google Analytics is processed by Google in accordance with its own privacy policy. We do not share any other information with third parties, service providers, or advertisers.',
      },
      {
        title: 'Your rights & choices',
        body: 'You can control or delete cookies through your browser settings at any time, and opt out of Google Analytics tracking as described above. Beyond the anonymized analytics data described in this policy, we do not collect or store any personal information about you.',
      },
      {
        title: 'Contact',
        body: 'If you have any questions or concerns about this privacy policy, you can contact us via Telegram at https://t.me/YD_IL.',
      },
    ],
    lastUpdated: 'Last updated: June 7, 2026'
  },
  accessibility: {
    eyebrow: 'ACCESSIBILITY STATEMENT',
    title: 'Accessibility at BubbleIndex.',
    desc: 'Our commitment to ensuring digital accessibility for people with disabilities.',
    sections: [
      {
        title: 'Our Goal',
        body: 'We want everyone to be able to use the BubbleIndex platform, regardless of their technology or ability. We are continuously improving the user experience for everyone and applying the relevant accessibility standards.',
      },
      {
        title: 'Conformance Status',
        body: 'The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. We strive to conform to WCAG 2.1 Level AA standards.',
      },
      {
        title: 'Key Accessibility Features',
        body: 'Our platform uses high contrast ratios, screen-reader friendly semantic HTML, keyboard navigable interactive elements, and supports text scaling.',
      },
      {
        title: 'Feedback',
        body: 'We welcome your feedback on the accessibility of BubbleIndex. If you encounter accessibility barriers, please let us know via Telegram at https://t.me/YD_IL.',
      }
    ],
    lastUpdated: 'Last updated: June 8, 2026'
  },
  terms: {
    eyebrow: 'TERMS OF USE',
    title: 'Terms of Use.',
    desc: 'Please read these terms carefully before using the BubbleIndex platform.',
    sections: [
      {
        title: 'Acceptance of Terms',
        body: 'By accessing and using BubbleIndex, you agree to be bound by these Terms of Use and all applicable laws and regulations.',
      },
      {
        title: 'Use License',
        body: 'BubbleIndex is a research and educational tool. You are permitted to view the data and visualizations for personal, non-commercial use. Any unauthorized scraping or commercial redistribution of the data is strictly prohibited.',
      },
      {
        title: 'Disclaimer of Warranties',
        body: 'The platform and all data are provided "as is". BubbleIndex makes no warranties, expressed or implied, regarding the accuracy, completeness, or reliability of the risk scores or market indicators.',
      },
      {
        title: 'Not Investment Advice',
        body: 'All content is for informational and educational purposes only. Risk scores do not constitute investment advice, financial advice, or a recommendation to buy or sell any security.',
      },
      {
        title: 'Limitation of Liability',
        body: 'In no event shall BubbleIndex or its contributors be liable for any damages arising out of the use or inability to use the materials on the platform.',
      }
    ],
    lastUpdated: 'Last updated: June 8, 2026'
  },
  cookieSettings: {
    eyebrow: 'COOKIE SETTINGS',
    title: 'Manage cookie preferences.',
    desc: 'You can control which cookies are stored on your device when visiting BubbleIndex.',
    optOutTitle: 'Google Analytics 4 Tracking',
    optOutDesc: 'We use Google Analytics 4 to collect anonymized usage data (like page views and approximate location) to help us improve the dashboard. No personally identifiable information is collected.',
    enableToggle: 'Allow Google Analytics tracking cookies',
    disableToggle: 'Opt-out of tracking cookies',
    saveButton: 'Save Preferences',
    savedNotification: 'Your cookie preferences have been updated!',
  },
  footer: {
    eyebrow: 'SITE INFORMATION',
    title: 'Product nav, methodology, legal, and disclaimer.',
    desc: 'A single risk score for the entire market, scored against 125 years of bubble history.',
    cols: [
      { title: 'BUBBLEINDEX', links: ['About', 'Contact', 'Methodology', 'Changelog', 'API access'] },
    ],
    legal: ['Accessibility', 'Status', 'Privacy Policy', 'Terms of Use', 'Cookie Settings'],
    disclaimerTitle: 'Not investment advice.',
    disclaimerDesc: 'BubbleIndex is a research tool. Risk scores are derived from public data and a quantitative model; they describe historical conditions, not future returns. Past performance does not predict future outcomes.',
    copyright: '© 2025 BubbleIndex Research, Ltd. · All rights reserved.',
    build: 'BUILD 2025.05.12 · v0.1.0'
  },
  changelog: {
    eyebrow: 'CHANGELOG',
    title: 'Platform updates.',
    desc: 'The latest developments, data updates, and feature rollouts for BubbleIndex.',
    releases: [
      {
        version: 'v0.1.1',
        date: 'June 8, 2026',
        title: 'Bilingual Support & UI Streamlining',
        changes: [
          'Added full Hebrew translation (RTL support) across the entire platform.',
          'Simplified footer structure to reduce clutter and focus on active pages.',
          'Added functional Changelog and API Access information pages.'
        ]
      },
      {
        version: 'v0.1.0',
        date: 'May 12, 2025',
        title: 'Initial Dashboard Release',
        changes: [
          'Exposed 0–100 market risk score normalized against 125 years of history.',
          'Built 5 distinct risk categories: Valuation, Macro, Leverage, Sentiment, and Concentration.',
          'Launched interactive Market Replay and AI Insights summary features.',
          'Configured automatic daily data sync with FRED, Yahoo Finance, and Finnhub APIs.'
        ]
      }
    ]
  },
  apiAccess: {
    eyebrow: 'API ACCESS',
    title: 'Integrate BubbleIndex data.',
    desc: 'Retrieve composite scores, raw indicator readings, and historical data programmatically.',
    infoTitle: 'HOW TO GET ACCESS',
    infoDesc: 'BubbleIndex provides REST endpoints for developers, researchers, and platforms. API keys are currently distributed on a request basis to manage rate limits and server load.',
    actionTitle: 'REQUEST AN API KEY',
    actionDesc: 'To request an API key, please get in touch with us via Telegram. Let us know your planned use case or integration scale, and we will set up your credentials.',
    endpointsTitle: 'AVAILABLE ENDPOINTS',
    endpointsDesc: 'Once authorized, you will have access to the following v1 endpoints:',
    endpoints: [
      { path: '/api/v1/risk-score/latest', desc: 'Returns the most recent composite risk score and category breakdown.' },
      { path: '/api/v1/indicators/history', desc: 'Returns historical values for all tracked risk indicators.' },
      { path: '/api/v1/snapshots/history', desc: 'Returns historical composite risk score snapshots.' },
      { path: '/api/v1/crisis/similarity', desc: 'Returns cosine similarity scores matching current conditions to historical bubble episodes.' }
    ]
  },
  methodology: {
    eyebrow: 'METHODOLOGY',
    title: 'The composite score, broken into its {count} ingredients.',
    desc: 'Every raw input is normalized to a 0–100 percentile against a 20-year rolling window. A reading of {seventy} means "more extreme than 70% of historical days."',
    active: 'ACTIVE',
    composite: 'COMPOSITE',
    asOf: 'AS OF',
    weightMix: 'COMPOSITE WEIGHT MIX',
    activeMixLabel: '{count} ACTIVE CATEGORIES · 100% OF SCORE',
    unknownCategory: 'UNKNOWN CATEGORY',
    heroEyebrow: 'METHODOLOGY · INDICATOR',
    whatWeMeasure: 'WHAT WE MEASURE',
    whyMattersTitle: 'WHY IT MATTERS FOR BUBBLE DETECTION',
    keyMetricsTitle: 'KEY METRICS & THRESHOLDS',
    sourceLabel: 'SOURCE: {source}',
    historicalEpisodes: 'HISTORICAL EPISODES',
    signalLabel: 'SIGNAL',
    outcomeLabel: 'OUTCOME',
    interpretTitle: 'HOW TO INTERPRET THE SCORE',
    academicSources: 'ACADEMIC & INDUSTRY SOURCES',
    categories: STATIC_CATEGORIES,
    details: DETAILS
  },
  riskTiers: {
    low: { tier: 'LOW', verb: 'BUY' },
    moderate: { tier: 'MODERATE', verb: 'HOLD' },
    elevated: { tier: 'ELEVATED', verb: 'WATCH' },
    high: { tier: 'HIGH', verb: 'CAUTION' },
    bubble: { tier: 'BUBBLE', verb: 'SELL' },
  }
};
