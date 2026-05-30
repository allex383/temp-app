import React, { useState, useEffect } from 'react';
import { Menu, Maximize2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewId, HeatingVolumeInputs, HeatingNoVolumeInputs, HeatingOutdoorAreaInputs, VentilationVolumeInputs, VentilationCurtainInputs, VentilationEquipmentInputs, PoolHeatingInputs, PoolOperatingInputs, PoolFlowInputs, PoolPeriodicInputs, FloorHeatingInputs, GvsInputs, GvsPointsInputs, GvsCateringInputs, GvsPipeInputs } from './types';
import { DEFAULT_HEATING_VOLUME_INPUTS, DEFAULT_HEATING_NO_VOLUME_INPUTS, DEFAULT_HEATING_OUTDOOR_AREA_INPUTS, DEFAULT_VENTILATION_VOLUME_INPUTS, DEFAULT_VENTILATION_CURTAIN_INPUTS, DEFAULT_VENTILATION_EQUIPMENT_INPUTS, DEFAULT_POOL_HEATING_INPUTS, DEFAULT_POOL_OPERATING_INPUTS, DEFAULT_POOL_FLOW_INPUTS, DEFAULT_POOL_PERIODIC_INPUTS, DEFAULT_FLOOR_HEATING_INPUTS, DEFAULT_GVS_INPUTS, DEFAULT_GVS_POINTS_INPUTS, DEFAULT_GVS_CATERING_INPUTS, DEFAULT_GVS_PIPE_INPUTS } from './constants';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { HeatingVolumeCalculator } from './components/HeatingVolumeCalculator';
import { HeatingNoVolumeCalculator } from './components/HeatingNoVolumeCalculator';
import { HeatingOutdoorAreaCalculator } from './components/HeatingOutdoorAreaCalculator';
import { VentilationVolumeCalculator } from './components/VentilationVolumeCalculator';
import { VentilationCurtainCalculator } from './components/VentilationCurtainCalculator';
import { VentilationEquipmentCalculator } from './components/VentilationEquipmentCalculator';
import { PoolHeatingCalculator } from './components/PoolHeatingCalculator';
import { PoolOperatingCalculator } from './components/PoolOperatingCalculator';
import { PoolFlowCalculator } from './components/PoolFlowCalculator';
import { PoolPeriodicCalculator } from './components/PoolPeriodicCalculator';
import { HeatingFloorCalculator } from './components/HeatingFloorCalculator';
import { GvsCalculator } from './components/GvsCalculator';
import { GvsPointsCalculator } from './components/GvsPointsCalculator';
import { GvsCateringCalculator } from './components/GvsCateringCalculator';
import { GvsPipeCalculator } from './components/GvsPipeCalculator';
import { PlaceholderView } from './components/PlaceholderView';

// JSONP helper to bypass browser sandboxed CORS restrictions for Yandex Maps HTTP Geocoder API
const fetchYandexJSONP = (query: string, apiKey: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'yandex_cb_' + Math.round(Math.random() * 1000000);
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(apiKey)}&geocode=${encodeURIComponent(query)}&format=json&results=7&lang=ru_RU&callback=${callbackName}`;
    
    const script = document.createElement('script');
    script.src = url;
    script.id = callbackName;
    
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Yandex Maps API JSONP Timeout (2.5s)'));
    }, 2500);

    (window as any)[callbackName] = (data: any) => {
      clearTimeout(timeout);
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Yandex Maps API JSONP Network Error'));
    };

    document.head.appendChild(script);

    function cleanup() {
      const el = document.getElementById(callbackName);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
      delete (window as any)[callbackName];
    }
  });
};

// Cleans up, filters out Russia, ZIP codes, and Federal districts, and forces the format:
// "г. Москва, [Улица], [Дом]"
const cleanAndFormatMoscowAddress = (raw: string): string => {
  if (!raw) return '';

  // Split into parts by comma and trim each part
  let parts = raw.split(',').map(p => p.trim()).filter(Boolean);

  let city = 'г. Москва'; // Default city if "Москва" or "Московская область" is detected
  let street = '';
  let house = '';
  const otherParts: string[] = [];

  // Federal district check
  const isFederalDistrict = (s: string) => /федеральный округ|центр\.?фед\.?округ|цфо|сзфо|пфо|урфо/i.test(s);
  // Country check
  const isCountry = (s: string) => /^(россия|рф|российская федерация|russia)$/i.test(s);
  // Index / ZIP Code check (usually 6 digits)
  const isPostalCode = (s: string) => /^\b\d{6}\b$/.test(s);
  // Administrative district clutter check
  const isDistrictClutter = (s: string) => /^(район|муниципальный округ|административный округ|ао|юао|зао|вао|свао|сзао|юзао|ювао|нао|тао|зелао|городской округ)/i.test(s) || /район$/i.test(s) || /округ$/i.test(s);

  for (const part of parts) {
    const partLower = part.toLowerCase();

    // Skip ignored parts
    if (isCountry(partLower) || isFederalDistrict(partLower) || isPostalCode(partLower) || isDistrictClutter(partLower)) {
      continue;
    }

    // Is it a city/region?
    if (partLower.includes('москва') || partLower === 'московская область' || partLower === 'мо') {
      if (partLower.includes('область')) {
        city = part.replace(/^область\s+/i, '').replace(/\s+область/i, ' обл.');
        if (!city.startsWith('г.') && !city.startsWith('Московская')) {
          city = 'Московская обл., ' + city;
        }
      }
      continue;
    }

    // If it's a known city in Moscow Oblast
    const knownMoscowOblastCities = ['мытищи', 'химки', 'подольск', 'люберцы', 'балашиха', 'одинцово', 'королев', 'королёв', 'красногорск', 'реутов', 'видное', 'лыткарино', 'дзержинский', 'щелково', 'щёлково', 'домодедово', 'раменское', 'пушкино', 'долгопрудный', 'лобня', 'ивантеевка'];
    const isKnownCity = knownMoscowOblastCities.some(c => partLower === c || partLower === `г. ${c}` || partLower === `г.${c}` || partLower === `город ${c}`);
    if (isKnownCity) {
      city = part.startsWith('г.') ? part : `г. ${part}`;
      continue;
    }

    // Is it a house/building number?
    // Matches patterns like "28", "28А", "30к1", "30 к. 1", "вл. 1", "стр. 2"
    // Also "д. 12"
    const isHouseNumber = 
      /^(д|дом|стр|строение|корпус|корп|к|вл|владение)\.?\s*\d+/i.test(part) || 
      (/^\d+[-а-яезлиж]?$/i.test(part) && part.length <= 6) ||
      (/^\d+\s*(корпус|корп|стр|строение|к)\.?\s*\d*/i.test(part)) ||
      (/^\d+\/\d+$/i.test(part)); // "24/2" etc.

    if (isHouseNumber) {
      let normalizedHouse = part;
      // If it starts with a number and has no letters/extensions, prepending "д. " is nice and uniform
      if (/^\d/i.test(part) && 
          !part.toLowerCase().includes('корп') && 
          !part.toLowerCase().includes('стр') && 
          !part.toLowerCase().includes('к.') && 
          !part.toLowerCase().includes('д.')) {
        normalizedHouse = 'д. ' + part;
      } else {
        // Standardize common prefixes
        normalizedHouse = normalizedHouse
          .replace(/^дом\s+/i, 'д. ')
          .replace(/^д\.\s*/i, 'д. ')
          .replace(/строение\s+/i, 'стр. ')
          .replace(/стр\.\s*/i, 'стр. ')
          .replace(/корпус\s+/i, 'к. ')
          .replace(/корп\.\s*/i, 'к. ')
          .replace(/к\.\s*/i, 'к. ');
      }
      house = normalizedHouse;
      continue;
    }

    // Is it a street?
    const isStreet = /улица|ул\.?|проспект|пр-кт|пр-т|набережная|наб\.?|бульвар|б-вар|переулок|пер\.?|шоссе|ш\.?|проезд|пр\.?|аллея|площадь|пл\.?|тупик/i.test(part);
    if (isStreet) {
      let normalizedStreet = part;
      // Clean up common prefixes to make them standard and punctuated
      normalizedStreet = normalizedStreet
        .replace(/^ул\s+/i, 'ул. ')
        .replace(/^пр\s+/i, 'пр. ')
        .replace(/^наб\s+/i, 'наб. ')
        .replace(/^пер\s+/i, 'пер. ')
        .replace(/^ш\s+/i, 'шоссе ')
        .replace(/^пл\s+/i, 'пл. ');
      street = normalizedStreet;
      continue;
    }

    // Otherwise, collect other parts (could be a street without explicit "улица" or village name)
    otherParts.push(part);
  }

  // Fallback: If street was not directly classified, but we have some otherParts left,
  // we can use the first non-house otherPart as the street.
  if (!street && otherParts.length > 0) {
    street = otherParts.shift() || '';
  }

  // Let's assemble in order: 1. City/Region, 2. Street, 3. Remaining segments, 4. House
  let finalCity = city || 'г. Москва';
  if (!finalCity.startsWith('г. ') && !finalCity.startsWith('Московская')) {
    finalCity = 'г. ' + finalCity;
  }

  const resultSegments: string[] = [finalCity];
  if (street) {
    resultSegments.push(street);
  }
  if (otherParts.length > 0) {
    resultSegments.push(...otherParts);
  }
  if (house) {
    resultSegments.push(house);
  }

  return resultSegments.join(', ');
};

export default function App() {
  // --- Address autocomplete custom state ---
  const [addressInput, setAddressInput] = useState<HTMLInputElement | null>(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const [currentView, setCurrentView] = useState<ViewId>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_current_view') : null;
      return (saved as ViewId) || 'home';
    } catch (e) {
      return 'home';
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [heatingVolumeInputs, setHeatingVolumeInputs] = useState<HeatingVolumeInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_heating_volume') : null;
      if (!saved) return DEFAULT_HEATING_VOLUME_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.alpha === 'number' && typeof parsed.q0 === 'number') {
        return parsed;
      }
      return DEFAULT_HEATING_VOLUME_INPUTS;
    } catch (e) {
      return DEFAULT_HEATING_VOLUME_INPUTS;
    }
  });

  const [heatingNoVolumeInputs, setHeatingNoVolumeInputs] = useState<HeatingNoVolumeInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_heating_no_volume') : null;
      if (!saved) return DEFAULT_HEATING_NO_VOLUME_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.area === 'number' && typeof parsed.q0 === 'number') {
        return parsed;
      }
      return DEFAULT_HEATING_NO_VOLUME_INPUTS;
    } catch (e) {
      return DEFAULT_HEATING_NO_VOLUME_INPUTS;
    }
  });

  const [ventilationVolumeInputs, setVentilationVolumeInputs] = useState<VentilationVolumeInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_ventilation_volume') : null;
      if (!saved) return DEFAULT_VENTILATION_VOLUME_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.qv === 'number' && typeof parsed.vn === 'number') {
        return parsed;
      }
      return DEFAULT_VENTILATION_VOLUME_INPUTS;
    } catch (e) {
      return DEFAULT_VENTILATION_VOLUME_INPUTS;
    }
  });

  const [ventilationCurtainInputs, setVentilationCurtainInputs] = useState<VentilationCurtainInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_ventilation_curtain') : null;
      if (!saved) return DEFAULT_VENTILATION_CURTAIN_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.height === 'number' && typeof parsed.width === 'number') {
        return parsed;
      }
      return DEFAULT_VENTILATION_CURTAIN_INPUTS;
    } catch (e) {
      return DEFAULT_VENTILATION_CURTAIN_INPUTS;
    }
  });

  const [heatingOutdoorAreaInputs, setHeatingOutdoorAreaInputs] = useState<HeatingOutdoorAreaInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_heating_outdoor_area') : null;
      if (!saved) return DEFAULT_HEATING_OUTDOOR_AREA_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.sn === 'number' && typeof parsed.an === 'number') {
        return parsed;
      }
      return DEFAULT_HEATING_OUTDOOR_AREA_INPUTS;
    } catch (e) {
      return DEFAULT_HEATING_OUTDOOR_AREA_INPUTS;
    }
  });

  const [ventilationEquipmentInputs, setVentilationEquipmentInputs] = useState<VentilationEquipmentInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_ventilation_equipment') : null;
      if (!saved) return DEFAULT_VENTILATION_EQUIPMENT_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.L === 'number' && typeof parsed.c === 'number') {
        return parsed;
      }
      return DEFAULT_VENTILATION_EQUIPMENT_INPUTS;
    } catch (e) {
      return DEFAULT_VENTILATION_EQUIPMENT_INPUTS;
    }
  });

  const [poolHeatingInputs, setPoolHeatingInputs] = useState<PoolHeatingInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_pool_heating') : null;
      if (!saved) return DEFAULT_POOL_HEATING_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.vbas === 'number' && typeof parsed.f === 'number') {
        return parsed;
      }
      return DEFAULT_POOL_HEATING_INPUTS;
    } catch (e) {
      return DEFAULT_POOL_HEATING_INPUTS;
    }
  });

  const [poolOperatingInputs, setPoolOperatingInputs] = useState<PoolOperatingInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_pool_operating') : null;
      if (!saved) return DEFAULT_POOL_OPERATING_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.vf === 'number' && typeof parsed.f === 'number') {
        return { ...DEFAULT_POOL_OPERATING_INPUTS, ...parsed };
      }
      return DEFAULT_POOL_OPERATING_INPUTS;
    } catch (e) {
      return DEFAULT_POOL_OPERATING_INPUTS;
    }
  });

  const [poolFlowInputs, setPoolFlowInputs] = useState<PoolFlowInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_pool_flow') : null;
      if (!saved) return DEFAULT_POOL_FLOW_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.vbas === 'number' && typeof parsed.purpose === 'string') {
        return { ...DEFAULT_POOL_FLOW_INPUTS, ...parsed };
      }
      return DEFAULT_POOL_FLOW_INPUTS;
    } catch (e) {
      return DEFAULT_POOL_FLOW_INPUTS;
    }
  });

  const [poolPeriodicInputs, setPoolPeriodicInputs] = useState<PoolPeriodicInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_pool_periodic') : null;
      if (!saved) return DEFAULT_POOL_PERIODIC_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.vbas === 'number' && typeof parsed.purpose === 'string') {
        return { ...DEFAULT_POOL_PERIODIC_INPUTS, ...parsed };
      }
      return DEFAULT_POOL_PERIODIC_INPUTS;
    } catch (e) {
      return DEFAULT_POOL_PERIODIC_INPUTS;
    }
  });

  const [floorHeatingInputs, setFloorHeatingInputs] = useState<FloorHeatingInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_floor_heating') : null;
      if (!saved) return DEFAULT_FLOOR_HEATING_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.sn === 'number' && typeof parsed.tnMode === 'string') {
        return { ...DEFAULT_FLOOR_HEATING_INPUTS, ...parsed };
      }
      return DEFAULT_FLOOR_HEATING_INPUTS;
    } catch (e) {
      return DEFAULT_FLOOR_HEATING_INPUTS;
    }
  });

  const [gvsInputs, setGvsInputs] = useState<GvsInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_gvs') : null;
      if (!saved) return DEFAULT_GVS_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.tgv === 'number' && Array.isArray(parsed.consumers)) {
        return { ...DEFAULT_GVS_INPUTS, ...parsed };
      }
      return DEFAULT_GVS_INPUTS;
    } catch (e) {
      return DEFAULT_GVS_INPUTS;
    }
  });

  const [gvsPointsInputs, setGvsPointsInputs] = useState<GvsPointsInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_gvs_points') : null;
      if (!saved) return DEFAULT_GVS_POINTS_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.tgv === 'number' && Array.isArray(parsed.points)) {
        return { ...DEFAULT_GVS_POINTS_INPUTS, ...parsed };
      }
      return DEFAULT_GVS_POINTS_INPUTS;
    } catch (e) {
      return DEFAULT_GVS_POINTS_INPUTS;
    }
  });

  const [gvsCateringInputs, setGvsCateringInputs] = useState<GvsCateringInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_gvs_catering') : null;
      if (!saved) return DEFAULT_GVS_CATERING_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.tgv === 'number' && typeof parsed.seats === 'number') {
        return { ...DEFAULT_GVS_CATERING_INPUTS, ...parsed };
      }
      return DEFAULT_GVS_CATERING_INPUTS;
    } catch (e) {
      return DEFAULT_GVS_CATERING_INPUTS;
    }
  });

  const [gvsPipeInputs, setGvsPipeInputs] = useState<GvsPipeInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_gvs_pipe') : null;
      if (!saved) return DEFAULT_GVS_PIPE_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.diameter === 'number' && typeof parsed.velocity === 'number') {
        return { ...DEFAULT_GVS_PIPE_INPUTS, ...parsed };
      }
      return DEFAULT_GVS_PIPE_INPUTS;
    } catch (e) {
      return DEFAULT_GVS_PIPE_INPUTS;
    }
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('heatload_current_view', currentView);
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_heating_volume', JSON.stringify(heatingVolumeInputs));
  }, [heatingVolumeInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_heating_no_volume', JSON.stringify(heatingNoVolumeInputs));
  }, [heatingNoVolumeInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_heating_outdoor_area', JSON.stringify(heatingOutdoorAreaInputs));
  }, [heatingOutdoorAreaInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_ventilation_volume', JSON.stringify(ventilationVolumeInputs));
  }, [ventilationVolumeInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_ventilation_curtain', JSON.stringify(ventilationCurtainInputs));
  }, [ventilationCurtainInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_ventilation_equipment', JSON.stringify(ventilationEquipmentInputs));
  }, [ventilationEquipmentInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_pool_heating', JSON.stringify(poolHeatingInputs));
  }, [poolHeatingInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_pool_operating', JSON.stringify(poolOperatingInputs));
  }, [poolOperatingInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_pool_flow', JSON.stringify(poolFlowInputs));
  }, [poolFlowInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_pool_periodic', JSON.stringify(poolPeriodicInputs));
  }, [poolPeriodicInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_floor_heating', JSON.stringify(floorHeatingInputs));
  }, [floorHeatingInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_gvs', JSON.stringify(gvsInputs));
  }, [gvsInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_gvs_points', JSON.stringify(gvsPointsInputs));
  }, [gvsPointsInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_gvs_catering', JSON.stringify(gvsCateringInputs));
  }, [gvsCateringInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_gvs_pipe', JSON.stringify(gvsPipeInputs));
  }, [gvsPipeInputs]);

  // PWA Install Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  // --- Address Custom Autosuggest Engine ---
  // Load Yandex script in background for fallback check
  useEffect(() => {
    const SCRIPT_ID = 'yandex-maps-api-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      const apiKey = (import.meta.env as any).VITE_YANDEX_MAPS_API_KEY || '';
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apiKey ? `&apikey=${apiKey}` : ''}`;
      script.type = 'text/javascript';
      document.head.appendChild(script);
    }
  }, []);

  // Track any input element with id="objectAddress" globally via focus & input delegation
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target && target.id === 'objectAddress') {
        setAddressInput(target);
        setAddressQuery(target.value);
        setShowSuggestions(true);
        updateCoords(target);
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.id === 'objectAddress') {
        setAddressQuery(target.value);
        setShowSuggestions(true);
        updateCoords(target);
      }
    };

    const handleScrollOrResize = () => {
      const active = document.activeElement as HTMLInputElement;
      if (active && active.id === 'objectAddress') {
        updateCoords(active);
      }
    };

    const updateCoords = (el: HTMLInputElement) => {
      const rect = el.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('input', handleInput);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('input', handleInput);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.id === 'objectAddress' || target.closest('.address-dropdown-container')) {
        return;
      }
      setShowSuggestions(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard controls for suggestions navigation (ArrowDown, ArrowUp, Enter, Escape)
  useEffect(() => {
    if (!addressInput || !showSuggestions || suggestions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          e.preventDefault();
          selectSuggestion(suggestions[focusedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    addressInput.addEventListener('keydown', handleKeyDown);
    return () => {
      addressInput.removeEventListener('keydown', handleKeyDown);
    };
  }, [addressInput, showSuggestions, suggestions, focusedIndex]);

  // Debounced search query resolver
  useEffect(() => {
    if (!addressQuery || addressQuery.trim().length < 2) {
      setSuggestions([
        'г. Москва, ул. Арбат',
        'г. Москва, Тверская ул.',
        'г. Москва, пр-т Андропова',
        'г. Москва, Нагатинская ул.',
        'г. Москва, Ленинградский пр-кт',
        'г. Москва, Варшавское шоссе'
      ]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSuggestLoading(true);
      
      const apiKey = (import.meta.env as any).VITE_YANDEX_MAPS_API_KEY || '64dabf1e-47ee-4fed-86d8-36ba688141f8';
      let yandexSucceeded = false;

      if (apiKey) {
        try {
          // Prepend "Москва, " to force Yandex Geocoder to prefer and search inside Moscow
          let searchGeo = addressQuery;
          if (!searchGeo.toLowerCase().includes('москва') && !searchGeo.toLowerCase().includes('московская')) {
            searchGeo = 'Москва, ' + searchGeo;
          }

          const data = await fetchYandexJSONP(searchGeo, apiKey);
          const members = data?.response?.GeoObjectCollection?.featureMember;
          if (members && members.length > 0) {
            const formatted = members.map((member: any) => {
              const geoObj = member?.GeoObject;
              const fullText = geoObj?.metaDataProperty?.GeocoderMetaData?.text;
              if (fullText) {
                const lowerText = fullText.toLowerCase();
                // Strictly filter suggestions to only include Moscow or Moscow Oblast (городское поселение, Мытищи, etc)
                const isMoscowArea = lowerText.includes('москва') || lowerText.includes('московская');
                if (!isMoscowArea) return null;

                return cleanAndFormatMoscowAddress(fullText);
              }
              return null;
            }).filter(Boolean);
            
            if (formatted.length > 0) {
              setSuggestions(formatted);
              setIsSuggestLoading(false);
              yandexSucceeded = true;
            }
          }
        } catch (err) {
          console.warn('Yandex Geocoder JSONP fails, using fallbacks:', err);
        }
      }

      if (yandexSucceeded) return;

      // High-fidelity local database search to avoid errors & work beautifully offline (Moscow Only)
      const queryLower = addressQuery.toLowerCase();
      const localSuggestions: string[] = [];

      // Moscow database (highly prioritized because of PAO "MOEK")
      const moscowStreets = [
        'Нагатинская ул., д. 30',
        'пр-т Андропова, д. 18',
        'ул. Арбат, д. 12',
        'Тверская ул., д. 8',
        'Ленинградский пр-кт, д. 37',
        'Варшавское шоссе, д. 125',
        'Кутузовский пр-кт, д. 24',
        'Профсоюзная ул., д. 56',
        'Пресненская наб., д. 12',
        'ул. Большая Якиманка, д. 15',
        'Можайское шоссе, д. 4',
        'пр-т Вернадского, д. 78'
      ];

      // Match general moscow streets
      moscowStreets.forEach(street => {
        if (street.toLowerCase().includes(queryLower) || 'москва'.includes(queryLower)) {
          localSuggestions.push(`г. Москва, ${street}`);
        }
      });
      
      // Also add Moscow Oblast default matches that start with query
      const commonCities = [
        'г. Москва, ',
        'г. Московская область, г. Мытищи, ',
        'г. Московская область, г. Химки, ',
        'г. Московская область, г. Подольск, ',
        'г. Московская область, г. Люберцы, ',
        'г. Московская область, г. Balaшиха, ',
        'г. Московская область, г. Одинцово, '
      ];

      commonCities.forEach(city => {
        if (city.toLowerCase().includes(queryLower)) {
          localSuggestions.push(`${city}ул. Ленина, д. 1`);
        }
      });

      // If we have local suggestions, use them as quick instant response
      if (localSuggestions.length > 0) {
        setSuggestions(localSuggestions.slice(0, 6));
        setIsSuggestLoading(false);
        return;
      }

      // Fallback query Nominatim asynchronously but quietly without throwing logs
      try {
        let osmQuery = addressQuery;
        if (!osmQuery.toLowerCase().includes('москва') && !osmQuery.toLowerCase().includes('московская')) {
          osmQuery = 'Москва, ' + osmQuery;
        }
        osmQuery = osmQuery.replace(/(^|\s)г\.(?=\s|$)/gi, '$1город ');
        osmQuery = osmQuery.replace(/(^|\s)г(?=\s|$)/gi, '$1город ');
        osmQuery = osmQuery.replace(/(^|\s)ул\.(?=\s|$)/gi, '$1улица ');
        osmQuery = osmQuery.replace(/(^|\s)ул(?=\s|$)/gi, '$1улица ');
        osmQuery = osmQuery.replace(/(^|\s)пр-кт(?=\s|$)/gi, '$1проспект ');
        osmQuery = osmQuery.replace(/(^|\s)пр\.?(?=\s|$)/gi, '$1проспект ');

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(osmQuery)}&format=json&accept-language=ru&limit=10&countrycodes=ru`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(2000), // Max 2 seconds wait
          headers: {
            'Accept-Language': 'ru_RU,ru;q=0.9',
            'User-Agent': 'HeatLoadCalculatorApp/1.0',
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const formatted = data.map((item: any) => {
              const cleaned = cleanAndFormatMoscowAddress(item.display_name);
              return cleaned;
            }).filter((name: string) => {
              if (!name) return false;
              const ln = name.toLowerCase();
              return ln.includes('москва') || ln.includes('московская');
            });
            if (formatted.length > 0) {
              setSuggestions(formatted);
            }
          }
        }
      } catch (err) {
        // Silently capture Nominatim connection/CORS errors
      } finally {
        setIsSuggestLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [addressQuery]);

  const selectSuggestion = (val: string) => {
    // Write value to localStorage
    localStorage.setItem('heatload_metadata_object_address', val);
    
    // Broadcast custom event so all active calculator states are updated in real-time
    window.dispatchEvent(new CustomEvent('objectAddressUpdated', { detail: val }));

    const inputEl = document.getElementById('objectAddress') as HTMLInputElement || addressInput;
    if (inputEl) {
      const lastValue = inputEl.value;
      
      // React 16+ value tracker bypass to trigger standard controlled onChange handler
      const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeValueSetter) {
        nativeValueSetter.call(inputEl, val);
      } else {
        inputEl.value = val;
      }
      
      const tracker = (inputEl as any)._valueTracker;
      if (tracker) {
        tracker.setValue(lastValue);
      }
      
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Synchronize App query state
    setAddressQuery(val);
    setShowSuggestions(false);
    setFocusedIndex(-1);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={setCurrentView} />;
      case 'heating-volume':
        return (
          <HeatingVolumeCalculator 
            inputs={heatingVolumeInputs} 
            setInputs={setHeatingVolumeInputs} 
            onBack={() => setCurrentView('home')} 
          />
        );
      case 'heating-no-volume':
        return (
          <HeatingNoVolumeCalculator 
            inputs={heatingNoVolumeInputs} 
            setInputs={setHeatingNoVolumeInputs} 
            onBack={() => setCurrentView('home')} 
          />
        );
      case 'heating-outdoor-area':
        return (
          <HeatingOutdoorAreaCalculator 
            inputs={heatingOutdoorAreaInputs} 
            setInputs={setHeatingOutdoorAreaInputs} 
            onBack={() => setCurrentView('home')} 
          />
        );
      case 'vent-supply':
        return (
          <VentilationVolumeCalculator
            inputs={ventilationVolumeInputs}
            setInputs={setVentilationVolumeInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'vent-curtain':
        return (
          <VentilationCurtainCalculator
            inputs={ventilationCurtainInputs}
            setInputs={setVentilationCurtainInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'vent-equipment':
        return (
          <VentilationEquipmentCalculator
            inputs={ventilationEquipmentInputs}
            setInputs={setVentilationEquipmentInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'tech-floor':
        return (
          <HeatingFloorCalculator
            inputs={floorHeatingInputs}
            setInputs={setFloorHeatingInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'tech-pool':
        return (
          <PoolHeatingCalculator
            inputs={poolHeatingInputs}
            setInputs={setPoolHeatingInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'tech-pool-operating':
        return (
          <PoolOperatingCalculator
            inputs={poolOperatingInputs}
            setInputs={setPoolOperatingInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'tech-pool-flow':
        return (
          <PoolFlowCalculator
            inputs={poolFlowInputs}
            setInputs={setPoolFlowInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'tech-pool-periodic':
        return (
          <PoolPeriodicCalculator
            inputs={poolPeriodicInputs}
            setInputs={setPoolPeriodicInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'gvs':
        return (
          <GvsCalculator
            inputs={gvsInputs}
            setInputs={setGvsInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'gvs-points':
        return (
          <GvsPointsCalculator
            inputs={gvsPointsInputs}
            setInputs={setGvsPointsInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'gvs-catering':
        return (
          <GvsCateringCalculator
            inputs={gvsCateringInputs}
            setInputs={setGvsCateringInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'gvs-pipe':
        return (
          <GvsPipeCalculator
            inputs={gvsPipeInputs}
            setInputs={setGvsPipeInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      default:
        return <HomeView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              <div className="lg:hidden flex items-center gap-2">
                <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
                  <Maximize2 size={16} />
                </div>
                <span className="font-bold tracking-tight">HeatLoad Pro</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {showInstallBtn && (
                <button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-emerald-600 active:scale-95"
                >
                  <Maximize2 size={14} />
                  <span className="hidden sm:inline">Установить</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Yandex/OSM Coordinates Autocomplete overlay */}
      {showSuggestions && suggestions.length > 0 && typeof window !== 'undefined' && (
        <div 
          className="address-dropdown-container absolute z-[9999] rounded-xl border border-zinc-200 bg-white/95 backdrop-blur-md p-1.5 shadow-xl transition-all"
          style={{
            top: dropdownCoords.top,
            left: dropdownCoords.left,
            width: dropdownCoords.width,
          }}
        >
          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  idx === focusedIndex 
                    ? 'bg-orange-500 text-white' 
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <MapPin size={12} className={idx === focusedIndex ? 'text-white' : 'text-zinc-400'} />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-zinc-150 mt-1.5 pt-1.5 px-3 pb-1 flex justify-between items-center text-[10px] text-zinc-450 font-medium">
            <span>Адресные подсказки</span>
            {isSuggestLoading ? (
              <span className="flex items-center gap-1 text-orange-500 font-semibold animate-pulse">
                Поиск...
              </span>
            ) : (
              <span className="text-zinc-400">Яндекс Карта / OSM</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
