import React, { useMemo, useState } from 'react';
import { 
  ArrowLeft,
  Info,
  Sliders,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Download,
  Droplets,
  ClipboardList,
  FlameKindling,
  Disc
} from 'lucide-react';
import { motion } from 'motion/react';
import { GvsPipeInputs } from '../types';
import { DEFAULT_GVS_PIPE_INPUTS } from '../constants';

interface GvsPipeCalculatorProps {
  inputs: GvsPipeInputs;
  setInputs: React.Dispatch<React.SetStateAction<GvsPipeInputs>>;
  onBack: () => void;
}

export const GvsPipeCalculator: React.FC<GvsPipeCalculatorProps> = ({
  inputs = DEFAULT_GVS_PIPE_INPUTS,
  setInputs,
  onBack
}) => {
  const [copied, setCopied] = useState(false);
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true
  });

  // Calculate coefficient Ktp based on insulation & layout properties
  const ktp = useMemo(() => {
    if (inputs.ktpOverride !== null) return inputs.ktpOverride;
    
    if (inputs.ktpMode === 'insulated') {
      if (inputs.ktpTowels === 'without') {
        return inputs.ktpExternal === 'with' ? 0.15 : 0.1;
      } else {
        return inputs.ktpExternal === 'with' ? 0.25 : 0.2;
      }
    } else {
      if (inputs.ktpTowels === 'without') {
        return inputs.ktpExternal === 'with' ? 0.25 : 0.2;
      } else {
        return inputs.ktpExternal === 'with' ? 0.35 : 0.3;
      }
    }
  }, [inputs.ktpOverride, inputs.ktpMode, inputs.ktpTowels, inputs.ktpExternal]);

  // Calculations for Pipe-based water flow and thermal load
  const calculations = useMemo(() => {
    const dMm = inputs.diameter || 0;
    const dMeters = dMm / 1000;
    const pi = 3.14;
    const v = 1.2; // Velocity is fixed constant of 1.2 m/s

    // V_gvs = pi * d^2 / 4 * v * 3600 (m3/hour)
    const vGvs = (pi * Math.pow(dMeters, 2) / 4) * v * 3600;

    // Q_gvs = V_gvs * (t_gvs - t_xv) * 10^-3 * (1 + K_tp)
    const tgv = 65; // Hot water temperature is fixed constant 65 °C
    const txv = 5;  // Cold water temperature is fixed constant 5 °C
    const dt = tgv - txv;

    const qGcal = vGvs * dt * 0.001 * (1 + ktp);

    // Alternative units
    const qMW = qGcal * 1.163;
    const qKW = qMW * 1000;

    return {
      dMm,
      dMeters,
      pi,
      v,
      vGvs,
      tgv,
      txv,
      dt,
      qGcal,
      qMW,
      qKW
    };
  }, [inputs.diameter, ktp]);

  const toggleStep = (stepNumber: number) => {
    setOpenSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  // Compile detailed text report
  const compilePipeReport = () => {
    return `ОТЧЕТ О РАСЧЕТЕ ТЕПЛОВОЙ НАГРУЗКИ ГВС ПО СЕЧЕНИЮ ТРУБОПРОВОДА
(при самовольном присоединении и/или пользовании системами ГВС)
--------------------------------------------------------------------------
1. Исходные параметры трубопровода и расчетные условия:
   - Внутренний диаметр трубопровода (d): ${calculations.dMm} мм (${calculations.dMeters.toFixed(4)} м)
   - Скорость движения воды (v): ${calculations.v} м/с
   - Математическая константа (π): ${calculations.pi}

2. Расчет часового объема горячей воды (Vгвс):
   Vгвс = π × d² / 4 × v × 3600
   Vгвс = 3.14 × (${calculations.dMeters.toFixed(4)})² / 4 × ${calculations.v} × 3600 = ${calculations.vGvs.toFixed(4)} м³/ч

3. Тепловые параметры воды:
   - Температура горячей воды (tгв): ${calculations.tgv} °C
   - Температура холодной воды (tхв): ${calculations.txv} °C
   - Разность температур (Δt): ${calculations.dt} °C

4. Потери трубопроводов:
   - Коэффициент потерь (Ктп): ${ktp}
     (Выбранные параметры: стояки ${inputs.ktpMode === 'insulated' ? 'изолированные' : 'неизолированные'}, полотенцесушители: ${inputs.ktpTowels === 'with' ? 'есть' : 'нет'}, наружные сети после ЦТП: ${inputs.ktpExternal === 'with' ? 'есть' : 'нет'})

5. Итоговая тепловая нагрузка на ГВС (Qгвс):
   Qгвс = Vгвс × (tгв - tхв) × 10⁻³ × (1 + Ктп)
   Qгвс = ${calculations.vGvs.toFixed(4)} × ${calculations.dt} × 0.001 × ${1 + ktp} = ${calculations.qGcal.toFixed(6)} Гкал/ч

6. Эквивалентные значения мощности:
   - Мощность в кВт: ${Math.round(calculations.qKW).toLocaleString()} кВт
   - Мощность в МВт: ${calculations.qMW.toFixed(4)} МВт
--------------------------------------------------------------------------
Расчет выполнен по утвержденному приказом алгоритму оценки бездоговорного потребления ГВС.`;
  };

  const handleCopyReport = () => {
    const text = compilePipeReport();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const text = compilePipeReport();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gvs_pipe_report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with back button and action tools */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-150 pb-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-zinc-500 hover:text-zinc-950 transition-colors text-sm font-semibold self-start"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Вернуться в меню
        </button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopyReport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-100 font-semibold text-xs active:scale-98 transition-all"
          >
            {copied ? (
              <>
                <Check size={13} className="text-green-600" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Буфер обмена</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 hover:bg-blue-100 font-semibold text-xs active:scale-98 transition-all"
          >
            <Download size={13} />
            <span>Скачать отчет</span>
          </button>
        </div>
      </div>

      {/* Header Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <Droplets size={24} className="text-blue-500" />
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Расчет ГВС по сечению трубы
          </h1>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
          Определение часового объема горячего водоснабжения по поперечной площади сечения трубы и нормативной скорости движения воды при обнаружении несанкционированного (самовольного) подключения или пользования централизованной системой ГВС.
        </p>
      </div>

      {/* Main Grid layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left hand side: Input fields */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-3 flex items-center gap-2">
              <Sliders size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                1. Параметры трубопровода подключения
              </h2>
            </div>

            {/* Diameter field with quick selector buttons */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-zinc-700">
                  Внутреннее сечение (диаметр) трубопровода, d (мм)
                </label>
                <span className="font-mono text-[10px] text-zinc-450">
                  В метрах: {calculations.dMeters.toFixed(4)} м
                </span>
              </div>
              
              <div className="relative font-mono">
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  value={inputs.diameter || ''}
                  onChange={(e) => setInputs(prev => ({ ...prev, diameter: Math.max(1, parseInt(e.target.value) || 0) }))}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 font-mono text-sm font-semibold outline-none focus:border-blue-500"
                  placeholder="Например: 15, 20, 25, 32..."
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                  мм
                </span>
              </div>

              {/* Standard Diameter presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Стандартные диаметры труб:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[15, 20, 25, 32, 40, 50, 70, 80, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, diameter: preset }))}
                      className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                        inputs.diameter === preset
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                      }`}
                    >
                      DN {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Constant parameters display */}
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none block">
                Константные расчетные параметры (Нормативы коммерческого учета)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Velocity constant indicator */}
                <div className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Скорость воды, v</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-mono text-base font-bold text-zinc-900">1.2</span>
                    <span className="text-[10px] font-bold text-zinc-500">м/с</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 mt-1 leading-snug">Нормативная скорость бездоговорного течения</span>
                </div>

                {/* t_gvs constant indicator */}
                <div className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Горячая вода, tгв</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-mono text-base font-bold text-zinc-900">65</span>
                    <span className="text-[10px] font-bold text-zinc-500">°C</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 mt-1 leading-snug">Стандартная температура комм. отпуска</span>
                </div>

                {/* t_xv constant indicator */}
                <div className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Холодная вода, tхв</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-mono text-base font-bold text-zinc-900">5</span>
                    <span className="text-[10px] font-bold text-zinc-500">°C</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 mt-1 leading-snug">Базовая температура холодного источника</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-450 leading-relaxed italic">
                * Данные константы зафиксированы согласно методике определения объемов потребления горячей воды при отсутствии коммерческих приборов учета.
              </p>
            </div>
          </section>

          {/* Interactive Pipe loses Ktp section */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-850 flex items-center gap-1 flex-wrap">
                Учет потерь трубопроводов ГВС (коэффициент К<sub>тп</sub>)
              </label>
              <div className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shrink-0">
                Ктп = {ktp.toFixed(2)}
              </div>
            </div>

            {/* Override checkbox option */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-650 font-semibold">
                <input
                  type="checkbox"
                  checked={inputs.ktpOverride !== null}
                  onChange={(e) => setInputs(prev => ({
                    ...prev,
                    ktpOverride: e.target.checked ? 0.2 : null
                  }))}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                Задать коэффициент Ктп вручную
              </label>

              {inputs.ktpOverride !== null && (
                <div className="relative w-full sm:w-28 font-mono">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={inputs.ktpOverride}
                    onChange={(e) => setInputs(prev => ({ ...prev, ktpOverride: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 font-mono text-xs font-medium focus:border-blue-500 focus:bg-white outline-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400"></span>
                </div>
              )}
            </div>

            {inputs.ktpOverride === null && (
              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 sm:p-4 space-y-3.5">
                {/* Insulated layout */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Изоляция стояков</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, ktpMode: 'insulated' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        inputs.ktpMode === 'insulated'
                          ? 'bg-white border-blue-300 shadow-sm text-blue-700 font-bold'
                          : 'bg-zinc-100/50 border-zinc-200 text-zinc-650 hover:bg-zinc-100'
                      }`}
                    >
                      С изолированными стояками
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, ktpMode: 'non-insulated' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        inputs.ktpMode === 'non-insulated'
                          ? 'bg-white border-blue-300 shadow-sm text-blue-700 font-bold'
                          : 'bg-zinc-100/50 border-zinc-200 text-zinc-650 hover:bg-zinc-100'
                      }`}
                    >
                      С неизолированными стояками
                    </button>
                  </div>
                </div>

                {/* Towels rails */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Полотенцесушители</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, ktpTowels: 'with' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        inputs.ktpTowels === 'with'
                          ? 'bg-white border-blue-300 shadow-sm text-blue-700 font-bold'
                          : 'bg-zinc-100/50 border-zinc-200 text-zinc-650 hover:bg-zinc-100'
                      }`}
                    >
                      С полотенцесушителями
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, ktpTowels: 'without' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        inputs.ktpTowels === 'without'
                          ? 'bg-white border-blue-300 shadow-sm text-blue-700 font-bold'
                          : 'bg-zinc-100/50 border-zinc-200 text-zinc-650 hover:bg-zinc-100'
                      }`}
                    >
                      Без полотенцесушителей
                    </button>
                  </div>
                </div>

                {/* External networks */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Наружные сети горячего водоснабжения после ЦТП</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, ktpExternal: 'with' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        inputs.ktpExternal === 'with'
                          ? 'bg-white border-blue-300 shadow-sm text-blue-700 font-bold'
                          : 'bg-zinc-100/50 border-zinc-200 text-zinc-650 hover:bg-zinc-100'
                      }`}
                    >
                      С наружной сетью ГВС после ЦТП
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, ktpExternal: 'without' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        inputs.ktpExternal === 'without'
                          ? 'bg-white border-blue-300 shadow-sm text-blue-700 font-bold'
                          : 'bg-zinc-100/50 border-zinc-200 text-zinc-650 hover:bg-zinc-100'
                      }`}
                    >
                      Без наружной сети ГВС после ЦТП
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right hand side: Calculation Results */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-4 sm:space-y-6">
          
          {/* Main Gcal Load Output on top, followed by m3/h */}
          <div className="rounded-2xl sm:rounded-3xl bg-zinc-950 p-4 sm:p-6 text-white shadow-xl border border-zinc-850 relative overflow-hidden flex flex-col justify-between min-h-[11rem] sm:min-h-[12rem] h-auto transition-all">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 bg-blue-500/15 blur-3xl z-0" />

            <div className="z-10 flex items-center justify-between gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-blue-400 flex items-center gap-1.5 min-w-0 truncate">
                <FlameKindling size={14} className="shrink-0" />
                <span className="truncate">Тепловая нагрузка ГВС (Q<sub>гвс.ср</sub>)</span>
              </span>
              <span className="font-mono text-[10px] bg-zinc-900 border border-zinc-850 text-zinc-400 px-2.5 py-0.5 rounded font-bold shrink-0">
                d = {calculations.dMm} мм
              </span>
            </div>

            <div className="z-10 mt-3">
              {/* Primary Value: Gcal/h (placed first) */}
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-3xl sm:text-5xl font-semibold tracking-tight text-white font-mono leading-none">
                  {calculations.qGcal.toFixed(6)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-blue-400 uppercase">Гкал/ч</span>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-zinc-850 text-center">
                <div className="space-y-0.5 text-left">
                  <div className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider">Объем Vгвс</div>
                  <div className="font-mono text-[11px] sm:text-xs font-extrabold text-zinc-100">{calculations.vGvs.toFixed(3)} м³/ч</div>
                </div>
                <div className="space-y-0.5 text-left pl-1">
                  <div className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider">Значение кВт</div>
                  <div className="font-mono text-[11px] sm:text-xs font-semibold text-zinc-150">{Math.round(calculations.qKW).toLocaleString()}</div>
                </div>
                <div className="space-y-0.5 text-left pl-1">
                  <div className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider">Значение МВт</div>
                  <div className="font-mono text-[11px] sm:text-xs font-semibold text-zinc-150">{calculations.qMW.toFixed(4)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical breakdowns / Formulas steps card */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden divide-y divide-zinc-100">
            <div className="p-4 bg-zinc-50 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList size={14} className="text-zinc-500" />
                <span>Шаги расчетов и формулы</span>
              </span>
            </div>

            {/* Step 1: inner piping losses Ktp */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(1)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 1:</span> Коэффициент потерь трубопроводов К<sub>тп</sub>
                </span>
                {openSteps[1] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>
              
              {openSteps[1] && (
                <div className="pt-2 text-zinc-650 space-y-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Определяется на основе изоляции и конфигурации распределительных сетей:</p>
                  <p className="font-mono text-zinc-800 font-bold">Значение Ктп = {ktp}</p>
                </div>
              )}
            </div>

            {/* Step 2: V_gvs formula calculation */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(2)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 2:</span> Расчет часового объема воды (V<sub>гвс</sub>)
                </span>
                {openSteps[2] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>
              
              {openSteps[2] && (
                <div className="pt-2 text-zinc-650 space-y-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Объем горячего водоснабжения зависит от площади внутреннего сечения трубопровода:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 rounded text-[11px] font-bold text-zinc-800 leading-relaxed">
                    Vгвс = π · d² / 4 · v · 3600, м³/час
                  </div>
                  <p>Где:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li><strong>π</strong> (число Пи) = {calculations.pi}</li>
                    <li><strong>d</strong> (диаметр сечения) = {calculations.dMeters.toFixed(4)} м ({calculations.dMm} мм)</li>
                    <li><strong>v</strong> (нормативная скорость) = {calculations.v} м/с</li>
                    <li><strong>3600</strong> — число секунд в одном часе</li>
                  </ul>
                  <p>Следовательно:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[11px] rounded leading-relaxed">
                    Vгвс = 3.14 · ({calculations.dMeters.toFixed(4)})² / 4 · {calculations.v} · 3600 = <span className="text-blue-600 font-extrabold">{calculations.vGvs.toFixed(4)} м³/ч</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Heat power difference temperature and density integration */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(3)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 3:</span> Разность температур (Δt)
                </span>
                {openSteps[3] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>
              
              {openSteps[3] && (
                <div className="pt-2 text-zinc-650 space-y-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Разность температур горячей и холодной воды:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[11px] rounded leading-relaxed">
                    Δt = tгв – tхв = {calculations.tgv} – {calculations.txv} = <span className="font-bold text-zinc-800">{calculations.dt} °C</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Final Heat rate load calculation first to display */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(4)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 4:</span> Итоговая тепловая нагрузка (Q<sub>гвс.ср</sub>)
                </span>
                {openSteps[4] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>
              
              {openSteps[4] && (
                <div className="pt-2 text-zinc-650 space-y-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Часовая тепловая нагрузка на нагрев объема V<sub>гвс</sub> с учетом потерь К<sub>тп</sub>:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[11px] rounded leading-loose">
                    Qгвс = Vгвс · Δt · 10⁻³ · (1 + Ктп)<br />
                    Qгвс = {calculations.vGvs.toFixed(4)} · {calculations.dt} · 0.001 · (1 + {ktp}) = <span className="text-blue-600 font-extrabold">{calculations.qGcal.toFixed(6)} Гкал/ч</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Эквивалентно в других тепловых единицах:<br />
                    • Мощность в кВт: <strong className="text-zinc-850">{Math.round(calculations.qKW).toLocaleString()}</strong> кВт<br />
                    • Мощность в МВт: <strong className="text-zinc-850">{calculations.qMW.toFixed(4)}</strong> МВт
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* SRO / Reference legal info */}
          <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-100/80 flex items-start gap-3">
            <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase">Юридическое обоснование</span>
              <p className="text-[10.5px] text-amber-800 leading-relaxed">
                Вычисление объема по пропускной способности при скорости <strong>1,2 м/с</strong> базируется на правилах организации коммерческого учета горячей воды и тепловой энергии в случае бездоговорного и самовольного подключения к системам водоснабжения.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
