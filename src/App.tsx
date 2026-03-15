import React, { useState, useEffect } from 'react';
import { Menu, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewId, HeatingVolumeInputs, HeatingNoVolumeInputs, VentilationVolumeInputs, VentilationCurtainInputs } from './types';
import { DEFAULT_HEATING_VOLUME_INPUTS, DEFAULT_HEATING_NO_VOLUME_INPUTS, DEFAULT_VENTILATION_VOLUME_INPUTS, DEFAULT_VENTILATION_CURTAIN_INPUTS } from './constants';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { HeatingVolumeCalculator } from './components/HeatingVolumeCalculator';
import { HeatingNoVolumeCalculator } from './components/HeatingNoVolumeCalculator';
import { VentilationVolumeCalculator } from './components/VentilationVolumeCalculator';
import { VentilationCurtainCalculator } from './components/VentilationCurtainCalculator';
import { PlaceholderView } from './components/PlaceholderView';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewId>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_current_view') : null;
      return (saved as ViewId) || 'home';
    } catch (e) {
      return 'home';
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [heatingVolumeInputs, setHeatingVolumeInputs] = useState<HeatingVolumeInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_heating_volume') : null;
      if (!saved) return DEFAULT_HEATING_VOLUME_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.alpha === 'number' && typeof parsed.q0 === 'number') {
        return parsed;
      }
      return DEFAULT_HEATING_VOLUME_INPUTS;
    } catch (e) {
      return DEFAULT_HEATING_VOLUME_INPUTS;
    }
  });

  const [heatingNoVolumeInputs, setHeatingNoVolumeInputs] = useState<HeatingNoVolumeInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_heating_no_volume') : null;
      if (!saved) return DEFAULT_HEATING_NO_VOLUME_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.area === 'number' && typeof parsed.q0 === 'number') {
        return parsed;
      }
      return DEFAULT_HEATING_NO_VOLUME_INPUTS;
    } catch (e) {
      return DEFAULT_HEATING_NO_VOLUME_INPUTS;
    }
  });

  const [ventilationVolumeInputs, setVentilationVolumeInputs] = useState<VentilationVolumeInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_ventilation_volume') : null;
      if (!saved) return DEFAULT_VENTILATION_VOLUME_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.qv === 'number' && typeof parsed.vn === 'number') {
        return parsed;
      }
      return DEFAULT_VENTILATION_VOLUME_INPUTS;
    } catch (e) {
      return DEFAULT_VENTILATION_VOLUME_INPUTS;
    }
  });

  const [ventilationCurtainInputs, setVentilationCurtainInputs] = useState<VentilationCurtainInputs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('heatload_inputs_ventilation_curtain') : null;
      if (!saved) return DEFAULT_VENTILATION_CURTAIN_INPUTS;
      const parsed = JSON.parse(saved);
      if (typeof parsed.height === 'number' && typeof parsed.width === 'number') {
        return parsed;
      }
      return DEFAULT_VENTILATION_CURTAIN_INPUTS;
    } catch (e) {
      return DEFAULT_VENTILATION_CURTAIN_INPUTS;
    }
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('heatload_current_view', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_heating_volume', JSON.stringify(heatingVolumeInputs));
  }, [heatingVolumeInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_heating_no_volume', JSON.stringify(heatingNoVolumeInputs));
  }, [heatingNoVolumeInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_ventilation_volume', JSON.stringify(ventilationVolumeInputs));
  }, [ventilationVolumeInputs]);

  useEffect(() => {
    localStorage.setItem('heatload_inputs_ventilation_curtain', JSON.stringify(ventilationCurtainInputs));
  }, [ventilationCurtainInputs]);

  // PWA Install Logic
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
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={setCurrentView} />;
      case 'heating-volume':
        return (
          <HeatingVolumeCalculator 
            inputs={heatingVolumeInputs} 
            setInputs={setHeatingVolumeInputs} 
            onBack={() => setCurrentView('home')} 
          />
        );
      case 'heating-no-volume':
        return (
          <HeatingNoVolumeCalculator 
            inputs={heatingNoVolumeInputs} 
            setInputs={setHeatingNoVolumeInputs} 
            onBack={() => setCurrentView('home')} 
          />
        );
      case 'vent-supply':
        return (
          <VentilationVolumeCalculator
            inputs={ventilationVolumeInputs}
            setInputs={setVentilationVolumeInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'vent-curtain':
        return (
          <VentilationCurtainCalculator
            inputs={ventilationCurtainInputs}
            setInputs={setVentilationCurtainInputs}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'tech-floor':
        return <PlaceholderView title="Технология: Теплый пол" onBack={() => setCurrentView('home')} />;
      case 'tech-pool':
        return <PlaceholderView title="Технология: Бассейн" onBack={() => setCurrentView('home')} />;
      case 'gvs':
        return <PlaceholderView title="Горячее водоснабжение" onBack={() => setCurrentView('home')} />;
      default:
        return <HomeView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              <div className="lg:hidden flex items-center gap-2">
                <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
                  <Maximize2 size={16} />
                </div>
                <span className="font-bold tracking-tight">HeatLoad Pro</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {showInstallBtn && (
                <button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-emerald-600 active:scale-95"
                >
                  <Maximize2 size={14} />
                  <span className="hidden sm:inline">Установить</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
