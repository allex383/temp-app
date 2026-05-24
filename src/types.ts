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
  vfMode: 'manual' | 'calculate';
  filterShape: 'circle' | 'rectangle';
  filterDiameter: number;
  filterWidth: number;
  filterLength: number;
  filterCount: number;
}

export interface PoolFlowInputs {
  vbas: number; // m3
  purpose: 'preschool' | 'training' | 'wellness';
  tcMode: 'auto' | 'manual';
  tcCustom: number; // hours
}

export interface PoolPeriodicInputs {
  vbas: number; // m3
  tFilling: number; // hours for filling
  nSessions: number; // number of sessions/recharges per day
  purpose: 'preschool' | 'training' | 'contrast' | 'thermal';
}

export interface FloorHeatingInputs {
  an: number; // Вт/(м2*С)
  tnMode: 'permanent' | 'preschool' | 'temporary' | 'pool-walkway' | 'manual';
  tnCustom: number; // °C
  ti: number; // °C
  sn: number; // м2
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
  | 'tech-pool-flow'
  | 'tech-pool-periodic'
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
  poolFlow: PoolFlowInputs;
  poolPeriodic: PoolPeriodicInputs;
  floorHeating: FloorHeatingInputs;
}
