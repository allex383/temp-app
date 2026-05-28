import React, { useMemo, useState } from 'react';
import { 
  ArrowLeft,
  Info,
  Sliders,
  ChevronDown,
  ChevronUp,
  Flame,
  HelpCircle,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Calculator,
  Droplets,
  ClipboardList,
  FlameKindling,
  User,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GvsInputs, GvsConsumer } from '../types';
import { DEFAULT_GVS_INPUTS } from '../constants';
import { GVS_CATEGORIES, GvsConsumerCategory } from '../gvsData';

interface GvsCalculatorProps {
  inputs: GvsInputs;
  setInputs: React.Dispatch<React.SetStateAction<GvsInputs>>;
  onBack: () => void;
}

export const GvsCalculator: React.FC<GvsCalculatorProps> = ({
  inputs = DEFAULT_GVS_INPUTS,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });

  // Calculate coefficient Ktp
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

  // Helper parameters for public catering calculations
  const getCateringParams = (type?: string) => {
    switch (type) {
      case 'students':
        return { m: 3, y: 0.45, label: 'Студенческие столовые' };
      case 'industry':
        return { m: 3, y: 0.45, label: 'Столовые при промпредприятиях' };
      case 'restaurant':
        return { m: 1.5, y: 0.55, label: 'Рестораны' };
      case 'other':
        return { m: 2, y: 1.0, label: 'Другие типы (буфеты и др., без варки)' };
      case 'canteen':
      default:
        return { m: 2, y: 0.45, label: 'Столовые открытого типа и кафе' };
    }
  };

  // Process consumers and their visual stats
  const processedConsumers = useMemo(() => {
    return inputs.consumers.map(consumer => {
      const category = GVS_CATEGORIES.find(c => c.id === consumer.typeId);
      let calculatedCount = consumer.count;

      let formulaString = '';
      if (category?.allowCateringHelper && consumer.isCateringHelper) {
        const seats = consumer.cateringSeats || 0;
        const type = consumer.cateringType || 'canteen';
        const hours = consumer.cateringHours || 0;
        const params = getCateringParams(type);
        
        // Catering dish formulae:
        // U = 2.2 * n * m * T * y
        const dishes = 2.2 * seats * params.m * hours * params.y;
        calculatedCount = Math.round(dishes);
        formulaString = `2.2 × ${seats} (пос. мест) × ${params.m} (m) × ${hours} (ч) × ${params.y} (y) = ${calculatedCount} блюд`;
      }

      const qRate = category?.rate || 0;
      const totalDailyVolume = qRate * calculatedCount; // liters/day

      return {
        ...consumer,
        category,
        calculatedCount,
        totalDailyVolume,
        formulaString,
        rate: qRate,
      };
    });
  }, [inputs.consumers]);

  // Total calculations
  const calculations = useMemo(() => {
    // 1. Total Daily Hot Water Volume, Litres
    const totalDailyVolumeLiters = processedConsumers.reduce((sum, item) => sum + item.totalDailyVolume, 0);
    const totalDailyVolumeM3 = totalDailyVolumeLiters / 1000;

    // 2. Average Hourly water flow, qT (m3/h)
    // qT = V_day / (1000 * T)
    const T_hours = inputs.T || 24;
    const qT = totalDailyVolumeLiters / (1000 * T_hours);

    // 3. Q_gvs_cp = qT * (t_gv - t_xv) * 10^-3 * (1 + K_tp)
    // tgv default 65, txv default 5
    const dt = Math.max(0, (inputs.tgv || 65) - (inputs.txv || 5));
    const qGcal = qT * dt * 0.001 * (1 + ktp);

    // Conversions
    const qMW = qGcal * 1.163;
    const qKW = qMW * 1000;

    return {
      totalDailyVolumeLiters,
      totalDailyVolumeM3,
      qT,
      dt,
      qGcal,
      qMW,
      qKW,
      T_hours,
    };
  }, [processedConsumers, inputs.tgv, inputs.txv, inputs.T, ktp]);

  // Filter categories available to be added
  const filteredCategoriesToAdd = useMemo(() => {
    return GVS_CATEGORIES.filter(cat => {
      const matchSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cat.group.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGroup = selectedGroupFilter === 'all' || cat.group === selectedGroupFilter;
      return matchSearch && matchGroup;
    });
  }, [searchQuery, selectedGroupFilter]);

  // Unique groups for filtering categories
  const categoryGroups = useMemo(() => {
    const groups = new Set<string>();
    GVS_CATEGORIES.forEach(cat => groups.add(cat.group));
    return Array.from(groups);
  }, []);

  const handleAddConsumer = (category: GvsConsumerCategory) => {
    const isCatering = !!category.allowCateringHelper;
    const newConsumer: GvsConsumer = {
      id: `consumer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      typeId: category.id,
      count: 100, // default count
      isCateringHelper: isCatering,
      cateringSeats: isCatering ? 50 : undefined,
      cateringType: isCatering ? 'canteen' : undefined,
      cateringHours: isCatering ? 8 : undefined,
      cateringRate: isCatering ? 'dining' : undefined,
    };

    setInputs(prev => ({
      ...prev,
      consumers: [...prev.consumers, newConsumer]
    }));
  };

  const handleRemoveConsumer = (id: string) => {
    setInputs(prev => ({
      ...prev,
      consumers: prev.consumers.filter(c => c.id !== id)
    }));
  };

  const handleUpdateConsumer = (id: string, updates: Partial<GvsConsumer>) => {
    setInputs(prev => ({
      ...prev,
      consumers: prev.consumers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const toggleStep = (stepNumber: number) => {
    setOpenSteps(prev => ({ ...prev, stepNumber: !prev[stepNumber] }));
  };

  // Copy and download text report
  const generateReportText = () => {
    const T_hours = calculations.T_hours;
    const itemsReport = processedConsumers.map((item, index) => {
      const name = item.category?.name || 'Потребитель';
      const unit = item.category?.unit || 'ед.';
      const desc = item.isCateringHelper 
        ? `\n   Расчет блюд (U_сут): ${item.formulaString}`
        : '';
      return `${index + 1}. ${name}
   Количество (Ui): ${item.calculatedCount} ${unit}.${desc}
   Норма расхода (qi,u,m): ${item.rate} л/сут
   Суточный расход группы: ${item.totalDailyVolume.toLocaleString()} л/сутки (${(item.totalDailyVolume / 1000).toFixed(3)} м³/сутки)`;
    }).join('\n\n');

    const userRoleText = isSimpleConsumer 
      ? 'Потребитель' 
      : `Сотрудник: ${compilerName || 'Не указан'}\nДолжность: ${compilerPosition || 'Не указана'}`;
    const addressText = objectAddress || 'Не указан';

    return `ОТЧЕТ О РАСЧЕТЕ ТЕПЛОВОЙ НАГРУЗКИ СИСТЕМЫ ГОРЯЧЕГО ВОДОСНАБЖЕНИЯ (ГВС)
=========================================================================
Дата расчета: ${new Date().toLocaleString()}
Адрес объекта: ${addressText}
Исполнитель: ${userRoleText}

=========================================================================
1. Исходные параметры системы:
   - Температура горячей воды (tгв): ${inputs.tgv} °C
   - Температура холодной воды (tхв): ${inputs.txv} °C
   - Расчетная разность температур (Δt): ${calculations.dt} °C
   - Период водопотребления (T): ${T_hours} ч
   - Коэффициент теплопотерь трубопроводов (Ктп): ${ktp}
     (Выбранные параметры: стояки ${inputs.ktpMode === 'insulated' ? 'изолированные' : 'неизолированные'}, полотенцесушители: ${inputs.ktpTowels === 'with' ? 'есть' : 'нет'}, наружные сети: ${inputs.ktpExternal === 'with' ? 'есть' : 'нет'})

2. Водопотребители и расходы воды:
${itemsReport || '   Водопотребители не добавлены.'}

-------------------------------------------------------------------------
Суммарный суточный расход горячей воды для всех категорий:
   V_сут = ${calculations.totalDailyVolumeLiters.toLocaleString()} л/сутки (${calculations.totalDailyVolumeM3.toFixed(3)} м³/сутки)

Средний часовой расход горячей воды:
   q_T = V_сут / (1000 * T) = ${calculations.qT.toFixed(4)} м³/ч

3. Расчет тепловой нагрузки на ГВС:
   Qгвс_ср = qТ · (tгв – tхв) · 10^-3 · (1 + Ктп)
   Qгвс_ср = ${calculations.qT.toFixed(4)} · ${calculations.dt} · 0.001 · (1 + ${ktp}) = ${calculations.qGcal.toFixed(6)} Гкал/ч

Эквивалентная тепловая мощность:
   - ${calculations.qKW.toFixed(3)} кВт
   - ${calculations.qMW.toFixed(6)} МВт
-------------------------------------------------------------------------
Расчет выполнен по нормативной методике тепловых нагрузок ГВС`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([generateReportText()], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = "Расчет_ГВС_Отчет.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

      {/* Header and Back Button */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <Droplets size={24} className="text-blue-500" />
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Тепловая нагрузка на систему ГВС
          </h1>
        </div>
        <p className="text-sm text-zinc-500 max-w-3xl leading-relaxed">
          Расчет среднечасовой тепловой нагрузки горячего водоснабжения зданий с учетом конкретной специфики и количества различных групп водопотребителей.
        </p>
        <div className="h-1 w-20 rounded-full bg-blue-500" />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Hand: INPUTS & SETTINGS */}
        <div className="lg:col-span-7 space-y-6">
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
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 pl-9 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 1: System Config */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
            <div className="border-b border-zinc-100 pb-3 sm:pb-4 flex items-center gap-2">
              <Sliders size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                1. Общие параметры системы ГВС
              </h2>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              {/* tgv Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 flex flex-wrap items-center gap-1">
                  <span>t<sub>гв</sub> (Горячая вода)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">(65°C по умолч.)</span>
                </label>
                <div className="relative font-mono">
                  <input
                    type="number"
                    value={inputs.tgv}
                    onChange={(e) => setInputs(prev => ({ ...prev, tgv: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3/5 py-2 sm:px-3.5 sm:py-2.5 font-mono text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all pr-8"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">°C</span>
                </div>
              </div>

              {/* txv Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 flex flex-wrap items-center gap-1">
                  <span>t<sub>хв</sub> (Холодная вода)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">(5°C по умолч.)</span>
                </label>
                <div className="relative font-mono">
                  <input
                    type="number"
                    value={inputs.txv}
                    onChange={(e) => setInputs(prev => ({ ...prev, txv: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3/5 py-2 sm:px-3.5 sm:py-2.5 font-mono text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all pr-8"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">°C</span>
                </div>
              </div>

              {/* T operating hours Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 flex flex-wrap items-center gap-1">
                  <span>Период ГВС (T)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">(смена в часах)</span>
                </label>
                <div className="relative font-mono">
                  <input
                    type="number"
                    value={inputs.T}
                    onChange={(e) => setInputs(prev => ({ ...prev, T: Math.min(24, Math.max(1, parseFloat(e.target.value) || 24)) }))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3/5 py-2 sm:px-3.5 sm:py-2.5 font-mono text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all pr-8"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">ч</span>
                </div>
              </div>
            </div>

            {/* Coefficient Ktp selection block */}
            <div className="space-y-3.5 pt-3 border-t border-zinc-100">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1 flex-wrap">
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
                        Есть наружные сети (после ЦТП)
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
                        Без наружных сетей
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Water Consumers list */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
            <div className="border-b border-zinc-100 pb-3 sm:pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                  2. Список водопотребителей (Ui)
                </h2>
              </div>
              <span className="text-xs text-zinc-500 font-semibold bg-zinc-100 px-2.5 py-1 rounded-full shrink-0">
                Добавлено: {inputs.consumers.length}
              </span>
            </div>

            {/* List of active consumers */}
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {inputs.consumers.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-dashed border-zinc-200 p-8 text-center"
                  >
                    <Droplets size={28} className="text-zinc-300 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500 font-medium">Нет добавленных водопотребителей</p>
                    <p className="text-xs text-zinc-400 mt-1">Добавьте категории потребителей из панели ниже для начала расчета.</p>
                  </motion.div>
                ) : (
                  processedConsumers.map((consumer) => {
                    const typeId = consumer.typeId;
                    const cat = consumer.category;
                    const isCatering = cat?.allowCateringHelper;

                    return (
                      <motion.div
                        key={consumer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3 relative group"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-100 uppercase tracking-widest px-2 py-0.5 rounded-md">
                              {cat?.group || 'Категория'}
                            </span>
                            <h3 className="text-xs font-bold text-zinc-800 leading-tight mt-1.5">
                              {cat?.name}
                            </h3>
                            <div className="text-[11px] text-zinc-500 font-medium mt-1">
                              Норма: <span className="font-mono text-zinc-700 font-bold">{cat?.rate}</span> л/сутки на 1 {cat?.unit}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveConsumer(consumer.id)}
                            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                            title="Удалить категорию"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Normal inputs vs Catering Assist widget */}
                        <div className="pt-2.5 border-t border-zinc-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {isCatering && (
                            <button
                              type="button"
                              onClick={() => handleUpdateConsumer(consumer.id, { isCateringHelper: !consumer.isCateringHelper })}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                consumer.isCateringHelper 
                                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                  : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-100'
                              }`}
                            >
                              🖥 {consumer.isCateringHelper ? 'Помощник блюд активен' : 'Включить авторасчет блюд по местам'}
                            </button>
                          )}

                          {!consumer.isCateringHelper ? (
                            <div className="flex items-center gap-2.5 sm:ml-auto">
                              <span className="text-xs font-semibold text-zinc-600">Кол-во потребителей ({cat?.unit}):</span>
                              <div className="relative w-28">
                                <input
                                  type="number"
                                  min="1"
                                  value={consumer.count}
                                  onChange={(e) => handleUpdateConsumer(consumer.id, { count: Math.max(1, parseInt(e.target.value) || 0) })}
                                  className="w-full text-right bg-white border border-zinc-200 rounded-lg px-2.5 py-1 font-mono text-xs font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs font-semibold text-zinc-500 flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded">
                              <Calculator size={12} className="text-zinc-400" />
                              Рассчитано: <span className="font-mono font-extrabold text-zinc-800">{consumer.calculatedCount}</span> блюд
                            </div>
                          )}
                        </div>

                        {/* Rendering catering calculator helper when enabled */}
                        {isCatering && consumer.isCateringHelper && (
                          <div className="mt-3 p-3 bg-white border border-blue-100 rounded-lg space-y-3.5 text-xs text-zinc-650">
                            <div className="grid grid-cols-2 gap-3.5">
                              <div>
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                                  Тип заведения
                                </label>
                                <select
                                  value={consumer.cateringType || 'canteen'}
                                  onChange={(e) => handleUpdateConsumer(consumer.id, { cateringType: e.target.value as any })}
                                  className="w-full rounded border border-zinc-200 px-2 py-1 bg-zinc-50 text-xs font-medium outline-none"
                                >
                                  <option value="canteen">Столовая открытого типа / кафе</option>
                                  <option value="students">Студенческая столовая</option>
                                  <option value="industry">При промпредприятиях</option>
                                  <option value="restaurant">Ресторан</option>
                                  <option value="other">Другие предприятия (буфеты и т.п.)</option>
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                                    Мест (n)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={consumer.cateringSeats || 50}
                                    onChange={(e) => handleUpdateConsumer(consumer.id, { cateringSeats: Math.max(1, parseInt(e.target.value) || 0) })}
                                    className="w-full rounded border border-zinc-200 px-2 py-1 bg-zinc-50 text-xs font-mono font-bold outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                                    Смена, ч (T)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="24"
                                    value={consumer.cateringHours || 8}
                                    onChange={(e) => handleUpdateConsumer(consumer.id, { cateringHours: Math.min(24, Math.max(1, parseInt(e.target.value) || 0)) })}
                                    className="w-full rounded border border-zinc-200 px-2 py-1 bg-zinc-50 text-xs font-mono font-bold outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="text-[10px] bg-blue-50 border border-blue-100 rounded p-2 text-zinc-600 font-mono flex flex-col gap-0.5">
                              <div className="font-sans font-bold text-blue-700">Формула расчета блюд:</div>
                              <div>Uсут = 2,2 · n · m · T · y</div>
                              <div>m (число посадок) = {getCateringParams(consumer.cateringType).m} | y (неравномерность) = {getCateringParams(consumer.cateringType).y}</div>
                              <div className="text-blue-800 font-bold mt-1">Результат: {consumer.formulaString}</div>
                            </div>
                          </div>
                        )}

                        {/* Calculated contribution summary for this specific item */}
                        <div className="pt-2 text-[10px] font-mono font-medium text-zinc-500 flex justify-between">
                          <span>Суточный расход группы:</span>
                          <span className="text-zinc-800 font-bold">
                            {consumer.totalDailyVolume.toLocaleString()} л/сут ({(consumer.totalDailyVolume / 1000).toFixed(2)} м³/сут)
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Selection/Adding Utility panel */}
            <div className="space-y-4 pt-4 border-t border-zinc-150">
              <div className="bg-zinc-50/50 rounded-xl p-4 border border-zinc-150 space-y-3.5">
                <div className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                  <Plus size={14} className="text-blue-500" />
                  <span>Добавление новых категорий водопотребителей</span>
                </div>

                {/* Filter inputs */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Поиск по названию или группе..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 transition-all font-sans"
                  />
                  <select
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none font-sans font-semibold text-zinc-600 cursor-pointer"
                  >
                    <option value="all">Все группы</option>
                    {categoryGroups.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                {/* List of matched options to click and add */}
                <div className="max-h-56 overflow-y-auto border border-zinc-200 bg-white rounded-lg divide-y divide-zinc-100 font-sans custom-scrollbar">
                  {filteredCategoriesToAdd.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400 font-medium">
                      Нет категорий, соответствующих фильтрам
                    </div>
                  ) : (
                    filteredCategoriesToAdd.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleAddConsumer(cat)}
                        className="w-full text-left p-2.5 hover:bg-zinc-50 transition-colors flex justify-between items-center gap-4 text-xs group"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-zinc-850 group-hover:text-blue-600 transition-colors">
                            {cat.name}
                          </div>
                          <div className="text-[10.5px] text-zinc-400 font-medium">
                            Группа: {cat.group} | Норма: <span className="font-mono text-zinc-500 font-bold">{cat.rate}</span> л/({cat.unit})
                          </div>
                        </div>
                        <span className="shrink-0 bg-blue-50 text-blue-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-all">
                          + Добавить
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Hand: OUTPUT RESULTS & SUMMARY */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          
          {/* Main Gcal Load Output */}
          <div className="rounded-2xl sm:rounded-3xl bg-zinc-950 p-4 sm:p-6 text-white shadow-xl border border-zinc-850 relative overflow-hidden flex flex-col justify-between min-h-[11rem] sm:min-h-[12rem] h-auto transition-all">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 bg-blue-500/15 blur-3xl z-0" />

            <div className="z-10 flex items-center justify-between gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-blue-400 flex items-center gap-1.5 min-w-0 truncate">
                <FlameKindling size={14} className="shrink-0" />
                <span className="truncate">Тепловая нагрузка ГВС (Q<sub>гвс</sub><sup>ср</sup>)</span>
              </span>
              <span className="font-mono text-[10px] bg-zinc-900 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded font-bold shrink-0">
                T = {calculations.T_hours} ч
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
                <div className="space-y-0.5 text-left pl-1">
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



          {/* Mathematical Step-by-Step details */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden divide-y divide-zinc-100">
            <div className="p-4 bg-zinc-50/50 flex items-center gap-1.5 text-xs font-bold text-zinc-700 uppercase tracking-widest border-b border-zinc-100">
              <Calculator size={14} className="text-zinc-400" />
              <span>Формулы и ход расчета</span>
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
                  <p>Определяется на основе изоляции стояков, наличия полотенцесушителей и структуры наружных сетей горячего водоснабжения (по Таблице 9 методики):</p>
                  <p className="font-mono text-zinc-800 font-bold">Выбранное значение Ктп = {ktp}</p>
                  <p className="text-[10px] text-zinc-500">Параметры: стояки {inputs.ktpMode === 'insulated' ? 'изолированные' : 'неизолированные'}, полотенцесушители: {inputs.ktpTowels === 'with' ? 'есть' : 'нет'}, внешние теплосети: {inputs.ktpExternal === 'with' ? 'есть' : 'нет'}</p>
                </div>
              )}
            </div>

            {/* Step 2: V_day */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(2)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 2:</span> Суточный объем водопотребления V<sub>сут</sub>
                </span>
                {openSteps[2] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>

              {openSteps[2] && (
                <div className="pt-2 text-zinc-650 space-y-2 font-sans bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Суммируется суточный расход горячей воды для всех категорий потребителей:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 rounded leading-relaxed text-[10.5px]">
                    V_сут = Σ (qi,u,m · Ui)<br />
                    V_сут = {processedConsumers.map(item => `(${item.rate}л × ${item.calculatedCount})`).join(' + ') || '0'}<br />
                    V_сут = <span className="text-blue-600 font-bold">{calculations.totalDailyVolumeLiters.toLocaleString()} л/сутки</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: qT */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(3)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 3:</span> Среднечасовой расход воды q<sub>Т</sub>
                </span>
                {openSteps[3] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>

              {openSteps[3] && (
                <div className="pt-2 text-zinc-650 space-y-2 font-sans bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Средний часовой расход воды за расчетный период водопотребления в кубических метрах в час:</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[10.5px] rounded leading-loose">
                    qТ = V_сут / (1000 · T)<br />
                    qТ = {calculations.totalDailyVolumeLiters.toLocaleString()} / (1000 · {calculations.T_hours}) = <span className="text-blue-600 font-extrabold">{calculations.qT.toFixed(5)} м³/ч</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Где T = {calculations.T_hours} ч — установленный период потребления горячей воды для выбранной структуры потребителей.
                  </p>
                </div>
              )}
            </div>

            {/* Step 4: Q_Gcal */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => toggleStep(4)}
                className="w-full flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                  <span>Шаг 4:</span> Среднечасовая тепловая нагрузка Q<sub>гвс</sub><sup>ср</sup>
                </span>
                {openSteps[4] ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
              </button>

              {openSteps[4] && (
                <div className="pt-2 text-zinc-650 space-y-2 font-sans bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <p>Находится по формуле теплосъема с учетом потерь трубопроводами (К<sub>тп</sub>):</p>
                  <div className="font-mono bg-white p-2 border border-zinc-150 text-[10.5px] rounded leading-loose">
                    Qгвс_ср = qТ · (tгв – tхв) · 10⁻³ · (1 + Ктп)<br />
                    Qгвс_ср = {calculations.qT.toFixed(5)} · ({inputs.tgv} – {inputs.txv}) · 0.001 · (1 + {ktp})<br />
                    Qгвс_ср = {calculations.qT.toFixed(5)} · {calculations.dt} · 0.001 · {1 + ktp} = <span className="text-blue-600 font-extrabold">{calculations.qGcal.toFixed(6)} Гкал/ч</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Эквивалентно в других тепловых единицах:<br />
                    - Тепловой поток: <strong>{calculations.qKW.toFixed(2)} кВт</strong><br />
                    - Эквивалентная мощность: <strong>{calculations.qMW.toFixed(5)} МВт</strong>
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
