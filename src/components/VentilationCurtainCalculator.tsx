import React, { useMemo } from 'react';
import { 
  Download, 
  RefreshCw, 
  Thermometer, 
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Wind,
  Maximize2
} from 'lucide-react';
import { motion } from 'motion/react';
import { VentilationCurtainInputs } from '../types';
import { DEFAULT_VENTILATION_CURTAIN_INPUTS } from '../constants';
import { InputField } from './InputField';

interface VentilationCurtainCalculatorProps {
  inputs: VentilationCurtainInputs;
  setInputs: React.Dispatch<React.SetStateAction<VentilationCurtainInputs>>;
  onBack: () => void;
}

// Helper to get air density based on temperature (approximate formula: 353 / (273.15 + t))
// This will be refined when HTML data is provided
const getAirDensity = (t: number) => {
  return 353 / (273.15 + t);
};

export const VentilationCurtainCalculator: React.FC<VentilationCurtainCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  const calculation = useMemo(() => {
    const { height, width, ti, to, curtainType } = inputs;
    
    // Constants
    const q = 0.6;
    const mu = 0.25;
    const g = 9.8;
    const cz = 0.29; // kcal/(m3*C) - as per prompt
    const tz = curtainType === 'door' ? 50 : 70;

    // 1. Area of opening
    const Fpr = height * width;

    // 2. Densities
    const rhoN = getAirDensity(to);
    const rhoV = getAirDensity(ti);
    
    // Temperature of mixture is taken equal to internal temperature
    const rhoSm = getAirDensity(ti);

    // 3. Pressure difference
    const deltaP = 0.5 * height * (rhoN - rhoV) * g;

    // 4. Air quantity
    const Lz = 5112 * q * mu * Fpr * Math.sqrt(Math.max(0, deltaP * rhoSm));

    // 5. Heat load
    const totalGcal = Lz * cz * (tz - to) * 1e-6;
    const totalMW = totalGcal / 0.859845;

    return {
      Fpr,
      rhoN,
      rhoV,
      rhoSm,
      deltaP,
      Lz,
      tz,
      totalGcal: Math.round(totalGcal * 1000000) / 1000000,
      totalMW: Math.round(totalMW * 1000) / 1000,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs]);

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_VENTILATION_CURTAIN_INPUTS);
    }
  };

  const handleExport = () => {
    const content = `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ НА ТЕПЛОВУЮ ЗАВЕСУ
==========================================
Дата: ${calculation.timestamp}

ИСХОДНЫЕ ДАННЫЕ:
----------------
Тип проема: ${inputs.curtainType === 'door' ? 'Наружная дверь' : 'Ворота/Тех. проем'}
Высота проема (hпр): ${inputs.height} м
Ширина проема (wпр): ${inputs.width} м
Температура внутри (ti): ${inputs.ti} °C
Температура снаружи (to): ${inputs.to} °C

ПРОМЕЖУТОЧНЫЕ РАСЧЕТЫ:
----------------------
Площадь проема (Fпр): ${calculation.Fpr.toFixed(2)} м²
Плотность наружного воздуха (ρн): ${calculation.rhoN.toFixed(3)} кг/м³
Плотность воздуха помещения (ρв): ${calculation.rhoV.toFixed(3)} кг/м³
Разность давлений (Δp): ${calculation.deltaP.toFixed(2)} Па
Количество воздуха (Lз): ${calculation.Lz.toFixed(0)} кг/ч
Температура завесы (tз): ${calculation.tz} °C

ИТОГ:
-----
${calculation.totalGcal} Гкал/час
${calculation.totalMW} МВт
=======================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `heat_curtain_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Вернуться в меню</span>
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Сброс</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-95"
          >
            <Download size={14} />
            <span>Экспорт</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl">
        <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl">
          Установление максимальной тепловой нагрузки на тепловую завесу.
        </h1>
        <div className="mt-4 h-1 w-20 rounded-full bg-zinc-900" />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Input Panel */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Maximize2 size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Параметры проема</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Тип проема</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInputs(prev => ({ ...prev, curtainType: 'door' }))}
                    className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${inputs.curtainType === 'door' ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200'}`}
                  >
                    Наружная дверь (50°C)
                  </button>
                  <button
                    onClick={() => setInputs(prev => ({ ...prev, curtainType: 'gate' }))}
                    className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${inputs.curtainType === 'gate' ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200'}`}
                  >
                    Ворота (70°C)
                  </button>
                </div>
              </div>

              <InputField 
                label="hпр - высота проема" 
                id="height" 
                value={inputs.height} 
                onChange={(val) => setInputs(prev => ({ ...prev, height: val }))}
                suffix="м"
                hint="Высота открываемого проема."
              />

              <InputField 
                label="wпр - ширина проема" 
                id="width" 
                value={inputs.width} 
                onChange={(val) => setInputs(prev => ({ ...prev, width: val }))}
                suffix="м"
                hint="Ширина открываемого проема."
              />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Thermometer size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Температурные параметры</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <InputField 
                label="ti (Внутренняя темп.)" 
                id="ti" 
                value={inputs.ti} 
                onChange={(val) => setInputs(prev => ({ ...prev, ti: val }))}
                suffix="°C"
                hint="Расчетная температура воздуха в помещении."
              />

              <InputField 
                label="to (Наружная темп.)" 
                id="to" 
                value={inputs.to} 
                onChange={(val) => setInputs(prev => ({ ...prev, to: val }))}
                suffix="°C"
                hint="Расчетная температура наружного воздуха."
              />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Layers size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Промежуточные значения</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-zinc-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Fпр (Площадь)</div>
                <div className="font-mono text-sm font-bold text-zinc-900">{calculation.Fpr.toFixed(2)} м²</div>
              </div>
              <div className="rounded-xl bg-zinc-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Δp (Давление)</div>
                <div className="font-mono text-sm font-bold text-zinc-900">{calculation.deltaP.toFixed(2)} Па</div>
              </div>
              <div className="rounded-xl bg-zinc-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ρн (Плотность)</div>
                <div className="font-mono text-sm font-bold text-zinc-900">{calculation.rhoN.toFixed(3)}</div>
              </div>
              <div className="col-span-2 rounded-xl bg-zinc-50 p-3 sm:col-span-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Lз (Кол-во воздуха)</div>
                <div className="font-mono text-sm font-bold text-zinc-900">{calculation.Lz.toLocaleString(undefined, { maximumFractionDigits: 0 })} кг/ч</div>
              </div>
            </div>
          </section>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <motion.div 
              layout
              className="overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900 p-8 text-white shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Итоговая нагрузка</span>
                <Wind size={20} className="text-orange-400" />
              </div>
              
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-6xl font-light tracking-tighter">{calculation.totalGcal}</span>
                <span className="text-xl font-medium text-zinc-400">Гкал/час</span>
              </div>

              <div className="mb-8 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="font-bold text-zinc-300">{calculation.totalMW}</span>
                  <span>МВт</span>
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-800 pt-6">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 uppercase font-semibold">Температура завесы</span>
                  <span className="font-mono text-zinc-300">{calculation.tz} °C</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 uppercase font-semibold">Разность температур</span>
                  <span className="font-mono text-zinc-300">{(calculation.tz - inputs.to).toFixed(1)} °C</span>
                </div>
              </div>
            </motion.div>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Методика расчета</h3>
              <div className="rounded-lg bg-zinc-50 p-4 font-mono text-[11px] leading-relaxed text-zinc-600">
                <div className="mb-4 space-y-1">
                  <p className="font-bold text-zinc-900">1. Qоз = Lз · сз · (tз – to) · 10⁻⁶</p>
                  <p className="opacity-70">Lз = {calculation.Lz.toFixed(0)} кг/ч</p>
                  <p className="opacity-70">сз = 0.29 ккал/(м³·°C)</p>
                  <p className="opacity-70">tз = {calculation.tz} °C</p>
                </div>
                <div className="mb-4 space-y-1 border-t border-zinc-200 pt-3">
                  <p className="font-bold text-zinc-900">2. Lз = 5112 · q · μпр · Fпр · √(Δp·ρсм)</p>
                  <p className="opacity-70">q = 0.6, μпр = 0.25</p>
                  <p className="opacity-70">Fпр = {calculation.Fpr.toFixed(2)} м²</p>
                  <p className="opacity-70">ρсм = {calculation.rhoSm.toFixed(3)} кг/м³</p>
                </div>
                <div className="space-y-1 border-t border-zinc-200 pt-3">
                  <p className="font-bold text-zinc-900">3. Δp = 0,5 · hпр · (ρн – ρв) · g</p>
                  <p className="opacity-70">g = 9.8 м/с²</p>
                  <p className="opacity-70">ρн = {calculation.rhoN.toFixed(3)}, ρв = {calculation.rhoV.toFixed(3)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-orange-100 bg-orange-50 p-3 text-[10px] text-orange-800">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>Расчет учитывает разность давлений и плотность воздуха при заданных температурах.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
