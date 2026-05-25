import React, { useMemo, useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  X,
  Thermometer,
  Snowflake,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HeatingOutdoorAreaInputs, CalculationResult } from '../types';
import { DEFAULT_HEATING_OUTDOOR_AREA_INPUTS } from '../constants';
import { TO_DATA } from '../q0Data';
import { InputField } from './InputField';

interface HeatingOutdoorAreaCalculatorProps {
  inputs: HeatingOutdoorAreaInputs;
  setInputs: React.Dispatch<React.SetStateAction<HeatingOutdoorAreaInputs>>;
  onBack: () => void;
}

export const HeatingOutdoorAreaCalculator: React.FC<HeatingOutdoorAreaCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  const [isToModalOpen, setIsToModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const { an, tn, to, sn } = inputs;
    
    // Formula: Qот н = an * (tn - to) * Sn, W
    const tempDiff = tn - to;
    const totalWatts = an * tempDiff * sn;
    const totalKW = totalWatts / 1000;
    const totalMW = totalWatts * 1e-6;
    const totalGcal = totalMW * 0.859845;

    return {
      totalMW: Math.round(totalMW * 1000000) / 1000000,
      totalKW: Math.round(totalKW * 100) / 100,
      totalGcal: Math.round(totalGcal * 1000000) / 1000000,
      totalWatts: Math.round(totalWatts),
      tempDiff,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs]);

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_HEATING_OUTDOOR_AREA_INPUTS);
    }
  };

  const handleSelectTo = (toValue: number) => {
    setInputs(prev => ({ ...prev, to: toValue }));
    setIsToModalOpen(false);
  };

  const generateReportText = () => {
    return `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ НА ОБОГРЕВ НАРУЖНОЙ ПЛОЩАДКИ
===================================================
Дата: ${result.timestamp}

ИСХОДНЫЕ ДАННЫЕ:
----------------
an (коэф. теплоотдачи поверхности): ${inputs.an} Вт/(м²·°C)
tn (температура поверхности площадки): ${inputs.tn} °C
to (температура наружного воздуха): ${inputs.to} °C
Sn (площадь обогреваемой площадки): ${inputs.sn} м²

РАСЧЕТ:
-------
Δt = tn - to = ${inputs.tn} - (${inputs.to}) = ${result.tempDiff} °C
Qот н = an × Δt × Sn = ${inputs.an} × ${result.tempDiff} × ${inputs.sn} = ${result.totalWatts.toLocaleString()} Вт

ИТОГ:
-----
Мощность: ${result.totalWatts.toLocaleString()} Вт
Мощность: ${result.totalKW.toLocaleString()} кВт
Мощность: ${result.totalMW} МВт
Тепловая нагрузка: ${result.totalGcal} Гкал/ч
===================================================
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
    link.download = `outdoor_heating_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
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

      <div className="max-w-4xl">
        <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl">
          Расчет тепловой нагрузки на обогрев наружной площадки
        </h1>
        <div className="mt-4 h-1 w-20 rounded-full bg-zinc-900" />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Input Panel */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Layers size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Исходные данные</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <InputField 
                label={<span>a<sub>n</sub> — Коэффициент теплоотдачи поверхности</span>} 
                id="an" 
                value={inputs.an} 
                onChange={(val) => setInputs(prev => ({ ...prev, an: val }))}
                suffix="Вт/(м²·°C)"
                hint="Коэффициент теплоотдачи поверхности обогреваемой площадки. Согласно методике, обычно принимается равным 23 Вт/(м²·°С)."
              />

              <InputField 
                label={<span>S<sub>n</sub> — Площадь обогреваемой площадки</span>} 
                id="sn" 
                value={inputs.sn} 
                onChange={(val) => setInputs(prev => ({ ...prev, sn: val }))}
                suffix="м²"
                hint="Общая площадь наружной обогреваемой поверхности."
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
                label={<span>t<sub>n</sub> — Температура поверхности площадки</span>} 
                id="tn" 
                value={inputs.tn} 
                onChange={(val) => setInputs(prev => ({ ...prev, tn: val }))}
                suffix="°C"
                hint="Расчетная зимняя температура обогреваемой поверхности. По СНиП обычно принимается равным +3 °C."
              />

              <InputField 
                label={<span>t<sub>o</sub> — Температура наружного воздуха</span>} 
                id="to" 
                value={inputs.to} 
                onChange={(val) => setInputs(prev => ({ ...prev, to: val }))}
                suffix="°C"
                hint="Расчетная температура наружного воздуха для проектирования отопления по СНиП 23-01-99*."
                action={
                  <button 
                    onClick={() => setIsToModalOpen(true)}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    title="Справочник t₀ по СНиП"
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
                <Snowflake size={20} className="text-sky-400 animate-pulse" />
              </div>
              
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-5xl font-light tracking-tighter">{result.totalGcal}</span>
                <span className="text-xl font-medium text-zinc-400">Гкал/час</span>
              </div>

              <div className="mb-8 flex flex-col gap-1.5 border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="font-bold text-zinc-200">≈ {result.totalMW}</span>
                  <span>МВт</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="font-bold text-zinc-200">≈ {result.totalKW.toLocaleString()}</span>
                  <span>кВт</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span>≈ {result.totalWatts.toLocaleString()} Вт</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 uppercase font-semibold">Разность температур (tn - to)</span>
                  <span className="font-mono text-zinc-300">{result.tempDiff} °C</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 uppercase font-semibold">Площадь площадки</span>
                  <span className="font-mono text-zinc-300">{inputs.sn} м²</span>
                </div>
              </div>
            </motion.div>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Методика расчета</h3>
              <div className="rounded-lg bg-zinc-50 p-4 font-mono text-[11px] leading-relaxed text-zinc-600 space-y-3">
                <div>
                  <p className="font-bold text-zinc-900">Qот н = an · (tn – to) · Sn</p>
                  <p className="text-zinc-500">Теплоотдача в Ваттах (Вт):</p>
                  <p className="opacity-80 mt-1 pl-2 border-l-2 border-zinc-300">
                    = {inputs.an} · ({inputs.tn} - ({inputs.to})) · {inputs.sn} <br />
                    = {inputs.an} · {result.tempDiff} · {inputs.sn} <br />
                    = <span className="font-bold text-zinc-900">{result.totalWatts.toLocaleString()} Вт</span>
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-200">
                  <p className="text-zinc-500">Перевод в Гкал/час:</p>
                  <p className="opacity-80 font-bold text-zinc-900 pl-2 border-l-2 border-zinc-300">
                    = {result.totalMW} МВт · 0.859845 <br />
                    = {result.totalGcal} Гкал/час
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-[10px] text-sky-800">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>Коэффициент an равен 23 Вт/(м²·°С), а расчетная температура поверхности tn принята равной +3°С в соответствии с нормативной базой.</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* to (SNiP) Selection Modal */}
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
                  <h2 className="text-lg font-bold tracking-tight">Справочник t₀ (СНиП 23-01-99*)</h2>
                </div>
                <button 
                  onClick={() => setIsToModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
