import { HeatingVolumeInputs, HeatingNoVolumeInputs } from './types';

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

export const ALPHA_TABLE = [
  { temp: -20, alpha: 1.17 },
  { temp: -25, alpha: 1.08 },
  { temp: -26, alpha: 1.064 },
  { temp: -27, alpha: 1.048 },
  { temp: -28, alpha: 1.032 },
  { temp: -30, alpha: 1.0 },
];
