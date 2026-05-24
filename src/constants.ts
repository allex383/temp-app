import { HeatingVolumeInputs, HeatingNoVolumeInputs, HeatingOutdoorAreaInputs, VentilationVolumeInputs, VentilationCurtainInputs, VentilationEquipmentInputs, PoolHeatingInputs, PoolOperatingInputs, PoolFlowInputs, PoolPeriodicInputs } from './types';

export const KTP_CONSTANT = 1.05;

export const DEFAULT_HEATING_VOLUME_INPUTS: HeatingVolumeInputs = {
  alpha: 1.0,
  q0: 0.45,
  vn: 1000,
  vp: 0,
  ti: 18,
  to: -25,
};

export const DEFAULT_HEATING_NO_VOLUME_INPUTS: HeatingNoVolumeInputs = {
  q0: 0, // Will be calculated or entered
  area: 500,
  k1: 0.25,
  ti: 18,
  to: -25,
};

export const DEFAULT_HEATING_OUTDOOR_AREA_INPUTS: HeatingOutdoorAreaInputs = {
  an: 23,
  tn: 3,
  to: -25,
  sn: 100,
};

export const DEFAULT_VENTILATION_VOLUME_INPUTS: VentilationVolumeInputs = {
  qv: 0.4,
  vn: 1000,
  ti: 18,
  to: -28,
};

export const DEFAULT_VENTILATION_CURTAIN_INPUTS: VentilationCurtainInputs = {
  height: 2.5,
  width: 2.0,
  ti: 18,
  to: -28,
  curtainType: 'door',
};

export const DEFAULT_VENTILATION_EQUIPMENT_INPUTS: VentilationEquipmentInputs = {
  c: 0.24,
  L: 3000,
  ti: 18,
  to: -25,
};

export const DEFAULT_POOL_HEATING_INPUTS: PoolHeatingInputs = {
  vbas: 50000, // 50,000 liters
  purpose: 'wellness', // 29 °C
  f: 25, // 25 m2
};

export const DEFAULT_POOL_OPERATING_INPUTS: PoolOperatingInputs = {
  f: 25, // 25 m2 mirror area
  vf: 2000, // 2000 liters for filter washing
  purpose: 'wellness', // 29 °C
  tpr: 4, // 4 hours to reheat the water
  vfMode: 'manual',
  filterShape: 'circle',
  filterDiameter: 0.6, // 0.6m diameter
  filterWidth: 0.6, // 0.6m width
  filterLength: 0.6, // 0.6m length
  filterCount: 1, // 1 filter unit
};

export const DEFAULT_POOL_FLOW_INPUTS: PoolFlowInputs = {
  vbas: 40, // 40 m³ pool volume
  purpose: 'wellness', // 29 °C
  tcMode: 'auto',
  tcCustom: 12, // default water exchange time 
};

export const DEFAULT_POOL_PERIODIC_INPUTS: PoolPeriodicInputs = {
  vbas: 40, // 40 m³ pool volume
  tFilling: 2, // 2 hours to fill
  nSessions: 1, // 1 session per day
  purpose: 'training', // default to training
};

export const ALPHA_TABLE = [
  { temp: -20, alpha: 1.17 },
  { temp: -25, alpha: 1.08 },
  { temp: -26, alpha: 1.064 },
  { temp: -27, alpha: 1.048 },
  { temp: -28, alpha: 1.032 },
  { temp: -30, alpha: 1.0 },
];
