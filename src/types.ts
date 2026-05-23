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

export interface VentilationVolumeInputs {
  qv: number;
  vn: number;
  ti: number;
  to: number;
}

export interface VentilationCurtainInputs {
  height: number;
  width: number;
  ti: number;
  to: number;
  curtainType: 'door' | 'gate';
}

export interface HeatingOutdoorAreaInputs {
  an: number;
  tn: number;
  to: number;
  sn: number;
}

export interface VentilationEquipmentInputs {
  c: number;
  L: number;
  ti: number;
  to: number;
}

export interface PoolHeatingInputs {
  vbas: number;
  purpose: 'preschool' | 'training' | 'wellness' | 'sports';
  f: number;
}

export interface PoolOperatingInputs {
  f: number;
  vf: number;
  purpose: 'preschool' | 'training' | 'wellness' | 'sports';
  tpr: number;
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
  | 'heating-outdoor-area'
  | 'vent-supply' 
  | 'vent-curtain' 
  | 'vent-equipment'
  | 'tech-floor' 
  | 'tech-pool' 
  | 'tech-pool-operating'
  | 'gvs';

export interface AppState {
  heatingVolume: HeatingVolumeInputs;
  heatingNoVolume: HeatingNoVolumeInputs;
  heatingOutdoorArea: HeatingOutdoorAreaInputs;
  ventilationVolume: VentilationVolumeInputs;
  ventilationCurtain: VentilationCurtainInputs;
  ventilationEquipment: VentilationEquipmentInputs;
  poolHeating: PoolHeatingInputs;
  poolOperating: PoolOperatingInputs;
}
