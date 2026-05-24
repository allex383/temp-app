import React, { useMemo, useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  ArrowLeft,
  Info,
  Sliders,
  Sparkles,
  Flame,
  Search,
  Check,
  X,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FloorHeatingInputs } from '../types';
import { DEFAULT_FLOOR_HEATING_INPUTS } from '../constants';
import { InputField } from './InputField';
import { TI_DATA } from '../q0Data';

interface HeatingFloorCalculatorProps {
  inputs: FloorHeatingInputs;
  setInputs: React.Dispatch<React.SetStateAction<FloorHeatingInputs>>;
  onBack: () => void;
}

export const HeatingFloorCalculator: React.FC<HeatingFloorCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  // Modal state for ti selection
  const [isTiModalOpen, setIsTiModalOpen] = useState(false);
  const [tiSearchQuery, setTiSearchQuery] = useState('');

  // Preset configuration for tn (floor temperature)
  const presets = [
    { 
      id: 'permanent', 
      label: 'Постоянное пребывание людей', 
      tempText: '29 °C',
      description: 'Для жилых комнат, игровых, спален в детских садах, палат больниц и т.д.'
    },
    { 
      id: 'preschool', 
      label: 'Здания дошкольных организаций', 
      tempText: '23 °C',
      description: 'Для групповых ячеек, раздевальных комнат в ДДУ.'
    },
    { 
      id: 'temporary', 
      label: 'Временное пребывание людей', 
      tempText: '31 °C',
      description: 'Для вестибюлей, холлов, коридоров, санузлов, раздевалок бассейна и т.д.'
    },
    { 
      id: 'pool-walkway', 
      label: 'Обходные дорожки бассейнов', 
      tempText: 't_вн + 2 °C (не более 35 °C)',
      description: 'На 2°C выше температуры внутреннего воздуха бассейна, ограничено значением 35°C.'
    },
    { 
      id: 'manual', 
      label: 'Произвольная температура', 
      tempText: 'Вручную',
      description: 'Самостоятельно задаваемое значение температуры теплого пола.'
    }
  ];

  // Resolve target tn value based on mode
  const resolvedTn = useMemo(() => {
    switch (inputs.tnMode) {
      case 'permanent':
        return 29;
      case 'preschool':
        return 23;
      case 'temporary':
        return 31;
      case 'pool-walkway':
        return Math.min(inputs.ti + 2, 35);
      case 'manual':
      default:
        return inputs.tnCustom;
    }
  }, [inputs.tnMode, inputs.tnCustom, inputs.ti]);

  // Main calculation: Q т.п = an * (tn - ti) * Sт.п
  const calculations = useMemo(() => {
    const { an, ti, sn } = inputs;
    
    // Calculate difference (tn - ti)
    const tempDiff = resolvedTn - ti;
    
    // Formula calculation in Watts
    // If floor temp is lower than or equal to air temp, heat output is technically 0 or negative.
    // We let it calculate normally but show a user warning/tip if negative.
    const qFloor = an * tempDiff * sn;
    
    // Unit conversions
    const totalKW = qFloor / 1000;
    const totalMW = qFloor / 1e6;
    const totalGcal = qFloor * 0.859845 * 1e-6;

    return {
      tn: resolvedTn,
      tempDiff,
      qFloor,
      totalKW,
      totalMW,
      totalGcal,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs.an, inputs.ti, inputs.sn, resolvedTn]);

  const handleReset = () => {
    if (confirm('Сбросить данные расчета теплого пола до значений по умолчанию?')) {
      setInputs(DEFAULT_FLOOR_HEATING_INPUTS);
    }
  };

  const handlePresetSelect = (mode: FloorHeatingInputs['tnMode']) => {
    setInputs(prev => {
      const next = { ...prev, tnMode: mode };
      if (mode === 'permanent') next.tnCustom = 29;
      if (mode === 'preschool') next.tnCustom = 23;
      if (mode === 'temporary') next.tnCustom = 31;
      if (mode === 'pool-walkway') next.tnCustom = Math.min(prev.ti + 2, 35);
      return next;
    });
  };

  const filteredTiData = useMemo(() => {
    if (!tiSearchQuery) return TI_DATA;
    const query = tiSearchQuery.toLowerCase();
    return TI_DATA.filter(item => 
      item.roomType.toLowerCase().includes(query) || 
      (item.note && item.note.toLowerCase().includes(query))
    );
  }, [tiSearchQuery]);

  const handleExport = () => {
    const presetLabel = presets.find(p => p.id === inputs.tnMode)?.label || 'Вручную';
    const content = `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ НА ТЕХНОЛОГИЧЕСКИЙ ТЕПЛЫЙ ПОЛ
=================================================================================
Дата расчета: ${calculations.timestamp}

1. ИСХОДНЫЕ ДАННЫЕ:
-------------------
• Площадь теплого пола (Sт.п): ${inputs.sn} м²
• Режим температуры пола (tn): ${presetLabel}
• Расчетная температура теплого пола (tn): ${calculations.tn} °C
• Расчетная температура воздуха в помещении (ti): ${inputs.ti} °C
• Коэффициент теплоотдачи поверхности (an): ${inputs.an} Вт/(м²·°C)

2. ФОРМУЛА И РАСЧЕТ:
-------------------------------------------
• Формула: Qт.п = an · (tn – ti) · Sт.п, Вт
• Выражение: ${inputs.an} · (${calculations.tn} – ${inputs.ti}) · ${inputs.sn}
• Разность температур (tn – ti): ${calculations.tempDiff.toFixed(1)} °C
• Результат Qт.п: ${Math.round(calculations.qFloor).toLocaleString()} Вт

3. ЭКВИВАЛЕНТНЫЕ ЗНАЧЕНИЯ МОЩНОСТИ:
-------------------------------------------
• Мощность в кВт: ${calculations.totalKW.toFixed(3)} кВт
• Мощность в МВт: ${calculations.totalMW.toFixed(6)} МВт
• Мощность в Гкал/ч: ${calculations.totalGcal.toFixed(6)} Гкал/ч

=================================================================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `underfloor_heating_report_${new Date().toISOString().split('T')[0]}.txt`;
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
            <span>Сохранить отчет</span>
          </button>
        </div>
      </div>

      {/* Title Banner */}
      <div className="max-w-4xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50">
          Технологии подогрева
        </span>
        <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl pt-1">
          Расчет технологического теплого пола помещения
        </h1>
        <p className="text-sm text-zinc-500 max-w-3xl leading-relaxed">
          Тепловая нагрузка на теплый пол рассчитывается на поддержание заданного температурного напора поверхности относительно внутреннего воздуха в помещении.
        </p>
        <div className="h-1 w-20 rounded-full bg-emerald-600" />
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Side: INPUTS */}
        <div className="lg:col-span-6 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4 flex items-center gap-2">
              <Sliders size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                Исходные параметры
              </h2>
            </div>

            {/* Area Sn Input */}
            <InputField 
              label={<span>S<sub>т.п</sub> — Площадь теплого пола</span>} 
              id="sn" 
              value={inputs.sn} 
              onChange={(val) => setInputs(prev => ({ ...prev, sn: Math.max(0.1, val) }))}
              suffix="м²"
              step="1"
              hint="Общая расчетная обогреваемая площадь контуров теплого пола."
            />

            {/* Interior air temp ti with custom select from table modal */}
            <InputField 
              label={<span>t<sub>i</sub> — Температура воздуха в помещении</span>} 
              id="ti" 
              value={inputs.ti} 
              onChange={(val) => setInputs(prev => ({ ...prev, ti: val }))}
              suffix="°C"
              step="1"
              hint="Расчетная внутренняя температура в проектируемом помещении согласно нормам СП или СанПиН."
              action={
                <button
                  type="button"
                  onClick={() => setIsTiModalOpen(true)}
                  className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  title="Выбрать t_вн для справочника"
                >
                  <BookOpen size={14} />
                </button>
              }
            />

            {/* Coefficient an input */}
            <InputField 
              label={<span>a<sub>n</sub> — Коэффициент теплоотдачи поверхности</span>} 
              id="an" 
              value={inputs.an} 
              onChange={(val) => setInputs(prev => ({ ...prev, an: Math.max(0.1, val) }))}
              suffix="Вт/(м²·°C)"
              step="0.5"
              hint="Нормативный коэффициент теплоотдачи поверхности теплого пола. Принимается по СП равным 10 Вт/(м²·°C)."
            />
          </section>

          {/* Floor Temperature Presets (tn) */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-2 flex items-center gap-2">
              <Flame size={18} className="text-zinc-400" />
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                  Температура теплого пола (t<sub>n</sub>)
                </h2>
                <p className="text-[10px] text-zinc-400">Выберите тип обогреваемого помещения</p>
              </div>
            </div>

            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id as any)}
                  className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                    inputs.tnMode === preset.id 
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-500/10' 
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="text-xs font-bold text-zinc-900 leading-tight flex items-center gap-1.5">
                      {inputs.tnMode === preset.id && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      {preset.label}
                    </div>
                    <div className="text-[10px] text-zinc-405 leading-relaxed">
                      {preset.description}
                    </div>
                  </div>
                  <div className={`rounded-lg px-2 py-1 font-mono text-xs font-extrabold transition-all border shrink-0 ${
                    inputs.tnMode === preset.id ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                  }`}>
                    {preset.id === 'pool-walkway' ? `${Math.min(inputs.ti + 2, 35)} °C` : preset.tempText}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Input for tn if mode is manual */}
            <AnimatePresence>
              {inputs.tnMode === 'manual' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-2 border-t border-zinc-150"
                >
                  <InputField 
                    label={<span>Фиксированная температура t<sub>n</sub></span>}
                    id="tnCustom" 
                    value={inputs.tnCustom} 
                    onChange={(val) => setInputs(prev => ({ ...prev, tnCustom: val }))}
                    suffix="°C"
                    step="0.5"
                    hint="Установите расчетную температуру поверхности пола вручную."
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Right Side: RESULTS & STATS */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Output Card */}
          <div className="rounded-3xl bg-zinc-950 p-6 text-white shadow-xl border border-zinc-850 relative overflow-hidden flex flex-col justify-between min-h-[12rem] h-auto transition-all">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 bg-emerald-500/15 blur-3xl z-0" />

            <div className="z-10 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-1.5">
                <Flame size={12} className="text-emerald-400" />
                Теплопроизводительность Q<sub>т.п</sub>
              </span>
              {calculations.tempDiff <= 0 && (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-semibold text-red-400 border border-red-500/30">
                  tn ≤ ti (нет нагрева)
                </span>
              )}
            </div>

            <div className="z-10 mt-3">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-white font-mono leading-none">
                  {calculations.totalGcal.toFixed(6)}
                </span>
                <span className="text-sm font-bold text-emerald-400 uppercase">Гкал/ч</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-zinc-850 text-center">
                <div className="space-y-0.5 text-left pl-1">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Вт</div>
                  <div className="font-mono text-xs font-semibold text-zinc-150">{Math.round(calculations.qFloor).toLocaleString()}</div>
                </div>
                <div className="space-y-0.5 text-left pl-1">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">кВт</div>
                  <div className="font-mono text-xs font-semibold text-zinc-150">{calculations.totalKW.toFixed(3)}</div>
                </div>
                <div className="space-y-0.5 text-left pl-1">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">МВт</div>
                  <div className="font-mono text-xs font-semibold text-zinc-150">{calculations.totalMW.toFixed(6)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Formula Breakdown Panel */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-500" />
                Формула и вычисления
              </h3>
            </div>

            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/60 border border-zinc-200/50 rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-2">
              <div className="font-mono text-sm tracking-tight text-zinc-500">Основная формула расчета:</div>
              <div className="font-sans font-extrabold text-zinc-900 text-lg leading-snug">
                Q<sub>т.п</sub> = a<sub>n</sub> · (t<sub>n</sub> – t<sub>i</sub>) · S<sub>т.п</sub>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs text-zinc-650 leading-relaxed">
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 pb-2">
                <span className="text-zinc-450">Коэффициент a<sub>n</sub>:</span>
                <span className="font-bold text-zinc-800">{inputs.an} Вт/(м²·°C)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 pb-2">
                <span className="text-zinc-455">Температура пола t<sub>n</sub>:</span>
                <span className="font-bold text-zinc-800">{calculations.tn} °C</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 pb-2">
                <span className="text-zinc-455">Температура воздуха t<sub>i</sub>:</span>
                <span className="font-bold text-zinc-800">{inputs.ti} °C</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 pb-2">
                <span className="text-zinc-455">Разность напора (t<sub>n</sub> – t<sub>i</sub>):</span>
                <span className={`font-bold ${calculations.tempDiff > 0 ? 'text-zinc-800' : 'text-red-500'}`}>{calculations.tempDiff.toFixed(1)} °C</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 pb-2">
                <span className="text-zinc-455">Площадь пола S<sub>т.п</sub>:</span>
                <span className="font-bold text-zinc-800">{inputs.sn} м²</span>
              </div>
              <div className="pt-3 font-semibold text-zinc-900 border-t border-dashed border-zinc-200">
                <span>Подстановка:</span>
                <div className="bg-zinc-50 p-3 rounded-lg text-emerald-700 font-bold block mt-1.5 whitespace-normal leading-normal">
                  Q = {inputs.an} × ({calculations.tn} – {inputs.ti}) × {inputs.sn} = <span className="underline">{Math.round(calculations.qFloor).toLocaleString()} Вт</span>
                </div>
              </div>
            </div>

            {calculations.tempDiff <= 0 && (
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-xs text-red-700 leading-normal">
                ⚠️ <strong>Внимание:</strong> Температура теплого пола меньше или равна температуре воздуха в помещении. В этом режиме теплый пол не имеет тепловыделения в помещение (теплоотдача отсутствует). По правилам нагревательный кабель/трубка будут отключены термостатом.
              </div>
            )}
          </section>

          {/* Quick FAQ summary info */}
          <section className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/50 text-xs text-zinc-500 flex items-start gap-2.5">
            <div className="space-y-1">
              <span className="font-bold text-zinc-700">Нормы проектирования</span>
              <p className="leading-relaxed">
                Максимальные и средние допустимые уровни температуры поверхности пола ограничиваются санитарными правилами во избежание перегрева стопы человека и венозного застоя. Ограничение температуры обходных дорожек бассейнов (не выше 35°C) обеспечивает комфорт посетителей босиком.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* standard modal for ti list selection selection */}
      <AnimatePresence>
        {isTiModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" id="ti-picker-modal">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTiModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            />

            {/* Content Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-full max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl z-10"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white">
                    <BookOpen size={16} />
                  </div>
                  <h2 className="text-md font-bold text-zinc-900 tracking-tight">Справочник норм температур tᵢ</h2>
                </div>
                <button
                  onClick={() => setIsTiModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search input inside modal */}
              <div className="border-b border-zinc-100 p-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={tiSearchQuery}
                    onChange={(e) => setTiSearchQuery(e.target.value)}
                    placeholder="Поиск типа помещения..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              {/* List body */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                {filteredTiData.length > 0 ? (
                  filteredTiData.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputs(prev => {
                          const next = { ...prev, ti: item.value };
                          if (prev.tnMode === 'pool-walkway') {
                            next.tnCustom = Math.min(item.value + 2, 35);
                          }
                          return next;
                        });
                        setIsTiModalOpen(false);
                      }}
                      className="w-full text-left p-4 hover:bg-zinc-50 flex items-center justify-between transition-colors group"
                      id={`ti-row-${idx}`}
                    >
                      <div className="space-y-1 pr-6">
                        <div className="text-xs font-bold text-zinc-800 leading-tight group-hover:text-zinc-950 transition-colors">
                          {item.roomType}
                        </div>
                        {item.note && (
                          <div className="text-[10px] text-zinc-400">
                            {item.note}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold border transition-colors ${
                          inputs.ti === item.value 
                            ? 'bg-zinc-900 border-zinc-900 text-white' 
                            : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                        }`}>
                          {item.value}°C
                        </span>
                        {inputs.ti === item.value && (
                          <Check size={16} className="text-emerald-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    Ничего не найдено по вашему запросу
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
