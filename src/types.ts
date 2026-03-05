export interface CalculationInputs {
  alpha: number;
  q0: number;
  vn: number;
  vp: number;
  ti: number;
  to: number;
}

export interface CalculationResult {
  totalMW: number;
  totalGcal: number;
  totalWatts: number;
  volumeSum: number;
  tempDiff: number;
  timestamp: string;
}

export type ViewId = 
  | 'home' 
  | 'heating-volume' 
  | 'heating-no-volume' 
  | 'vent-supply' 
  | 'vent-curtain' 
  | 'tech-floor' 
  | 'tech-pool' 
  | 'gvs';

export interface AppState {
  heatingVolume: CalculationInputs;
  // Future states can be added here
}
