import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Info, 
  Download, 
  RefreshCw, 
  Thermometer, 
  Maximize2, 
  Home, 
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Q0_DATA, Q0Entry, TO_DATA, ToEntry, TI_DATA, TiEntry } from './q0Data';

// --- Types ---
interface CalculationInputs {
  alpha: number;
  q0: number;
  vn: number;
  vp: number;
  ti: number;
  to: number;
}

interface CalculationResult {
  totalMW: number;
  totalGcal: number;
  totalWatts: number;
  volumeSum: number;
  tempDiff: number;
  timestamp: string;
}

// --- Constants & Defaults ---
const KTP_CONSTANT = 1.05;

const DEFAULT_INPUTS: CalculationInputs = {
  alpha: 1.0,
  q0: 0.45,
  vn: 1000,
  vp: 0,
  ti: 18,
  to: -25,
};

const ALPHA_TABLE = [
  { temp: -20, alpha: 1.17 },
  { temp: -25, alpha: 1.08 },
  { temp: -26, alpha: 1.064 },
  { temp: -27, alpha: 1.048 },
  { temp: -28, alpha: 1.032 },
  { temp: -30, alpha: 1.0 },
];

// --- Components ---

const InputField = ({ 
  label, 
  id, 
  value, 
  onChange, 
  type = "number", 
  step = "0.1",
  suffix,
  hint,
  action
}: { 
  label: string; 
  id: string; 
  value: number; 
  onChange: (val: number) => void;
  type?: string;
  step?: string;
  suffix?: string;
  hint?: string;
  action?: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {action}
        {hint && (
          <div className="group relative">
            <Info size={14} className="cursor-help text-zinc-400 transition-colors hover:text-zinc-600" />
            <div className="absolute bottom-full right-0 mb-2 hidden w-48 rounded-lg bg-zinc-900 p-2 text-[10px] leading-relaxed text-white shadow-xl group-hover:block z-50">
              {hint}
            </div>
          </div>
        )}
      </div>
    </div>
    <div className="relative">
      <input
        id={id}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

export default function App() {
  const [inputs, setInputs] = useState<CalculationInputs>(() => {
    const saved = localStorage.getItem('heatload_inputs');
    return saved ? JSON.parse(saved) : DEFAULT_INPUTS;
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [isQ0ModalOpen, setIsQ0ModalOpen] = useState(false);
  const [isToModalOpen, setIsToModalOpen] = useState(false);
  const [isTiModalOpen, setIsTiModalOpen] = useState(false);
  const [isAlphaModalOpen, setIsAlphaModalOpen] = useState(false);
  const [q0SearchQuery, setQ0SearchQuery] = useState('');
  const [tiSearchQuery, setTiSearchQuery] = useState('');

  // Persistence
  useEffect(() => {
    localStorage.setItem('heatload_inputs', JSON.stringify(inputs));
  }, [inputs]);

  const result = useMemo<CalculationResult>(() => {
    const { alpha, q0, vn, vp, ti, to } = inputs;
    const volumeSum = vn + 0.4 * vp;
    const tempDiff = ti - to;
    const totalWatts = alpha * q0 * volumeSum * tempDiff * KTP_CONSTANT;
    const totalMW = totalWatts * 1e-6;
    const totalGcal = totalMW * 0.859845;

    return {
      totalMW: Math.round(totalMW * 1000) / 1000,
      totalGcal: Math.round(totalGcal * 1000000) / 1000000,
      totalWatts: Math.round(totalWatts),
      volumeSum,
      tempDiff,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs]);

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
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_INPUTS);
    }
  };

  const filteredQ0Data = useMemo(() => {
    if (!q0SearchQuery) return Q0_DATA;
    const query = q0SearchQuery.toLowerCase();
    return Q0_DATA.filter(item => 
      item.category.toLowerCase().includes(query) || 
      (item.subCategory && item.subCategory.toLowerCase().includes(query)) ||
      item.volumeRange.toLowerCase().includes(query)
    );
  }, [q0SearchQuery]);

  const handleSelectQ0 = (value: number) => {
    setInputs(prev => ({ ...prev, q0: value }));
    setIsQ0ModalOpen(false);
  };

  const handleSelectTo = (value: number) => {
    setInputs(prev => ({ ...prev, to: value }));
    setIsToModalOpen(false);
  };

  const handleSelectTi = (value: number) => {
    setInputs(prev => ({ ...prev, ti: value }));
    setIsTiModalOpen(false);
  };

  const handleSelectAlpha = (value: number) => {
    setInputs(prev => ({ ...prev, alpha: value }));
    setIsAlphaModalOpen(false);
  };

  const filteredTiData = useMemo(() => {
    if (!tiSearchQuery) return TI_DATA;
    const query = tiSearchQuery.toLowerCase();
    return TI_DATA.filter(item => 
      item.roomType.toLowerCase().includes(query)
    );
  }, [tiSearchQuery]);
  const handleExport = () => {
    const content = `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ ДЛЯ ОБЪЕКТОВ ТЕПЛОПОТРЕБЛЕНИЯ, ОСУЩЕСТВЛЯЮЩИХ БЕЗДОГОВОРНОЕ ПОТРЕБЛЕНИЕ ТЕПЛОВОЙ ЭНЕРГИИ, ТЕПЛОНОСИТЕЛЯ ПО СТРОИТЕЛЬНОМУ ОБЪЕМУ
=========================================================================================================================================================
Дата: ${result.timestamp}

ИСХОДНЫЕ ДАННЫЕ:
----------------
α (поправочный коэффициент): ${inputs.alpha}
q0 (уд. отопительная характеристика): ${inputs.q0} Вт/(м³·°C)
Vн (объем здания): ${inputs.vn} м³
Vп (объем подвала): ${inputs.vp} м³
ti (температура внутри): ${inputs.ti} °C
to (температура снаружи): ${inputs.to} °C
kтп (коэффициент потерь): ${KTP_CONSTANT}

РАСЧЕТ:
-------
Vсум = ${inputs.vn} + 0,4 × ${inputs.vp} = ${result.volumeSum} м³
Δt = ${inputs.ti} - (${inputs.to}) = ${result.tempDiff} °C
Q = ${inputs.alpha} × ${inputs.q0} × ${result.volumeSum} × ${result.tempDiff} × ${KTP_CONSTANT} = ${result.totalWatts} Вт

ИТОГ:
-----
${result.totalMW} МВт
${result.totalGcal} Гкал/час
=======================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `heatload_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-bottom border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/20">
              <Calculator size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">HeatLoad Pro</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Инженерный расчет тепловой нагрузки</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-emerald-600 active:scale-95"
              >
                <Maximize2 size={14} />
                <span className="hidden sm:inline">Установить</span>
              </button>
            )}
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
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-4xl">
          <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl">
            Расчет тепловой нагрузки для объектов теплопотребления, осуществляющих бездоговорное потребление тепловой энергии, теплоносителя по строительному объему.
          </h1>
          <div className="mt-4 h-1 w-20 rounded-full bg-zinc-900" />
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Input Panel */}
          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
                <Layers size={18} className="text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Параметры здания</h2>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <InputField 
                  label="α (Поправочный коэф.)" 
                  id="alpha" 
                  value={inputs.alpha} 
                  onChange={(val) => setInputs(prev => ({ ...prev, alpha: val }))}
                  step="0.001"
                  suffix="Коэф."
                  hint="Поправочный коэффициент на расчетную температуру наружного воздуха."
                  action={
                    <button 
                      onClick={() => setIsAlphaModalOpen(true)}
                      className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      title="Справочник α"
                    >
                      <BookOpen size={14} />
                    </button>
                  }
                />

                <InputField 
                  label="q0 - уд. отопительная характеристика" 
                  id="q0" 
                  value={inputs.q0} 
                  onChange={(val) => setInputs(prev => ({ ...prev, q0: val }))}
                  suffix="Вт/(м³·°C)"
                  hint="Удельная отопительная характеристика здания."
                  action={
                    <button 
                      onClick={() => setIsQ0ModalOpen(true)}
                      className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      title="Справочник q0"
                    >
                      <BookOpen size={14} />
                    </button>
                  }
                />

                <InputField 
                  label="Vн (Наружный объем)" 
                  id="vn" 
                  value={inputs.vn} 
                  onChange={(val) => setInputs(prev => ({ ...prev, vn: val }))}
                  suffix="м³"
                  hint="Объем здания по наружному обмеру."
                />

                <InputField 
                  label="Vп (Объем подвала)" 
                  id="vp" 
                  value={inputs.vp} 
                  onChange={(val) => setInputs(prev => ({ ...prev, vp: val }))}
                  suffix="м³"
                  hint="Объем подвальных помещений (если есть)."
                />
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
                <Thermometer size={18} className="text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Климатические данные</h2>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <InputField 
                  label="ti (Внутренняя темп.)" 
                  id="ti" 
                  value={inputs.ti} 
                  onChange={(val) => setInputs(prev => ({ ...prev, ti: val }))}
                  suffix="°C"
                  hint="Расчетная температура воздуха внутри помещений."
                  action={
                    <button 
                      onClick={() => setIsTiModalOpen(true)}
                      className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      title="Справочник ti"
                    >
                      <BookOpen size={14} />
                    </button>
                  }
                />

                <InputField 
                  label="to (Наружная темп.)" 
                  id="to" 
                  value={inputs.to} 
                  onChange={(val) => setInputs(prev => ({ ...prev, to: val }))}
                  suffix="°C"
                  hint="Расчетная температура наружного воздуха."
                  action={
                    <button 
                      onClick={() => setIsToModalOpen(true)}
                      className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      title="Справочник t0"
                    >
                      <BookOpen size={14} />
                    </button>
                  }
                />
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
                  <CheckCircle2 size={20} className="text-emerald-400" />
                </div>
                
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-6xl font-light tracking-tighter">{result.totalMW}</span>
                  <span className="text-xl font-medium text-zinc-400">МВт</span>
                </div>

                <div className="mb-8 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="font-bold text-zinc-300">{result.totalGcal}</span>
                    <span>Гкал/час</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>≈ {result.totalWatts.toLocaleString()} Вт</span>
                  </div>
                </div>

                <div className="space-y-4 border-t border-zinc-800 pt-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 uppercase font-semibold">Суммарный объем</span>
                    <span className="font-mono text-zinc-300">{result.volumeSum} м³</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 uppercase font-semibold">Разность температур</span>
                    <span className="font-mono text-zinc-300">{result.tempDiff} °C</span>
                  </div>
                </div>
              </motion.div>

              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Методика расчета</h3>
                <div className="rounded-lg bg-zinc-50 p-4 font-mono text-[11px] leading-relaxed text-zinc-600">
                  <p className="mb-2 font-bold text-zinc-900">Qо мах = α ∙ q0 ∙ (Vн + 0,4 ∙ Vп) ∙ (ti - to) ∙ kтп ∙ 10⁻⁶</p>
                  <div className="space-y-1 opacity-80">
                    <p>= {inputs.alpha} × {inputs.q0} × ({inputs.vn} + 0,4 × {inputs.vp}) × ({inputs.ti} - ({inputs.to})) × {KTP_CONSTANT} × 10⁻⁶</p>
                    <p>= {inputs.alpha} × {inputs.q0} × {result.volumeSum} × {result.tempDiff} × {KTP_CONSTANT} × 10⁻⁶</p>
                    <p>= {result.totalWatts} × 10⁻⁶</p>
                    <p className="font-bold text-zinc-900">= {result.totalMW} МВт</p>
                    <p className="mt-1 text-[9px] text-zinc-400">Перевод в Гкал/час: {result.totalMW} × 0.859845 = {result.totalGcal} Гкал/час</p>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-[10px] text-amber-800">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>Расчет выполнен по методике бездоговорного потребления. Значения носят справочный характер.</p>
                </div>
              </section>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-zinc-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-zinc-400">
            &copy; {new Date().getFullYear()} HeatLoad Pro. Разработано для профессиональных инженеров-теплотехников.
          </p>
        </div>
      </footer>
      {/* Q0 Reference Modal */}
      <AnimatePresence>
        {isQ0ModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQ0ModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-full max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <BookOpen size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Справочник q₀</h2>
                </div>
                <button 
                  onClick={() => setIsQ0ModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="border-b border-zinc-100 px-6 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Поиск по категории, объему или типу здания..."
                    value={q0SearchQuery}
                    onChange={(e) => setQ0SearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      <th className="pb-3 pr-4">Категория</th>
                      <th className="pb-3 pr-4">Объем / Тип</th>
                      <th className="pb-3 text-right">q₀</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredQ0Data.length > 0 ? (
                      filteredQ0Data.map((item, idx) => (
                        <tr 
                          key={idx}
                          onClick={() => handleSelectQ0(item.value)}
                          className="group cursor-pointer transition-colors hover:bg-zinc-50"
                        >
                          <td className="py-4 pr-4">
                            <div className="font-semibold text-zinc-900">{item.category}</div>
                            {item.subCategory && (
                              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{item.subCategory}</div>
                            )}
                          </td>
                          <td className="py-4 pr-4 text-zinc-500">
                            {item.volumeRange}
                          </td>
                          <td className="py-4 text-right">
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                              {item.value}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-zinc-400">
                          Ничего не найдено по вашему запросу
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4 text-[10px] text-zinc-400 italic">
                * Значения q₀ приведены в ккал/(ч·м³·°С). При выборе значение автоматически подставляется в формулу.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* To Reference Modal */}
      <AnimatePresence>
        {isToModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsToModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-full max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <Thermometer size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Справочник t₀</h2>
                </div>
                <button 
                  onClick={() => setIsToModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-500 leading-relaxed">
                  Расчетная температура наружного воздуха t₀ принимается по СНиП 23-01-99* "Строительная климатология". Выберите период постройки здания для автоматической подстановки температуры.
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-100">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <th className="px-4 py-3">Период постройки</th>
                        <th className="px-4 py-3 text-right">t₀, °C</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {TO_DATA.map((item, idx) => (
                        <tr 
                          key={idx}
                          onClick={() => handleSelectTo(item.value)}
                          className="group cursor-pointer transition-colors hover:bg-zinc-50"
                        >
                          <td className="px-4 py-4">
                            <div className="font-semibold text-zinc-900">{item.period}</div>
                            {item.note && <div className="text-[10px] text-zinc-400">{item.note}</div>}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                              {item.value}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4 text-[10px] text-zinc-400 italic">
                * Данные соответствуют расчетным параметрам для проектирования систем отопления.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ti Reference Modal */}
      <AnimatePresence>
        {isTiModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTiModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-full max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <Thermometer size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Справочник tᵢ</h2>
                </div>
                <button 
                  onClick={() => setIsTiModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="border-b border-zinc-100 px-6 py-4">
                <div className="mb-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-500 leading-relaxed">
                  Расчетная температура внутреннего воздуха tᵢ принимается в зависимости от типа помещения и климатического района. Выберите тип помещения для автоматической подстановки температуры.
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Поиск по типу помещения..."
                    value={tiSearchQuery}
                    onChange={(e) => setTiSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="overflow-hidden rounded-xl border border-zinc-100">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <th className="px-4 py-3">Тип помещения</th>
                        <th className="px-4 py-3 text-right">tᵢ, °C</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {filteredTiData.length > 0 ? (
                        filteredTiData.map((item, idx) => (
                          <tr 
                            key={idx}
                            onClick={() => handleSelectTi(item.value)}
                            className="group cursor-pointer transition-colors hover:bg-zinc-50"
                          >
                            <td className="py-4 px-4">
                              <div className="font-semibold text-zinc-900">{item.roomType}</div>
                              {item.note && <div className="text-[10px] text-zinc-400">{item.note}</div>}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                                {item.value}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-12 text-center text-zinc-400">
                            Ничего не найдено по вашему запросу
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4 text-[10px] text-zinc-400 italic">
                * Данные соответствуют нормативным требованиям для проектирования систем отопления.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alpha Reference Modal */}
      <AnimatePresence>
        {isAlphaModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAlphaModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-full max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <Layers size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Справочник α</h2>
                </div>
                <button 
                  onClick={() => setIsAlphaModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-500 leading-relaxed">
                  Поправочный коэффициент α применяется для учета отклонения расчетной температуры наружного воздуха от базового значения (-30°C).
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-100">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <th className="px-4 py-3">Температура t₀, °C</th>
                        <th className="px-4 py-3 text-right">Коэффициент α</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {ALPHA_TABLE.map((item, idx) => (
                        <tr 
                          key={idx}
                          onClick={() => handleSelectAlpha(item.alpha)}
                          className="group cursor-pointer transition-colors hover:bg-zinc-50"
                        >
                          <td className="px-4 py-4 font-medium text-zinc-900">
                            {item.temp} °C
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                              {item.alpha}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4 text-[10px] text-zinc-400 italic text-center">
                Нажмите на строку для выбора коэффициента
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
