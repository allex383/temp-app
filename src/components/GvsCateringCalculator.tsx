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
  FlameKindling
} from 'lucide-react';
import { motion } from 'motion/react';
import { GvsCateringInputs } from '../types';
import { DEFAULT_GVS_CATERING_INPUTS } from '../constants';

interface GvsCateringCalculatorProps {
  inputs: GvsCateringInputs;
  setInputs: React.Dispatch<React.SetStateAction<GvsCateringInputs>>;
  onBack: () => void;
}

export const GvsCateringCalculator: React.FC<GvsCateringCalculatorProps> = ({
  inputs = DEFAULT_GVS_CATERING_INPUTS,
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

  // Determine parameter m (turnovers per hour per seat) and y (non-uniformity coefficient)
  const cateringParams = useMemo(() => {
    switch (inputs.cateringType) {
      case 'open-cafe':
        return { m: 2.0, y: 0.45, label: 'Столовые открытого типа и кафе' };
      case 'students':
        return { m: 3.0, y: 0.45, label: 'Студенческие столовые' };
      case 'industry':
        return { m: 3.0, y: 0.45, label: 'Столовые при промышленных предприятиях' };
      case 'restaurant':
        return { m: 1.5, y: 0.55, label: 'Рестораны' };
      case 'custom':
      default:
        return { m: inputs.mCustom, y: inputs.yCustom, label: 'Свой вариант (Вручную)' };
    }
  }, [inputs.cateringType, inputs.mCustom, inputs.yCustom]);

  // Determine rate qu_t (liters/dish)
  const quRate = useMemo(() => {
    switch (inputs.dishRateType) {
      case 'dining':
        return 3.4;
      case 'takeaway':
        return 2.6;
      case 'custom':
      default:
        return inputs.dishRateCustom;
    }
  }, [inputs.dishRateType, inputs.dishRateCustom]);

  // Run all Gvs catering mathematical steps
  const calculations = useMemo(() => {
    const n = inputs.seats || 0;
    const m = cateringParams.m;
    const y = cateringParams.y;
    const T = inputs.hours || 0;

    // 1. Calculate number of conventional dishes: U_сут = 2.2 * n * m * T * y
    const uSut = 2.2 * n * m * T * y;

    // 2. Daily hot water volume (liters): V_сут = quRate * U_сут
    const vSutLiters = uSut * quRate;

    // 3. Middle hourly flow qT (m3/o): qT = V_сут / 24 / 1000
    const qT = vSutLiters / 24 / 1000;

    // 4. dT = 65 - 5 = 60 °C (constant)
    const tgv = 65;
    const txv = 5;
    const dt = tgv - txv; // 60

    // 5. Q_gvs_mid = q_T * dt * 10^-3 * (1 + Ktp)
    const qGcal = qT * dt * 0.001 * (1 + ktp);

    // Alternative thermal measurements
    const qMW = qGcal * 1.163;
    const qKW = qMW * 1000;

    return {
      n,
      m,
      y,
      T,
      uSut,
      vSutLiters,
      qT,
      tgv,
      txv,
      dt,
      qGcal,
      qMW,
      qKW
    };
  }, [inputs.seats, cateringParams, inputs.hours, quRate, ktp]);

  const toggleStep = (stepNumber: number) => {
    setOpenSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  // Compile detailed text report
  const compileCateringReport = () => {
    const typeLabel = cateringParams.label;
    const rateLabel = inputs.dishRateType === 'dining' 
      ? 'Приготовление реализуемой в обеденном зале (3.4 л/условное блюдо)'
      : inputs.dishRateType === 'takeaway'
      ? 'Приготовление продаваемой на дом (2.6 л/условное блюдо)'
      : `Свой вариант (${quRate} л/условное блюдо)`;

    return `ОТЧЕТ О РАСЧЕТЕ ТЕПЛОВОЙ НАГРУЗКИ ГВС ДЛЯ ОБЩЕСТВЕННОГО ПИТАНИЯ
--------------------------------------------------------------------------
1. Исходные параметры предприятия питания:
   - Тип предприятия: ${typeLabel}
   - Количество посадочных мест (n): ${calculations.n} шт
   - Коэффициент посадок в час (m): ${calculations.m}
   - Коэффициент неравномерности (y): ${calculations.y}
   - Время работы предприятия в сутки (T): ${calculations.T} ч

2. Количество условных блюд за сутки (Uсут):
   Uсут = 2.2 × n × m × T × y
   Uсут = 2.2 × ${calculations.n} × ${calculations.m} × ${calculations.T} × ${calculations.y} = ${Math.round(calculations.uSut).toLocaleString()} условных блюд/сутки

3. Расход горячей воды:
   - Удельный расход на блюдо (qu,т): ${quRate} л/условное блюдо
     (Тип расхода: ${rateLabel})
   - Среднесуточный объем горячей воды (Vсут): ${Math.round(calculations.vSutLiters).toLocaleString()} л/сутки
   - Среднечасовой расход горячей воды (qт):
     qт = qu,т × Uсут / 24 / 1000 = ${calculations.qT.toFixed(4)} м³/ч

4. Тепловые параметры и потери трубопроводов:
   - Температура горячей воды (tгв): 65 °C (константа)
   - Температура холодной воды (tхв): 5 °C (константа)
   - Коэффициент потерь трубопроводов (Ктп): ${ktp}
     (Выбранные параметры: стояки ${inputs.ktpMode === 'insulated' ? 'изолированные' : 'неизолированные'}, полотенцесушители: ${inputs.ktpTowels === 'with' ? 'есть' : 'нет'}, наружные сети после ЦТП: ${inputs.ktpExternal === 'with' ? 'есть' : 'нет'})

5. Итоговая тепловая нагрузка на ГВС (Qгвс.ср):
   Qгвс = qт × (tгв – tхв) × 10⁻³ × (1 + Ктп)
   Qгвс = ${calculations.qT.toFixed(4)} × 60 × 0.001 × ${1 + ktp} = ${calculations.qGcal.toFixed(6)} Гкал/ч

6. Эквивалентные значения мощности:
   - Мощность в кВт: ${Math.round(calculations.qKW).toLocaleString()} кВт
   - Мощность в МВт: ${calculations.qMW.toFixed(4)} МВт
--------------------------------------------------------------------------
Расчет выполнен в HeatLoad Pro по утвержденной методике.`;
  };

  const handleCopyReport = () => {
    const text = compileCateringReport();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const text = compileCateringReport();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gvs_catering_report_${Date.now()}.txt`;
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
            ГВС для предприятий общепита
          </h1>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
          Рассчитывает среднечасовую тепловую нагрузку горячего водоснабжения систем общепита на основе расчетного суточного выпуска условных блюд, зависящего от вместимости зала, коэффициента оборачиваемости мест, коэффициента неравномерности и часов работы.
        </p>
      </div>

      {/* Main Grid structure */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Hand: INPUT CONTROLS */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm space-y-5">
            <div className="border-b border-zinc-100 pb-3 sm:pb-4 flex items-center gap-2">
              <Sliders size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                1. Характеристика предприятия общепита
              </h2>
            </div>

            {/* enterprise seats and hours */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Количество посадочных мест, n (мест)</label>
                <div className="relative font-mono">
                  <input
                    type="number"
                    min="1"
                    value={inputs.seats || ''}
                    onChange={(e) => setInputs(prev => ({ ...prev, seats: Math.max(1, parseInt(e.target.value) || 0) }))}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-sm font-semibold outline-none focus:border-blue-500"
                    placeholder="Введите кол-во мест"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">мест</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Время работы предприятия, T (часов в сутки)</label>
                <div className="relative font-mono">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={inputs.hours || ''}
                    onChange={(e) => setInputs(prev => ({ ...prev, hours: Math.min(24, Math.max(1, parseInt(e.target.value) || 0)) }))}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-sm font-semibold outline-none focus:border-blue-500"
                    placeholder="Введите время работы"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">ч</span>
                </div>
              </div>
            </div>

            {/* Type Selector with m and y coefficients dynamically populated */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 block">Тип предприятия общественного питания (m, y)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { id: 'open-cafe', label: 'Кафе и столовые открытого типа', desc: 'm = 2.0, y = 0.45' },
                  { id: 'students', label: 'Студенческие столовые', desc: 'm = 3.0, y = 0.45' },
                  { id: 'industry', label: 'Столовые при предприятиях', desc: 'm = 3.0, y = 0.45' },
                  { id: 'restaurant', label: 'Рестораны', desc: 'm = 1.5, y = 0.55' },
                  { id: 'custom', label: 'Ввод вручную (Специфический)', desc: 'Задать m и y' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInputs(prev => ({ ...prev, cateringType: type.id as any }))}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between h-16 ${
                      inputs.cateringType === type.id 
                        ? 'bg-blue-50 border-blue-300 shadow-sm'
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span className={`text-[11px] font-bold leading-tight ${inputs.cateringType === type.id ? 'text-blue-900' : 'text-zinc-700'}`}>
                      {type.label}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-450 mt-0.5">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* If manual custom selection */}
            {inputs.cateringType === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-3 grid-cols-1 sm:grid-cols-2 bg-zinc-50 border border-zinc-150 p-3 rounded-xl"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Число посадок в час (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={inputs.mCustom}
                    onChange={(e) => setInputs(prev => ({ ...prev, mCustom: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs font-mono font-bold rounded-lg border border-zinc-200 px-2.5 py-1.5 focus:border-blue-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Коэф. неравномерности (y)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={inputs.yCustom}
                    onChange={(e) => setInputs(prev => ({ ...prev, yCustom: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs font-mono font-bold rounded-lg border border-zinc-200 px-2.5 py-1.5 focus:border-blue-500 bg-white"
                  />
                </div>
              </motion.div>
            )}

            {/* Hot water consumption rate selector (qu,t) */}
            <div className="space-y-3.5 pt-4 border-t border-zinc-100">
              <label className="text-xs font-bold text-zinc-700 block">Норма расхода горячей воды, q<sub>u,т</sub> (л/условное блюдо)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'dining', label: 'Обеденный зал', desc: '3.4 л / блюдо' },
                  { id: 'takeaway', label: 'Продажа на дом', desc: '2.6 л / блюдо' },
                  { id: 'custom', label: 'Вручную', desc: `${inputs.dishRateCustom} л / блюдо` }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setInputs(prev => ({ ...prev, dishRateType: option.id as any }))}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between h-14 ${
                      inputs.dishRateType === option.id 
                        ? 'bg-blue-50 border-blue-300 shadow-sm'
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span className={`text-[11px] font-bold leading-none ${inputs.dishRateType === option.id ? 'text-blue-900' : 'text-zinc-700'}`}>
                      {option.label}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-450">{option.desc}</span>
                  </button>
                ))}
              </div>

              {inputs.dishRateType === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-xs space-y-1"
                >
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Пользовательский расход горячей воды (л/блюдо)</label>
                  <div className="relative font-mono">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={inputs.dishRateCustom}
                      onChange={(e) => setInputs(prev => ({ ...prev, dishRateCustom: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs font-bold rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-blue-500 outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">л/блюдо</span>
                  </div>
                </motion.div>
              )}
            </div>
          </section>

          {/* Subsection: Pipe Heat losses (Ktp) */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-850 flex items-center gap-1 flex-wrap">
                Определение коэффициента теплопотерь трубопроводов ГВС (К<sub>тп</sub>)
              </label>
              <div className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shrink-0">
                Ктп = {ktp.toFixed(2)}
              </div>
            </div>

            {/* Manual Override checkbox */}
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
                Задать коэффициент вручную (ручной ввод)
              </label>

              {inputs.ktpOverride !== null && (
                <div className="relative w-full sm:w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={inputs.ktpOverride}
                    onChange={(e) => setInputs(prev => ({ ...prev, ktpOverride: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 font-mono text-xs font-medium focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>
              )}
            </div>

            {inputs.ktpOverride === null && (
              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 sm:p-4 space-y-3.5">
                {/* Row 1: Insulated or not */}
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

                {/* Row 2: Towel rails */}
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

                {/* Row 3: External networks after TSC */}
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

        {/* Right Hand: CALCULATION RESULTS DISPLAY */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-4 sm:space-y-6">
          
          {/* Main Gcal Load Output */}
          <div className="rounded-2xl sm:rounded-3xl bg-zinc-950 p-4 sm:p-6 text-white shadow-xl border border-zinc-850 relative overflow-hidden flex flex-col justify-between min-h-[11rem] sm:min-h-[12rem] h-auto transition-all">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 bg-blue-500/15 blur-3xl z-0" />

            <div className="z-10 flex items-center justify-between gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-blue-400 flex items-center gap-1.5 min-w-0 truncate">
                <FlameKindling size={14} className="shrink-0" />
                <span className="truncate">Тепловая нагрузка ГВС (Q<sub>гвс.ср</sub>)</span>
              </span>
              <span className="font-mono text-[10px] bg-zinc-900 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded font-bold shrink-0">
                Uсут = {Math.round(calculations.uSut).toLocaleString()} блюд
              </span>
            </div>

            <div className="z-10 mt-3">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-3xl sm:text-5xl font-semibold tracking-tight text-white font-mono leading-none">
                  {calculations.qGcal.toFixed(6)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-blue-400 uppercase">Гкал/ч</span>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-zinc-850 text-center">
                <div className="space-y-0.5 text-left">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Расход qТ</div>
                  <div className="font-mono text-[11px] sm:text-xs font-semibold text-zinc-150">{calculations.qT.toFixed(3)} м³/ч</div>
                </div>
                <div className="space-y-0.5 text-left pl-1">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Мощность кВт</div>
                  <div className="font-mono text-[11px] sm:text-xs font-semibold text-zinc-150">{Math.round(calculations.qKW).toLocaleString()}</div>
                </div>
                <div className="space-y-0.5 text-left pl-1">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Мощность МВт</div>
                  <div className="font-mono text-[11px] sm:text-xs font-semibold text-zinc-150">{calculations.qMW.toFixed(4)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed step-by-step breakdown */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden divide-y divide-zinc-100">
            <div className="p-4 bg-zinc-50 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList size={14} className="text-zinc-500" />
                <span>Шаги расчетов и формулы</span>
              </span>
            </div>

            {/* Step 1: Ktp */}
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
                  <p>Определяется конструктивными характеристиками системы:</p>
                  <p className="font-mono text-zinc-800 font-bold">Значение Ктп = {ktp}</p>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Параметры: стояки {inputs.ktpMode === 'insulated' ? 'изолированные' : 'неизолированные'}, полотенцесушители: {inputs.ktpTowels === 'with' ? 'есть' : 'нет'}, наружные сети: {inputs.ktpExternal === 'with' ? 'есть' : 'нет'}
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: U_sut compilation */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(2)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 2:</span> Выпуск условных блюд за сутки (U<sub>сут</sub>)
                </span>
                {openSteps[2] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>
              
              {openSteps[2] && (
                <div className="pt-2 text-zinc-650 space-y-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Рассчитывается теоретический суточный выпуск по формуле:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 rounded text-[11px] font-bold text-zinc-800">
                    Uсут = 2.2 · n · m · T · y
                  </div>
                  <p>Где:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li><strong>n</strong> = {calculations.n} (посадочных мест)</li>
                    <li><strong>m</strong> = {calculations.m} (число посадок в час на 1 место)</li>
                    <li><strong>T</strong> = {calculations.T} (время работы в часах за сутки)</li>
                    <li><strong>y</strong> = {calculations.y} (коэффициент неравномерности)</li>
                  </ul>
                  <p>Следовательно:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[11px] rounded leading-relaxed">
                    Uсут = 2.2 · {calculations.n} · {calculations.m} · {calculations.T} · {calculations.y} = <span className="text-blue-600 font-bold">{Math.round(calculations.uSut).toLocaleString()} блюд/сутки</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Flow qT */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(3)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 3:</span> Калькуляция среднечасового расхода q<sub>т</sub> (м³/ч)
                </span>
                {openSteps[3] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>
              
              {openSteps[3] && (
                <div className="pt-2 text-zinc-650 space-y-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Объем водопотребления за сутки в литрах:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[10.5px] rounded">
                    Vсут = Uсут · qu,т = {Math.round(calculations.uSut)} · {quRate} = <span className="font-bold text-zinc-800">{Math.round(calculations.vSutLiters).toLocaleString()} литров/сутки</span>
                  </div>
                  <p>Перевод в среднечасовой расход q<sub>т</sub> (м³/ч) разделением на 24 часа и на 1000 литров:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[10.5px] rounded leading-relaxed">
                    qт = qu,т · Uсут / 24 · 10⁻³<br />
                    qт = {quRate} · {Math.round(calculations.uSut)} / 24 · 0.001 = <span className="text-blue-600 font-extrabold">{calculations.qT.toFixed(4)} м³/ч</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Q_gvs */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(4)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 4:</span> Конечная тепловая нагрузка на ГВС (Q<sub>гвс</sub>)
                </span>
                {openSteps[4] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>
              
              {openSteps[4] && (
                <div className="pt-2 text-zinc-650 space-y-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Вычисляется по формуле теплосъема при нагреве от t<sub>хв</sub> = 5 °C до t<sub>гв</sub> = 65 °C с учетом К<sub>тп</sub>:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[10.5px] rounded leading-loose">
                    Qгвс.ср = qт · (tгв – tхв) · 10⁻³ · (1 + Ктп)<br />
                    Qгвс.ср = {calculations.qT.toFixed(5)} · (65 – 5) · 0.001 · (1 + {ktp})<br />
                    Qгвс.ср = {calculations.qT.toFixed(5)} · 60 · 0.001 · {1 + ktp} = <span className="text-blue-600 font-extrabold">{calculations.qGcal.toFixed(6)} Гкал/ч</span>
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

          {/* User guidance callout */}
          <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-100/80 flex items-start gap-3">
            <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase">Справочная информация</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Расчет по условным блюдам U<sub>сут</sub> в соответствии с числом посадок m и коэффициентом у регламентирует реальное пиковое водопотребление кухонного оборудования и залов ресторанов, кафе и заведений быстрого обслуживания.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
