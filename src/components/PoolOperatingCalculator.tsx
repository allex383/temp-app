import React, { useMemo, useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  ArrowLeft,
  Info,
  Waves,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Circle,
  Square,
  Calculator,
  Binary
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PoolOperatingInputs } from '../types';
import { DEFAULT_POOL_OPERATING_INPUTS } from '../constants';
import { InputField } from './InputField';

interface PoolOperatingCalculatorProps {
  inputs: PoolOperatingInputs;
  setInputs: React.Dispatch<React.SetStateAction<PoolOperatingInputs>>;
  onBack: () => void;
}

export const PoolOperatingCalculator: React.FC<PoolOperatingCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  // State to manage multiple open steps simultaneously
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true, // Step 4 for Vf determination
  });

  // Constants
  const QKP_CONST = 120; // Вт/м²
  const TXV_CONST = 5; // °С
  const C_CONST = 1.163; // Вт/л·°С
  const WASH_NORM_CONST = 7200; // л / м² фильтра

  // Mapping purpose values to temperatures and readable labels
  const purposeMap = {
    preschool: { label: 'Для детей дошкольного возраста', temp: 32 },
    training: { label: 'Для учебных бассейнов', temp: 30 },
    wellness: { label: 'Для оздоровительных бассейнов', temp: 29 },
    sports: { label: 'Для спортивного плавания', temp: 28 },
  };

  const targetTemp = purposeMap[inputs.purpose].temp;

  // 1. Calculate Vf based on shape & count if vfMode is 'calculate'
  const calculatedVfDetails = useMemo(() => {
    const { filterShape, filterDiameter, filterWidth, filterLength, filterCount } = inputs;
    
    let singleFilterArea = 0;
    let formulaDesc = '';
    let calculationDesc = '';

    if (filterShape === 'circle') {
      // Af = 3.14 * D^2 / 4
      singleFilterArea = (3.14 * Math.pow(filterDiameter, 2)) / 4;
      formulaDesc = 'Af = 3.14 · D² / 4';
      calculationDesc = `3.14 · (${filterDiameter} м)² / 4 = ${singleFilterArea.toFixed(4)} м²`;
    } else {
      // Af = a * b
      singleFilterArea = filterWidth * filterLength;
      formulaDesc = 'Af = a · b';
      calculationDesc = `${filterWidth} м · ${filterLength} м = ${singleFilterArea.toFixed(4)} м²`;
    }

    const totalArea = singleFilterArea * filterCount;
    const vfCalculated = WASH_NORM_CONST * totalArea;

    return {
      singleFilterArea,
      totalArea,
      vfCalculated,
      formulaDesc,
      calculationDesc
    };
  }, [inputs.filterShape, inputs.filterDiameter, inputs.filterWidth, inputs.filterLength, inputs.filterCount]);

  // Actual Vf to be used in thermodynamic calculations
  const actualVf = useMemo(() => {
    return inputs.vfMode === 'calculate' ? calculatedVfDetails.vfCalculated : inputs.vf;
  }, [inputs.vfMode, inputs.vf, calculatedVfDetails.vfCalculated]);

  // 2. Main thermodynamic calculations
  const calculation = useMemo(() => {
    const { f, tpr } = inputs;
    
    // Evaporation component: Q_evap = qкп * F
    const qEvap = QKP_CONST * f;
    
    // Filter backwash reheat component: Q_pf = (Vf * (tv - txv) * c) / Tpr
    const hours = tpr || 1;
    const qPf = (actualVf * (targetTemp - TXV_CONST) * C_CONST) / hours;
    
    // Total heat load: Q_tb = Q_evap + Q_pf
    const totalWatts = qEvap + qPf;
    
    // Conversions
    const totalKW = totalWatts / 1000;
    const totalMW = totalWatts / 1000000;
    // 1 W = 0.859845 * 10^-6 Gcal/h
    const totalGcal = totalWatts * 0.859845 * 1e-6;

    return {
      qEvap,
      qPf,
      totalWatts,
      totalKW,
      totalMW,
      totalGcal,
      targetTemp,
      actualVf,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs.f, inputs.tpr, actualVf, targetTemp]);

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_POOL_OPERATING_INPUTS);
    }
  };

  const toggleStep = (stepIndex: number) => {
    setOpenSteps(prev => ({ ...prev, [stepIndex]: !prev[stepIndex] }));
  };

  const handlePurposeChange = (purpose: keyof typeof purposeMap) => {
    setInputs(prev => ({ ...prev, purpose }));
  };

  const handleExport = () => {
    const { f, purpose, tpr, vfMode, filterShape, filterDiameter, filterWidth, filterLength, filterCount } = inputs;
    const activePurpose = purposeMap[purpose];
    
    let filterDetailsText = '';
    if (vfMode === 'calculate') {
      filterDetailsText = `
СПОСОБ ОПРЕДЕЛЕНИЯ ОБЪЕМА ПРОМЫВКИ: Расчет по сечению фильтра
• Форма фильтра: ${filterShape === 'circle' ? 'Круглый' : 'Прямоугольный'}
${filterShape === 'circle' 
  ? `• Диаметр фильтра (D): ${filterDiameter} м` 
  : `• Размеры сторон (a x b): ${filterWidth} м x ${filterLength} м`
}
• Количество фильтров (N): ${filterCount} шт
• Площадь 1 фильтра (Af): ${calculatedVfDetails.singleFilterArea.toFixed(4)} м² (Формула: ${calculatedVfDetails.formulaDesc})
• Суммарная площадь фильтров (Afсумм): ${calculatedVfDetails.totalArea.toFixed(4)} м²
• Норма расхода воды: ${WASH_NORM_CONST} л/м²
• Расчетный объем промывки (Vф): ${actualVf.toFixed(1)} л (Формула: 7200 · Afсумм)
      `;
    } else {
      filterDetailsText = `
СПОСОБ ОПРЕДЕЛЕНИЯ ОБЪЕМА ПРОМЫВКИ: Ручной ввод
• Заданный объем воды (Vф): ${actualVf.toLocaleString()} л
      `;
    }

    const content = `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ В РЕЖИМЕ ЭКСПЛУАТАЦИИ БАССЕЙНА ПОСЛЕ ПРОМЫВКИ ФИЛЬТРОВ
=================================================================================
Дата расчета: ${calculation.timestamp}

1. ИСХОДНЫЕ ДАННЫЕ:
-------------------
• Площадь зеркала воды (F): ${f} м²
• Назначение бассейна: ${activePurpose.label}
• Нормируемая температура воды (tв): ${activePurpose.temp} °C
• Начальная температура воды (tхв): ${TXV_CONST} °C (константа)
• Удельная теплоемкость воды (c): ${C_CONST} Вт/л·°С (константа)
• Удельные теплопотери испарения (qкп): ${QKP_CONST} Вт/м² (константа)
• Время догрева воды после промывки (Tпр): ${tpr} ч
${filterDetailsText.trim()}

2. ПОШАГОВЫЙ РАСЧЕТ И ФОРМУЛЫ:
-------------------------------
Шаг 1: Определение объема воды для промывки (Vф)
  - Vф = ${actualVf.toFixed(1)} л

Шаг 2: Расчет тепловых потерь при испарении (Q_исп)
  - Формула: qкп · F
  - Расчет: ${QKP_CONST} · ${f}
  - Результат: ${calculation.qEvap.toFixed(2)} Вт

Шаг 3: Расчет тепловой мощности после промывки фильтров (Q_пф)
  - Формула: Vф · (tв – tхв) · c / Tпр
  - Расчет: (${actualVf.toFixed(1)} · (${activePurpose.temp} – ${TXV_CONST}) · ${C_CONST}) / ${tpr}
  - Результат: ${calculation.qPf.toFixed(2)} Вт

Шаг 4: Суммарная тепловая нагрузка в режиме эксплуатации (QТб)
  - Формула: QТб = qкп · F + Qпф
  - Расчет в Ваттах: ${calculation.qEvap.toFixed(2)} + ${calculation.qPf.toFixed(2)} = ${calculation.totalWatts.toFixed(2)} Вт

3. СВОДНЫЕ РЕЗУЛЬТАТЫ:
----------------------
• Тепловая нагрузка: ${calculation.totalGcal.toFixed(6)} Гкал/ч
• Тепловая нагрузка: ${calculation.totalWatts.toFixed(0)} Вт
• Тепловая нагрузка: ${calculation.totalKW.toFixed(2)} кВт
• Тепловая нагрузка: ${calculation.totalMW.toFixed(4)} МВт
=================================================================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pool_operating_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation Top Bar */}
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
            <span className="hidden sm:inline">Сбросить всё</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-95"
          >
            <Download size={14} />
            <span>Сохранить расчет</span>
          </button>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="max-w-4xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/50">Технология бассейна</span>
        <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl pt-1">
          Бассейн в режиме эксплуатации после промывки фильтра
        </h1>
        <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
          Теплопотери с зеркала испарения плюс компенсирующий нагрев подпиточной воды, поступающей в бассейн после промывки песчаных фильтров.
        </p>
        <div className="h-1 w-20 rounded-full bg-blue-500" />
      </div>

      {/* Main Container Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-zinc-100 pb-4 flex items-center gap-2">
              <Sliders size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Параметры догрева и очистки</h2>
            </div>

            {/* F input */}
            <InputField 
              label={<span>F — Площадь зеркала воды</span>} 
              id="f" 
              value={inputs.f} 
              onChange={(val) => setInputs(prev => ({ ...prev, f: val }))}
              suffix="м²"
              step="1"
              hint="Площадь свободной поверхности (водного зеркала) бассейна."
            />

            {/* Vf Input block with mode toggle */}
            <div className="space-y-3.5 pt-2 border-t border-zinc-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-700">V<sub>ф</sub> — Объём воды для промывки</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-150 font-mono">
                  {Math.round(actualVf).toLocaleString()} л
                </span>
              </div>

              {/* Toggle Segment Controls */}
              <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, vfMode: 'manual' }))}
                  className={`py-1.5 rounded-md transition-all ${
                    inputs.vfMode === 'manual' 
                      ? 'bg-white text-zinc-900 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Ввести вручную
                </button>
                <button
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, vfMode: 'calculate' }))}
                  className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                    inputs.vfMode === 'calculate' 
                      ? 'bg-white text-zinc-900 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <Calculator size={12} className="text-indigo-500" />
                  Рассчитать по фильтру
                </button>
              </div>

              {/* View 1: Manual Input */}
              {inputs.vfMode === 'manual' ? (
                <div className="animate-fade-in space-y-1">
                  <InputField 
                    label={<span>Ввод объёма фильтрационной воды V<sub>ф</sub></span>} 
                    id="vf" 
                    value={inputs.vf} 
                    onChange={(val) => setInputs(prev => ({ ...prev, vf: Math.max(0, val) }))}
                    suffix="л"
                    step="500"
                    hint="Введите нормируемый кубообъем промывки песчаных фильтров бассейна."
                  />
                  <p className="text-[10px] text-zinc-400 italic pt-1 leading-normal">
                    * Для точного нахождения объёма из геометрических параметров фильтра выберите переключатель «Рассчитать по фильтру».
                  </p>
                </div>
              ) : (
                /* View 2: Calculated from Geometry */
                <div className="animate-fade-in space-y-4 bg-zinc-55/70 p-4 rounded-xl border border-zinc-150">
                  <div className="flex items-center gap-1.5 justify-start text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    <Binary size={13} />
                    <span>Расчетная формула: V<sub>ф</sub> = 7200 · A<sub>fсумм</sub>, л</span>
                  </div>

                  {/* Filter cross section shape select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Форма сечения фильтра:</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setInputs(prev => ({ ...prev, filterShape: 'circle' }))}
                        className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all font-semibold ${
                          inputs.filterShape === 'circle'
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                            : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        <Circle size={12} />
                        Круглый
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputs(prev => ({ ...prev, filterShape: 'rectangle' }))}
                        className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all font-semibold ${
                          inputs.filterShape === 'rectangle'
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                            : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        <Square size={12} />
                        Квадратный
                      </button>
                    </div>
                  </div>

                  {/* Geometry Dimension inputs */}
                  {inputs.filterShape === 'circle' ? (
                    <InputField 
                      label={<span>D — Диаметр одного фильтра</span>} 
                      id="filterDiameter" 
                      value={inputs.filterDiameter} 
                      onChange={(val) => setInputs(prev => ({ ...prev, filterDiameter: Math.max(0.01, val) }))}
                      suffix="м"
                      step="0.05"
                      hint="Диаметр фильтра в самом широком месте для нахождения площади его сечения по формуле: Af = 3.14 · D² / 4."
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <InputField 
                        label={<span>a — Длина стороны</span>} 
                        id="filterWidth" 
                        value={inputs.filterWidth} 
                        onChange={(val) => setInputs(prev => ({ ...prev, filterWidth: Math.max(0.01, val) }))}
                        suffix="м"
                        step="0.05"
                        hint="Длина стороны сечения прямоугольного фильтра."
                      />
                      <InputField 
                        label={<span>b — Ширина стороны</span>} 
                        id="filterLength" 
                        value={inputs.filterLength} 
                        onChange={(val) => setInputs(prev => ({ ...prev, filterLength: Math.max(0.01, val) }))}
                        suffix="м"
                        step="0.05"
                        hint="Ширина стороны сечения прямоугольного фильтра."
                      />
                    </div>
                  )}

                  {/* Count of filters */}
                  <InputField 
                    label={<span>N — Число фильтров в группе</span>} 
                    id="filterCount" 
                    value={inputs.filterCount} 
                    onChange={(val) => setInputs(prev => ({ ...prev, filterCount: Math.max(1, Math.round(val)) }))}
                    suffix="шт"
                    step="1"
                    hint="Количество установленных фильтров одинакового типа для получения суммарной площади их поперечного сечения."
                  />

                  {/* Mini-Report Card of calculated Vf */}
                  <div className="bg-white border border-indigo-100 rounded-lg p-3 space-y-2 text-xs text-zinc-650">
                    <div className="flex justify-between items-center text-[11px] pb-1.5 border-b border-zinc-100">
                      <span className="font-semibold text-zinc-500">Сечение 1 фильтра (A<sub>f</sub>):</span>
                      <span className="font-mono font-bold text-zinc-800">
                        {calculatedVfDetails.singleFilterArea.toFixed(4)} м²
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pb-1.5 border-b border-zinc-100">
                      <span className="font-semibold text-zinc-500">Суммарная площадь (A<sub>fсумм</sub>):</span>
                      <span className="font-mono font-bold text-indigo-700">
                        {calculatedVfDetails.totalArea.toFixed(4)} м²
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-zinc-500">Объем промывки V<sub>ф</sub>:</span>
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        7200 × {calculatedVfDetails.totalArea.toFixed(4)} = {Math.round(calculatedVfDetails.vfCalculated)} л
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tpr input */}
            <div className="pt-2 border-t border-zinc-100">
              <InputField 
                label={<span>T<sub>пр</sub> — Время догрева воды после промывки</span>} 
                id="tpr" 
                value={inputs.tpr} 
                onChange={(val) => setInputs(prev => ({ ...prev, tpr: Math.max(0.1, val) }))}
                suffix="ч"
                step="1"
                hint="Время догрева замещаемой холодной воды до нормативной температуры бассейна."
              />
            </div>
          </section>

          {/* Basin Target Temperature Section */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
            <div className="border-b border-zinc-100 pb-4 flex items-center gap-2">
              <Waves size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Назначение и температурные нормы</h2>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-700">Назначение бассейна:</label>
              
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(purposeMap).map(([key, details]) => {
                  const isSelected = inputs.purpose === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handlePurposeChange(key as any)}
                      className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20' 
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="text-xs font-bold text-zinc-900 leading-tight">{details.label}</div>
                        <div className="text-[10px] text-zinc-400 font-medium font-mono">СНиП норматив</div>
                      </div>
                      <div className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-extrabold ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {details.temp}°C
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Displaying fixed constants of methodology */}
            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-150 space-y-2.5 text-xs text-zinc-650 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200/50">
                <span className="font-semibold text-zinc-500">Потери при испарении (q<sub>кп</sub>):</span>
                <span className="font-mono font-bold text-zinc-800">120 Вт/м²</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200/50">
                <span className="font-semibold text-zinc-500">Начальная темп. подпитки (t<sub>хв</sub>):</span>
                <span className="font-mono font-bold text-zinc-800">+5 °C</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-500">Удельная теплоемкость (c):</span>
                <span className="font-mono font-bold text-zinc-800">1.163 Вт/л·°С</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Calculated dashboard & Calculation steps */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Gcal and Watts Display - Prioritized GCAL per request */}
          <div className="rounded-3xl bg-zinc-950 p-6 text-white shadow-xl border border-zinc-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 bg-indigo-500/10 blur-2xl" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                <Waves size={14} className="text-indigo-400 animate-pulse" />
                Тепловая нагрузка Q<sub>Тб</sub>
              </span>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-400 border border-blue-500/20">
                Режим эксплуатации
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-tight text-white font-mono">
                {calculation.totalGcal.toFixed(6)}
              </span>
              <span className="text-lg font-bold text-zinc-450 uppercase">
                Гкал/ч
              </span>
            </div>

            <p className="mt-2 text-xs text-zinc-450 font-mono">
              Общая нагрузка в ваттах: <span className="font-bold text-zinc-200">
                {Math.round(calculation.totalWatts).toLocaleString()} Вт
              </span>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-6 text-xs text-zinc-450 text-left">
              <div>
                <p className="font-bold text-zinc-500 uppercase tracking-wider">Мощность в киловаттах</p>
                <p className="font-mono text-base font-bold text-white mt-1">
                  {calculation.totalKW.toFixed(2)} <span className="text-[10px] font-medium text-zinc-450">кВт</span>
                </p>
              </div>
              <div>
                <p className="font-bold text-zinc-500 uppercase tracking-wider">Мощность в мегаваттах</p>
                <p className="font-mono text-base font-bold text-white mt-1">
                  {calculation.totalMW.toFixed(5)} <span className="text-[10px] font-medium text-zinc-450">МВт</span>
                </p>
              </div>
            </div>
          </div>

          {/* Detailed step breakdown (independently toggleable - explicitly asked for step breakdown here) */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" />
                Пошаговая методика расчета нагрузки
              </h3>
              <span className="text-[10px] text-zinc-400">Нажмите для сворачивания</span>
            </div>

            {/* Formula display */}
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-150 text-center">
              <div className="font-mono text-xs sm:text-sm font-semibold text-zinc-800">
                Q<sub>Тб</sub> = (q<sub>кп</sub> · F) + Q<sub>пф</sub>, Вт
              </div>
              <div className="font-mono text-[11px] text-zinc-450 mt-1">
                Где Q<sub>пф</sub> = [V<sub>ф</sub> · (t<sub>в</sub> – t<sub>хв</sub>) · c] / T<sub>пр</sub>
              </div>
            </div>

            {/* Step 1: Vf calculation step if calculate is chosen */}
            <div className="border border-zinc-150 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(4)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
                id="op-step-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">Шаг 1. Определение объёма промывки (V_ф)</span>
                  <p className="font-bold text-xs text-zinc-900">
                    Норма расхода воды {WASH_NORM_CONST} л/м² на фильтрационную площадь
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-800 text-xs">
                    {Math.round(actualVf).toLocaleString()} литров
                  </span>
                  {openSteps[4] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <AnimatePresence>
                {openSteps[4] && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white border-t border-zinc-100"
                  >
                    <div className="p-4 text-xs text-zinc-650 space-y-2.5">
                      {inputs.vfMode === 'manual' ? (
                        <div>
                          <p>Выбран ручной ввод данных. Заданный расход воды для промывки песчаной засыпки фильтров:</p>
                          <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] leading-relaxed">
                            V<sub>ф</sub> = <span className="font-bold text-zinc-900">{inputs.vf.toLocaleString()} л</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p>Рассчитаем суммарную площадь фильтровальной группы А<sub>fсумм</sub> и соответствующий объём воды:</p>
                          <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] leading-relaxed space-y-1.5">
                            <div>
                              1. Сечение одного фильтра (форма сечения {inputs.filterShape === 'circle' ? 'круг' : 'прямоугольник/квадрат'}): <br />
                              <span className="text-zinc-500 font-bold">{calculatedVfDetails.formulaDesc}</span> <br />
                              <span className="text-indigo-600 font-bold">A<sub>f</sub> = {calculatedVfDetails.calculationDesc}</span>
                            </div>
                            <div className="pt-1.5 border-t border-zinc-200/60">
                              2. Суммарная площадь при N = {inputs.filterCount} шт (А<sub>fсумм</sub>): <br />
                              A<sub>fсумм</sub> = A<sub>f</sub> · N <br />
                              A<sub>fсумм</sub> = {calculatedVfDetails.singleFilterArea.toFixed(4)} м² · {inputs.filterCount} = <span className="font-bold text-indigo-700">{calculatedVfDetails.totalArea.toFixed(4)} м²</span>
                            </div>
                            <div className="pt-1.5 border-t border-zinc-200/60 font-medium">
                              3. Расход промывочной воды: <br />
                              V<sub>ф</sub> = {WASH_NORM_CONST} · А<sub>fсумм</sub> <br />
                              V<sub>ф</sub> = 7200 · {calculatedVfDetails.totalArea.toFixed(4)} = <span className="font-bold text-emerald-600">{Math.round(calculatedVfDetails.vfCalculated).toLocaleString()} л</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 2: Evaporation load */}
            <div className="border border-zinc-150 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(1)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
                id="op-step-1"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Шаг 2. Теплопотери с поверхности (Q_исп)</span>
                  <p className="font-bold text-xs text-zinc-900">
                    Испарение с площади {inputs.f} м² зеркала бассейна
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-800 text-xs">
                    {calculation.qEvap >= 1000 
                      ? `${(calculation.qEvap / 1000).toFixed(2)} кВт` 
                      : `${calculation.qEvap.toFixed(0)} Вт`
                    }
                  </span>
                  {openSteps[1] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              
              <AnimatePresence>
                {openSteps[1] && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white border-t border-zinc-100"
                  >
                    <div className="p-4 text-xs text-zinc-650 space-y-2">
                      <p>Тепловые потери испарения с зеркала воды закрытых ванн:</p>
                      <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] leading-relaxed">
                        Q<sub>исп</sub> = q<sub>кп</sub> · F <br />
                        Q<sub>исп</sub> = 120 Вт/м² · {inputs.f} м² = <span className="font-bold text-zinc-900">{calculation.qEvap.toFixed(1)} Вт</span> ({(calculation.qEvap / 1000).toFixed(3)} кВт)
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 3: filter backwash reheat */}
            <div className="border border-zinc-150 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(2)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
                id="op-step-2"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">Шаг 3. Мощность на догрев (Q_пф)</span>
                  <p className="font-bold text-xs text-zinc-900">
                    Нагрев {Math.round(actualVf).toLocaleString()} л подпиточной воды за {inputs.tpr} ч
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-800 text-xs">
                    {calculation.qPf >= 1000 
                      ? `${(calculation.qPf / 1000).toFixed(2)} кВт` 
                      : `${calculation.qPf.toFixed(0)} Вт`
                    }
                  </span>
                  {openSteps[2] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              
              <AnimatePresence>
                {openSteps[2] && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white border-t border-zinc-100"
                  >
                    <div className="p-4 text-xs text-zinc-650 space-y-2">
                      <p>Тепловой напор для быстрого компенсирующего догрева воды, сбрасываемой при промывке фильтрационной системы:</p>
                      <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] leading-relaxed">
                        Q<sub>пф</sub> = [V<sub>ф</sub> · (t<sub>в</sub> – t<sub>хв</sub>) · c] / T<sub>пр</sub> <br /><br />
                        <span className="text-zinc-450">Подставим параметры:</span> <br />
                        - V<sub>ф</sub> = {Math.round(actualVf).toLocaleString()} л <br />
                        - t<sub>в</sub> = {targetTemp}°C (нормируемая бассейна) <br />
                        - t<sub>хв</sub> = {TXV_CONST}°C (холодная подпиточная) <br />
                        - c = {C_CONST} Вт/л·°С <br />
                        - T<sub>пр</sub> = {inputs.tpr} ч <br /><br />
                        Q<sub>пф</sub> = [{Math.round(actualVf)} · ({targetTemp} – {TXV_CONST}) · {C_CONST}] / {inputs.tpr} <br />
                        Q<sub>пф</sub> = <span className="font-bold text-zinc-900">{calculation.qPf.toFixed(1)} Вт</span> ({(calculation.qPf / 1000).toFixed(3)} кВт)
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 4: Total Sum Calculation */}
            <div className="border border-zinc-150 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(3)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
                id="op-step-3"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">Шаг 4. Итоговая суммарная нагрузка (Q_Тб)</span>
                  <p className="font-bold text-xs text-zinc-900">
                    Сложение потерь на испарение и догрева подпитки
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-950 text-xs text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {calculation.totalGcal.toFixed(6)} Гкал/ч
                  </span>
                  {openSteps[3] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              
              <AnimatePresence>
                {openSteps[3] && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white border-t border-zinc-100"
                  >
                    <div className="p-4 text-xs text-zinc-650 space-y-2">
                      <p>Вычисляем совокупную часовую нагрузку теплосети в режиме фильтрационной регенерации бассейна:</p>
                      <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] leading-relaxed font-sans">
                        Q<sub>Тб</sub> = Q<sub>исп</sub> + Q<sub>пф</sub> <br />
                        Q<sub>Тб</sub> = {calculation.qEvap.toFixed(1)} + {calculation.qPf.toFixed(1)} = <span className="font-bold text-zinc-900">{calculation.totalWatts.toFixed(1)} Вт</span> <br /><br />
                        
                        <span className="text-zinc-500 font-extrabold font-sans">Перевод в Гкал/ч:</span> <br />
                        Q<sub>Гкал/ч</sub> = {calculation.totalWatts.toFixed(1)} · 0.859845 · 10⁻⁶ = <span className="font-bold text-indigo-700">{calculation.totalGcal.toFixed(6)} Гкал/ч</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>


          {/* Quick FAQ summary */}
          <section className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/50 text-xs text-zinc-500 flex items-start gap-2.5">
            <Info size={16} className="text-zinc-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Справка:</strong> Время догрева воды после промывки (T<sub>пр</sub>) обычно выбирается от 2 до 8 часов. Снижая время догрева за счет фильтров, мы увеличиваем пиковую тепловую производительность теплообменников, но возвращаем бассейн в норму в разы быстрее.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
