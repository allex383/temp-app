import React, { useMemo, useState } from 'react';
import { 
  ArrowLeft,
  Info,
  Sliders,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Droplets,
  ClipboardList,
  FlameKindling
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GvsPointsInputs, GvsPoint } from '../types';
import { DEFAULT_GVS_POINTS_INPUTS } from '../constants';
import { GVS_POINTS_CATEGORIES, GvsPointCategory } from '../gvsPointsData';

interface GvsPointsCalculatorProps {
  inputs: GvsPointsInputs;
  setInputs: React.Dispatch<React.SetStateAction<GvsPointsInputs>>;
  onBack: () => void;
}

export const GvsPointsCalculator: React.FC<GvsPointsCalculatorProps> = ({
  inputs = DEFAULT_GVS_POINTS_INPUTS,
  setInputs,
  onBack
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true
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

  // Process points list with rates & subtotals (a_i * N_i)
  const processedPoints = useMemo(() => {
    return inputs.points.map(pt => {
      const category = GVS_POINTS_CATEGORIES.find(c => c.id === pt.typeId);
      const rate = category?.rate || 0;
      const subtotal = rate * pt.count;

      return {
        ...pt,
        category,
        rate,
        subtotal
      };
    });
  }, [inputs.points]);

  // Complete calculations matching the Gcal & flow requirements
  const calculations = useMemo(() => {
    // 1. Total Liters per Hour: Sum(a * N)
    const sumHourlyLiters = processedPoints.reduce((sum, pt) => sum + pt.subtotal, 0);
    
    // 2. Hot water average flow qT in m3/h: Sum(a * N) / 1000
    const qT = sumHourlyLiters / 1000;

    // 3. Temp difference: dt = tgv - txv = 65 - 5 = 60
    const tgv = inputs.tgv || 65;
    const txv = inputs.txv || 5;
    const dt = Math.max(0, tgv - txv);

    // 4. Calculations: Q_gvs = qT * dt * 10^-3 * (1 + Ktp)
    const qGcal = qT * dt * 0.001 * (1 + ktp);

    // Alternative units conversions
    const qMW = qGcal * 1.163;
    const qKW = qMW * 1000;

    return {
      sumHourlyLiters,
      qT,
      dt,
      tgv,
      txv,
      qGcal,
      qMW,
      qKW
    };
  }, [processedPoints, inputs.tgv, inputs.txv, ktp]);

  const handleAddPoint = (category: GvsPointCategory) => {
    const existing = inputs.points.find(p => p.typeId === category.id);
    if (existing) {
      // Increment count
      setInputs(prev => ({
        ...prev,
        points: prev.points.map(p => p.typeId === category.id ? { ...p, count: p.count + 1 } : p)
      }));
    } else {
      // Add new point Row
      const newPoint: GvsPoint = {
        id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        typeId: category.id,
        count: 5
      };
      setInputs(prev => ({
        ...prev,
        points: [...prev.points, newPoint]
      }));
    }
  };

  const handleUpdateCount = (id: string, count: number) => {
    const validCount = Math.max(1, count || 1);
    setInputs(prev => ({
      ...prev,
      points: prev.points.map(p => p.id === id ? { ...p, count: validCount } : p)
    }));
  };

  const handleRemovePoint = (id: string) => {
    setInputs(prev => ({
      ...prev,
      points: prev.points.filter(p => p.id !== id)
    }));
  };

  const toggleStep = (stepNumber: number) => {
    setOpenSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  // Filter category search option
  const filteredCategories = useMemo(() => {
    return GVS_POINTS_CATEGORIES.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Report text compiler
  const compileReportString = () => {
    const itemsReport = processedPoints.map((item, idx) => {
      const catName = item.category?.name || 'Неизвестный прибор';
      return `  ${idx + 1}. ${catName}:
     - Количество приборов (N): ${item.count} шт.
     - Часовой расход прибора (a): ${item.rate} л/ч
     - Произведение (a × N): ${item.subtotal} л/ч`;
    }).join('\n\n');

    const tgv = calculations.tgv;
    const txv = calculations.txv;

    return `ОТЧЕТ О РАСЧЕТЕ ТЕПЛОВОЙ НАГРУЗКИ ГВС ПО ВОДОРАЗБОРНЫМ ТОЧКАМ
--------------------------------------------------------------------------
1. Исходные параметры системы:
   - Температура горячей воды (tгв): ${tgv} °C
   - Температура холодной воды (tхв): ${txv} °C
   - Расчетная разность температур (tгв - tхв): ${calculations.dt} °C
   - Коэффициент теплопотерь трубопроводов (Ктп): ${ktp}
     (Выбранные параметры: стояки ${inputs.ktpMode === 'insulated' ? 'изолированные' : 'неизолированные'}, полотенцесушители: ${inputs.ktpTowels === 'with' ? 'есть' : 'нет'}, наружные сети: ${inputs.ktpExternal === 'with' ? 'есть' : 'нет'})

2. Санитарно-технические приборы (точки водоразбора):
${itemsReport || '   Точки водоразбора не добавлены.'}

--------------------------------------------------------------------------
Суммарный часовой расход по всем точкам:
   ∑(a × N) = ${calculations.sumHourlyLiters.toLocaleString()} л/ч

Среднечасовой расход горячего водоснабжения:
   q_T = ∑(a × N) / 1000 = ${calculations.qT.toFixed(4)} м³/ч

Итоговая тепловая нагрузка на ГВС (Qгвс):
   Qгвс = q_T × (tгв – tхв) × 10⁻³ × (1 + Ктп)
   Qгвс = ${calculations.qT.toFixed(4)} × ${calculations.dt} × 0.001 × ${1 + ktp} = ${calculations.qGcal.toFixed(6)} Гкал/ч

Эквевалентная тепловая мощность:
   Мощность в кВт: ${Math.round(calculations.qKW).toLocaleString()} кВт
   Мощность в МВт: ${calculations.qMW.toFixed(4)} МВт
--------------------------------------------------------------------------
Расчет выполнен в HeatLoad Pro по утвержденной методике.`;
  };

  const handleCopyReport = () => {
    const text = compileReportString();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const text = compileReportString();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gvs_points_report_${Date.now()}.txt`;
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
          <Droplets size={24} className="text-blue-500 animate-pulse" />
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            ГВС по санитарно-техническим приборам
          </h1>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
          Определяет среднечасовую тепловую нагрузку горячего водоснабжения на основании удельных расходов теплой воды и общего числа водоразборных точек (умывальников, раковин, ванн, душей и т.д.) по формуле: <code className="font-mono text-zinc-700 font-bold bg-zinc-100 px-1 py-0.5 rounded text-[11px]">Qгвс = a · N · (tгв – tхв)/1000 · (1 + Ктп)</code>.
        </p>
      </div>

      {/* Calculator Columns Layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Input Settings */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Temperatures & Ktp parameters */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
            <div className="border-b border-zinc-100 pb-3 sm:pb-4 flex items-center gap-2">
              <Sliders size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                1. Параметры системы ГВС
              </h2>
            </div>

            {/* Locked Temperatures according to the methodology standard */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 flex flex-wrap items-center gap-1">
                  <span>t<sub>гв</sub> (Горячая вода)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">(константа)</span>
                </label>
                <div className="relative font-mono">
                  <input
                    type="number"
                    value={calculations.tgv}
                    disabled
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500 px-3 py-2 font-mono text-sm font-semibold outline-none pr-8 cursor-not-allowed"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-450">°C</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-none">65 °C в водоразборных точках</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 flex flex-wrap items-center gap-1">
                  <span>t<sub>хв</sub> (Холодная вода)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">(константа)</span>
                </label>
                <div className="relative font-mono">
                  <input
                    type="number"
                    value={calculations.txv}
                    disabled
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500 px-3 py-2 font-mono text-sm font-semibold outline-none pr-8 cursor-not-allowed"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-450">°C</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-none">5 °C в холодный период</p>
              </div>
            </div>

            {/* Coefficient Ktp selection block (Shared layout with general GvsCalculator) */}
            <div className="space-y-3.5 pt-3 border-t border-zinc-100">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
                <label className="text-xs font-bold text-zinc-750 flex items-center gap-1 flex-wrap">
                  Определение коэффициента теплопотерь трубопроводов ГВС (К<sub>тп</sub>)
                </label>
                <div className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 self-start sm:self-auto shrink-0">
                  Ктп = {ktp.toFixed(2)}
                </div>
              </div>

              {/* Custom Override Option */}
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
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 sm:px-2 sm:py-1 font-mono text-xs font-medium focus:border-blue-500 focus:bg-white outline-none"
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
            </div>
          </section>

          {/* Section 2: Water Points and Fixtures manager */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
            <div className="border-b border-zinc-100 pb-3 sm:pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                  2. Водоразборные точки (N)
                </h2>
              </div>
              <span className="text-xs text-zinc-500 font-semibold bg-zinc-100 px-2.5 py-1 rounded-full shrink-0 font-mono">
                Итого видов: {inputs.points.length}
              </span>
            </div>

            {/* List of currently added fixtures */}
            <div className="space-y-3">
              {inputs.points.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-10 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50"
                >
                  <Droplets className="mx-auto text-zinc-300 mb-2 h-8 w-8" />
                  <p className="text-xs font-bold text-zinc-700">Водоразборные приборы еще не выбраны</p>
                  <p className="text-xs text-zinc-400 mt-1">Добавьте хотя бы одно устройство из каталога ниже.</p>
                </motion.div>
              ) : (
                <div className="divide-y divide-zinc-100 border border-zinc-150 rounded-2xl overflow-hidden bg-white">
                  {processedPoints.map((point) => (
                    <div 
                      key={point.id}
                      className="p-3 sm:p-4 hover:bg-zinc-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                            {point.rate} л/ч
                          </span>
                          <span className="text-xs font-bold text-zinc-800 line-clamp-1">
                            {point.category?.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          N × a = {point.count} шт. × {point.rate} л/ч = <span className="font-bold text-zinc-750">{point.subtotal.toLocaleString()} л/ч</span>
                        </p>
                      </div>

                      {/* Quantity input & Delete tools */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-zinc-400 uppercase">Кол-во:</span>
                          <div className="relative font-mono w-20">
                            <input
                              type="number"
                              min="1"
                              value={point.count}
                              onChange={(e) => handleUpdateCount(point.id, parseInt(e.target.value))}
                              className="w-full text-center rounded-lg border border-zinc-200 px-2 py-1 font-mono text-xs font-bold text-zinc-800 focus:border-blue-500 bg-zinc-50/50"
                            />
                            <span className="absolute right-1 text-[9px] text-zinc-400 top-1/2 -translate-y-1/2 pointer-events-none">шт</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePoint(point.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Удалить из списка"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Calculation sum subtotal bar */}
                  <div className="p-3 sm:p-4 bg-zinc-50 border-t border-zinc-150 flex items-center justify-between font-mono text-xs text-zinc-600">
                    <span className="font-bold font-sans">Суммарный водоразбор ∑(a · N):</span>
                    <span className="text-zinc-900 font-extrabold text-sm">{calculations.sumHourlyLiters.toLocaleString()} л/ч</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick adding catalog */}
            <div className="space-y-3 pt-3 border-t border-zinc-100">
              <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                Каталог санитарно-технических приборов (кликните для добавления)
              </label>

              {/* Instant Search Bar */}
              <div className="relative h-10 w-full mb-2">
                <input
                  type="text"
                  placeholder="Быстрый поиск прибора по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs h-full rounded-xl border border-zinc-200 pl-3 pr-8 focus:border-blue-500 outline-none placeholder-zinc-400"
                />
              </div>

              {/* Categorized points clickers list */}
              <div className="grid gap-2 max-h-[14rem] overflow-y-auto pr-1">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleAddPoint(cat)}
                    className="flex items-center justify-between text-left p-2 rounded-xl border border-zinc-150 hover:bg-blue-50/40 hover:border-blue-200 transition-all font-sans group active:scale-99"
                  >
                    <span className="text-xs font-semibold text-zinc-700 truncate mr-2 group-hover:text-blue-900">
                      {cat.name}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50/50 border border-blue-100/50 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                      {cat.rate} л/ч
                      <Plus size={12} className="text-blue-500 shrink-0" />
                    </span>
                  </button>
                ))}
                {filteredCategories.length === 0 && (
                  <p className="text-center text-xs text-zinc-400 py-4">Ничего не найдено</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Calculations Outputs */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          
          {/* Output Gcal Card (First place on requested menu) */}
          <div className="rounded-2xl sm:rounded-3xl bg-zinc-950 p-4 sm:p-6 text-white shadow-xl border border-zinc-850 relative overflow-hidden flex flex-col justify-between min-h-[11rem] sm:min-h-[12rem] h-auto transition-all">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 bg-blue-500/15 blur-3xl z-0" />

            <div className="z-10 flex items-center justify-between gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-blue-400 flex items-center gap-1.5 min-w-0 truncate">
                <FlameKindling size={14} className="shrink-0" />
                <span className="truncate">Тепловая нагрузка ГВС (Q<sub>гвс</sub>)</span>
              </span>
              <span className="font-mono text-[10px] bg-zinc-900 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded font-bold shrink-0">
                ∑(a·N) = {calculations.sumHourlyLiters} л/ч
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

          {/* Mathematical Step-by-Step Details Accordion */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden divide-y divide-zinc-100">
            <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                Шаги расчетов и формулы
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
                  <span>Шаг 1:</span> Коэффициент потерь тепла К<sub>тп</sub>
                </span>
                {openSteps[1] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>
              
              {openSteps[1] && (
                <div className="pt-2 text-zinc-650 space-y-2 font-sans bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Определяется на основе изоляции стояков, наличия полотенцесушителей и структуры наружных сетей горячего водоснабжения (по Таблице методики):</p>
                  <p className="font-mono text-zinc-850 font-bold">Выбранное значение Ктп = {ktp}</p>
                  <p className="text-[10px] text-zinc-500">
                    Параметры: стояки {inputs.ktpMode === 'insulated' ? 'изолированные' : 'неизолированные'}, полотенцесушители: {inputs.ktpTowels === 'with' ? 'есть' : 'нет'}, внешние теплосети: {inputs.ktpExternal === 'with' ? 'есть' : 'нет'}
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Sum(a * N) */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(2)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 2:</span> Суммарный водоразбор ∑(a · N) и расход qТ
                </span>
                {openSteps[2] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>

              {openSteps[2] && (
                <div className="pt-2 text-zinc-650 space-y-2 font-sans bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Часовой расход воды и произведение на количество санитарно-технических приборов суммируются:</p>
                  
                  {processedPoints.length === 0 ? (
                    <p className="text-red-500 font-bold">Точки разбора не добавлены</p>
                  ) : (
                    <div className="space-y-1.5 font-mono text-[10.5px] text-zinc-800 bg-white p-2 border border-zinc-150 rounded leading-relaxed">
                      {processedPoints.map((item, index) => (
                        <div key={item.id} className="flex justify-between border-b border-zinc-100/80 pb-0.5 last:border-0">
                          <span className="truncate">{item.category?.name}</span>
                          <span className="shrink-0 pl-2 font-bold">{item.rate} л/ч × {item.count} шт = {item.subtotal} л/ч</span>
                        </div>
                      ))}
                      <div className="pt-1.5 font-sans font-bold text-xs text-blue-700 flex justify-between">
                        <span>Сумма ∑(a·N)</span>
                        <span>{calculations.sumHourlyLiters} л/ч</span>
                      </div>
                    </div>
                  )}

                  <p className="pt-1">Перевод в среднечасовой расход qТ (м³/ч):</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[10.5px] rounded">
                    qТ = (∑ a · N) / 1000 = {calculations.sumHourlyLiters} / 1000 = <span className="text-blue-600 font-bold">{calculations.qT.toFixed(4)} м³/ч</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Total Load */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(3)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 3:</span> Расчет тепловой нагрузки Qгвс
                </span>
                {openSteps[3] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>

              {openSteps[3] && (
                <div className="pt-2 text-zinc-650 space-y-2 font-sans bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Находится по утвержденной формуле с учетом тепловых потерь К<sub>тп</sub>:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[10.5px] rounded leading-loose">
                    Qгвс = qТ · (tгв – tхв) · 10⁻³ · (1 + Ктп)<br />
                    Qгвс = {calculations.qT.toFixed(5)} · ({calculations.tgv} – {calculations.txv}) · 0.001 · (1 + {ktp})<br />
                    Qгвс = {calculations.qT.toFixed(5)} · {calculations.dt} · 0.001 · {1 + ktp} = <span className="text-blue-600 font-extrabold">{calculations.qGcal.toFixed(6)} Гкал/ч</span>
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

          {/* Quick info note */}
          <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-100/80 flex items-start gap-3">
            <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase">Справочная информация</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                По методике расчет нагрузок по водоразборным точкам является наиболее точным для определения нагрузки существующих систем в жилых, муниципальных и коммерческих зданиях. Константы t<sub>гв</sub> = 65 °C и  t<sub>хв</sub> = 5 °C заданы строго по регламенту.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
