export interface IndicatorDetail {
  name: string;
  display_name: string;
  raw_value: number | null;
  raw_unit: string;
  normalized_score: number;
  is_imputed: boolean;
}

export interface CategoryScore {
  id: string;
  display_name: string;
  weight: number;
  score: number;
  indicators: IndicatorDetail[];
}

export interface CrisisSimilarity {
  crisis_id: string;
  display_name: string;
  peak_date: string;
  peak_score: number;
  drawdown_pct: number;
  similarity_score: number;
  closest_indicators: string[];
}

export interface RiskScoreResponse {
  composite_score: number;
  risk_label: string;
  risk_verb: string;
  snapshot_date: string;
  categories: CategoryScore[];
  data_freshness: Record<string, string>;
  warnings: string[];
  crisis_similarities: CrisisSimilarity[];
}

export interface SnapshotSummary {
  snapshot_date: string;
  composite_score: number;
  risk_label: string;
  valuation_score: number;
  macro_stress_score: number;
  leverage_credit_score: number;
  sentiment_score: number;
  concentration_score: number;
}

export type RiskTier = {
  tier: string;
  tone: string;
  verb: string;
};

export type GaugeKind = 'radial' | 'arc' | 'bar' | 'abstract';
export type Palette = 'temperature' | 'traffic' | 'violet' | 'mono';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type Theme = 'dark' | 'light';
