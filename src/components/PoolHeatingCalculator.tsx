import React, { useMemo, useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  ArrowLeft,
  Info,
  Waves,
  Sliders,
  Copy,
  Check,
  User,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PoolHeatingInputs } from '../types';
import { DEFAULT_POOL_HEATING_INPUTS } from '../constants';
import { InputField } from './InputField';

interface PoolHeatingCalculatorProps {
  inputs: PoolHeatingInputs;
  setInputs: React.Dispatch<React.SetStateAction<PoolHeatingInputs>>;
  onBack: () => void;
}

export const PoolHeatingCalculator: React.FC<PoolHeatingCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  const [copied, setCopied] = useState(false);

  // Metadata states for report
  const [compilerName, setCompilerName] = useState(() => {
    return localStorage.getItem('heatload_metadata_compiler_name') || '';
  });
  const [compilerPosition, setCompilerPosition] = useState(() => {
    return localStorage.getItem('heatload_metadata_compiler_position') || '';
  });
  const [objectAddress, setObjectAddress] = useState(() => {
    return localStorage.getItem('heatload_metadata_object_address') || '';
  });
  const [isSimpleConsumer, setIsSimpleConsumer] = useState(() => {
    return localStorage.getItem('heatload_metadata_is_simple_consumer') === 'true';
  });

  const handleCompilerNameChange = (val: string) => {
    setCompilerName(val);
    localStorage.setItem('heatload_metadata_compiler_name', val);
  };

  const handleCompilerPositionChange = (val: string) => {
    setCompilerPosition(val);
    localStorage.setItem('heatload_metadata_compiler_position', val);
  };

  const handleObjectAddressChange = (val: string) => {
    setObjectAddress(val);
    localStorage.setItem('heatload_metadata_object_address', val);
  };

  const handleIsSimpleConsumerChange = (val: boolean) => {
    setIsSimpleConsumer(val);
    localStorage.setItem('heatload_metadata_is_simple_consumer', String(val));
  };
  // Constants
  const C_CONST = 1.163; // Вт/л·°С
  const TXVS_CONST = 5; // °С
  const T_HOURS_CONST = 24; // ч
  const QKP_CONST = 120; // Вт/м²

  // Mapping purpose values to temperatures and readable labels
  const purposeMap = {
    preschool: { label: 'Для детей дошкольного возраста', temp: 32 },
    training: { label: 'Для учебных бассейнов', temp: 30 },
    wellness: { label: 'Для оздоровительных бассейнов', temp: 29 },
    sports: { label: 'Для спортивного плавания', temp: 28 },
  };

  const targetTemp = purposeMap[inputs.purpose].temp;

  const calculation = useMemo(() => {
    const { vbas, f } = inputs;
    
    // Water heating component in Watts: Q_water = (Vbas * c * (tv - txvs)) / T
    const qWater = (vbas * C_CONST * (targetTemp - TXVS_CONST)) / T_HOURS_CONST;
    
    // Evaporation loss component in Watts: Q_evap = qкп * F
    const qEvap = QKP_CONST * f;
    
    // Total Watts
    const totalWatts = qWater + qEvap;
    
    // Convering unit conversions
    const totalKW = totalWatts / 1000;
    const totalMW = totalWatts / 1000000;
    // 1 W = 0.859845 * 10^-6 Gcal/h
    const totalGcal = totalWatts * 0.859845 * 1e-6;

    return {
      qWater,
      qEvap,
      totalWatts,
      totalKW,
      totalMW,
      totalGcal,
      targetTemp,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs, targetTemp]);

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_POOL_HEATING_INPUTS);
    }
  };

  const handlePurposeChange = (purpose: keyof typeof purposeMap) => {
    setInputs(prev => ({ ...prev, purpose }));
  };

  const generateReportText = () => {
    const { vbas, f, purpose } = inputs;
    const activePurpose = purposeMap[purpose];
    const userRoleText = isSimpleConsumer 
      ? 'Потребитель' 
      : `Сотрудник: ${compilerName || 'Не указан'}\nДолжность: ${compilerPosition || 'Не указана'}`;
    const addressText = objectAddress || 'Не указан';

    return `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ НА ПЕРВОНАЧАЛЬНЫЙ НАГРЕВ ВОДЫ В БАССЕЙНЕ
================================================================
Дата расчета: ${calculation.timestamp}
Адрес объекта: ${addressText}
Исполнитель: ${userRoleText}

================================================================
1. ИСХОДНЫЕ ДАННЫЕ:
-------------------
• Объем воды в ванне бассейна (Vбас): ${vbas.toLocaleString()} л
• Площадь зеркала воды (F): ${f} м²
• Назначение бассейна: ${activePurpose.label}
• Температура воды в чаше бассейна (tв): ${activePurpose.temp} °C
• Начальная температура воды (tхвс): ${TXVS_CONST} °C (константа)
• Удельная теплоемкость воды (c): ${C_CONST} Вт/л·°С (константа)
• Время первоначального нагрева (T): ${T_HOURS_CONST} ч (константа)
• Тепловые потери с зеркала воды (qкп): ${QKP_CONST} Вт/м² (константа)

2. ПОШАГОВЫЙ РАСЧЕТ И ФОРМУЛЫ:
-------------------------------
Шаг 1: Расчет расхода тепла на подогрев воды (Q_нагрев)
  - Формула: (Vбас · c · (tв – tхвс)) / T
  - Расчет: (${vbas} · ${C_CONST} · (${activePurpose.temp} – ${TXVS_CONST})) / ${T_HOURS_CONST}
  - Результат: ${calculation.qWater.toFixed(2)} Вт

Шаг 2: Расчет тепловых потерь с зеркала воды (Q_потери)
  - Формула: qкп · F
  - Расчет: ${QKP_CONST} · ${f}
  - Результат: ${calculation.qEvap.toFixed(2)} Вт

Шаг 3: Общая тепловая нагрузка на первоначальный нагрев (Qнб)
  - Формула: Qнб = Q_нагрев + Q_потери
  - Расчет в Ваттах: ${calculation.qWater.toFixed(2)} + ${calculation.qEvap.toFixed(2)} = ${calculation.totalWatts.toFixed(2)} Вт

3. СВОДНЫЕ РЕЗУЛЬТАТЫ:
----------------------
• Тепловая нагрузка: ${calculation.totalWatts.toFixed(0)} Вт
• Тепловая нагрузка: ${calculation.totalKW.toFixed(2)} кВт
• Тепловая нагрузка: ${calculation.totalMW.toFixed(4)} МВт
• Тепловая нагрузка: ${calculation.totalGcal.toFixed(6)} Гкал/ч
================================================================
    `.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([generateReportText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pool_heating_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Navigation Top Bar */}
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
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <RefreshCw size={13} />
            <span>Сброс</span>
          </button>
          <button
            onClick={handleCopy}
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
            onClick={handleExport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 hover:bg-blue-100 font-semibold text-xs active:scale-98 transition-all"
          >
            <Download size={13} />
            <span>Скачать отчет</span>
          </button>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="max-w-4xl space-y-2">
        <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl">
          Первоначальный нагрев закрытого рециркуляционного бассейна
        </h1>
        <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
          Расчет тепловой нагрузки на разовый первоначальный подогрев воды в чаше крытого бассейна рециркуляционного типа с учетом неизбежной теплоотдачи испарением с зеркала воды.
        </p>
        <div className="h-1 w-20 rounded-full bg-blue-500" />
      </div>

      {/* Main Container Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          {/* Metadata Section */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <User size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Информация о расчете</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <input 
                  type="checkbox" 
                  id="isSimpleConsumer"
                  checked={isSimpleConsumer}
                  onChange={(e) => handleIsSimpleConsumerChange(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-350 text-zinc-900 focus:ring-zinc-900 focus:ring-offset-0 cursor-pointer accent-zinc-900"
                />
                <label htmlFor="isSimpleConsumer" className="flex-1 text-xs font-semibold text-zinc-700 select-none cursor-pointer">
                  Потребитель
                </label>
              </div>

              <AnimatePresence initial={false}>
                {!isSimpleConsumer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 sm:grid-cols-2 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <label htmlFor="compilerName" className="text-xs font-semibold tracking-wider text-zinc-500">
                        ФИО сотрудника
                      </label>
                      <input
                        id="compilerName"
                        type="text"
                        value={compilerName}
                        onChange={(e) => handleCompilerNameChange(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="compilerPosition" className="text-xs font-semibold tracking-wider text-zinc-500">
                        Должность
                      </label>
                      <input
                        id="compilerPosition"
                        type="text"
                        value={compilerPosition}
                        onChange={(e) => handleCompilerPositionChange(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label htmlFor="objectAddress" className="text-xs font-semibold tracking-wider text-zinc-500">
                  Адрес объекта
                </label>
                <div className="relative">
                  <input
                    id="objectAddress"
                    type="text"
                    value={objectAddress}
                    onChange={(e) => handleObjectAddressChange(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 pl-9 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4 flex items-center gap-2">
              <Sliders size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Геометрия и объемы</h2>
            </div>

            <InputField 
              label={<span>V<sub>бас</sub> — Объем бассейна</span>} 
              id="vbas" 
              value={inputs.vbas} 
              onChange={(val) => setInputs(prev => ({ ...prev, vbas: val }))}
              suffix="л"
              step="1000"
              hint="Объем воды в ванне бассейна. 1 м³ равен 1000 литров."
            />

            <InputField 
              label={<span>F — Площадь зеркала воды</span>} 
              id="f" 
              value={inputs.f} 
              onChange={(val) => setInputs(prev => ({ ...prev, f: val }))}
              suffix="м²"
              step="1"
              hint="Площадь свободной поверхности воды в чаше бассейна."
            />
          </section>

          {/* Basin Target Temperature Section */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
            <div className="border-b border-zinc-100 pb-4 flex items-center gap-2">
              <Waves size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Назначение и температура воды</h2>
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
                        <div className="text-[10px] text-zinc-400 font-medium">СНиП норматив</div>
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
            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-150 space-y-2.5 text-xs text-zinc-600">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200/50">
                <span className="font-semibold text-zinc-500">Начальная темп. HOB (t<sub>хвс</sub>):</span>
                <span className="font-mono font-bold text-zinc-800">+5 °C</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200/50">
                <span className="font-semibold text-zinc-500">Удельная теплоемкость (c):</span>
                <span className="font-mono font-bold text-zinc-800">1.163 Вт/л·°С</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200/50">
                <span className="font-semibold text-zinc-500">Время нагрева воды (T):</span>
                <span className="font-mono font-bold text-zinc-800">24 ч</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-500">Испарение зеркала (q<sub>кп</sub>):</span>
                <span className="font-mono font-bold text-zinc-800">120 Вт/м²</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Calculated dashboard & Calculation stages */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Watts and Gcal Display */}
          <div className="rounded-3xl bg-zinc-950 p-6 text-white shadow-xl border border-zinc-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 bg-indigo-500/10 blur-2xl" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                <Waves size={14} className="text-indigo-400" />
                Тепловая нагрузка на бассейн Q<sub>нб</sub>
              </span>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-400 border border-indigo-500/20">
                Рециркуляционный
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-tight text-white">
                {calculation.totalGcal.toFixed(6)}
              </span>
              <span className="text-lg font-bold text-zinc-450 uppercase">
                Гкал/ч
              </span>
            </div>

            <p className="mt-1 text-xs text-zinc-400 font-mono">
              Или в основных ваттах: <span className="font-bold text-zinc-200">
                {Math.round(calculation.totalWatts).toLocaleString()} Вт
              </span>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-6 text-xs text-zinc-450">
              <div>
                <p className="font-bold text-zinc-500 uppercase tracking-wider">Мощность в киловаттах</p>
                <p className="font-mono text-base font-bold text-white mt-1">
                  {calculation.totalKW.toFixed(2)} <span className="text-[10px] font-medium text-zinc-400">кВт</span>
                </p>
              </div>
              <div>
                <p className="font-bold text-zinc-500 uppercase tracking-wider">Мощность в мегаваттах</p>
                <p className="font-mono text-base font-bold text-white mt-1">
                  {calculation.totalMW.toFixed(5)} <span className="text-[10px] font-medium text-zinc-400">МВт</span>
                </p>
              </div>
            </div>
          </div>

          {/* Detailed single formula and calculations section */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-6">
            <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Расчетная формула СНиП 2.08.02-89*
              </h3>
            </div>

            {/* Typography formula card */}
            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/60 border border-zinc-200/60 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3">
              <div className="font-sans font-medium text-zinc-800 text-lg sm:text-xl leading-normal tracking-wide py-2">
                Q<sub>нб</sub> = <span className="inline-block border-b border-zinc-400 pb-0.5 px-1.5">V<sub>бас</sub> · c · (t<sub>в</sub> – t<sub>хвс</sub>)</span> / T + (q<sub>кп</sub> · F)
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-md">
                Расход тепла на нагрев объема воды за время <span className="font-semibold text-zinc-700">T</span> в сложении с тепловыми потерями испарения с площади зеркала <span className="font-semibold text-zinc-700">F</span>.
              </p>
            </div>

            {/* Values replacement step-by-step substitution display */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Текущая подстановка значений в формулу:</h4>
              
              <div className="font-mono text-xs bg-zinc-900 rounded-xl p-4 text-zinc-300 leading-relaxed space-y-3">
                <div className="text-zinc-500">// 1. Тепла на разогрев кубатуры воды за 24 ч (Q_вод)</div>
                <div className="flex flex-wrap items-baseline gap-1.5 pl-3 border-l-2 border-indigo-500/50">
                  <span>Q<sub>вод</sub> = </span>
                  <span className="text-zinc-450">({inputs.vbas.toLocaleString()} л · {C_CONST} · ({targetTemp}°C – {TXVS_CONST}°C)) / {T_HOURS_CONST} ч =</span>
                  <span className="text-indigo-300 font-bold">{Math.round(calculation.qWater).toLocaleString()} Вт</span>
                </div>
                
                <div className="text-zinc-500 mt-2">// 2. Потери тепла при испарении (Q_исп)</div>
                <div className="flex flex-wrap items-baseline gap-1.5 pl-3 border-l-2 border-amber-500/50">
                  <span>Q<sub>исп</sub> = </span>
                  <span className="text-zinc-450">{QKP_CONST} Вт/м² · {inputs.f} м² =</span>
                  <span className="text-amber-300 font-bold">{Math.round(calculation.qEvap).toLocaleString()} Вт</span>
                </div>

                <div className="h-px bg-zinc-800 my-2" />

                <div className="text-zinc-350 font-sans font-bold flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm pt-1">
                  <span>Q<sub>нб</sub> = Q<sub>вод</sub> + Q<sub>исп</sub></span>
                  <span className="text-emerald-400 font-mono text-base font-extrabold">
                    {Math.round(calculation.totalWatts).toLocaleString()} Вт
                    <span className="text-xs text-zinc-400 font-medium ml-1">({(calculation.totalWatts / 1000).toFixed(2)} кВт)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Balance Progress comparison */}
            <div className="space-y-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-150">
              <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex justify-between">
                <span>Баланс тепловых потоков:</span>
                <span className="font-mono text-zinc-400">100%</span>
              </h5>
              
              {(() => {
                const total = calculation.totalWatts || 1;
                const waterPct = (calculation.qWater / total) * 100;
                const evapPct = (calculation.qEvap / total) * 100;
                return (
                  <div className="space-y-3">
                    <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${waterPct}%` }}
                        className="bg-indigo-500 h-full transition-all duration-500 ease-out"
                        title={`Подогрев воды: ${waterPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${evapPct}%` }}
                        className="bg-amber-500 h-full transition-all duration-500 ease-out"
                        title={`Испарение / потери: ${evapPct.toFixed(1)}%`}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                        <span className="text-zinc-500">Нагрев воды:</span>
                        <span className="font-mono font-bold text-zinc-800">{Math.round(calculation.qWater).toLocaleString()} Вт</span>
                        <span className="text-zinc-450 font-mono">({waterPct.toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-zinc-500">Испарение с зеркала:</span>
                        <span className="font-mono font-bold text-zinc-800">{Math.round(calculation.qEvap).toLocaleString()} Вт</span>
                        <span className="text-zinc-450 font-mono">({evapPct.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Quick FAQ summary */}
          <section className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/50 text-xs text-zinc-500 flex items-start gap-2.5">
            <Info size={16} className="text-zinc-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Справочно:</strong> Данная методика основана на СНиП 2.08.02-89* и ведомственных нормах проектирования бассейнов. Т = 24 часа — оптимальный период нагрева, минимизирующий перепады и теплопотери. Принятый коэффициент q<sub>кп</sub> учитывает постоянное испарение с поверхности воды зеркала при температуре воздуха на 2°C выше температуры бассейна.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
