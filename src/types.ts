export interface HeatingVolumeInputs {
  alpha: number;
  q0: number;
  vn: number;
  vp: number;
  ti: number;
  to: number;
}

export interface HeatingNoVolumeInputs {
  q0: number;
  area: number;
  k1: number;
  ti: number;
  to: number;
}

export interface CalculationResult {
  totalMW: number;
  totalGcal: number;
  totalWatts: number;
  volumeSum?: number;
  tempDiff?: number;
  timestamp: string;
  q0Calculated?: number;
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
  heatingVolume: HeatingVolumeInputs;
  heatingNoVolume: HeatingNoVolumeInputs;
}
