import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Database, Settings, FilePlus, Upload, Wallet,
  Fuel, Menu, X, FileDown, GitFork
} from 'lucide-react';
import {
  Abastecimento, OrcamentoDiretoria, RateioCC, TabType,
  FiltroKey, FiltroSelecoes, FILTROS_PADRAO_KEYS, FILTRO_SELECOES_VAZIO,
} from './types';
import { dadosProcessados, orcamentoInicial, parametrosInicial } from './data/initialData';
import Dashboard from './components/Dashboard';
import BaseDados from './components/BaseDados';
import Parametros from './components/Parametros';
import Preenchimento from './components/Preenchimento';
import Importacao from './components/Importacao';
import Orcamento from './components/Orcamento';
import Exportacao from './components/Exportacao';
import Rateio from './components/Rateio';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'base_dados',   label: 'Base de Dados', icon: Database },
  { id: 'orcamento',    label: 'Orçamento',     icon: Wallet },
  { id: 'rateio',       label: 'Rateio CC',     icon: GitFork },
  { id: 'preenchimento', label: 'Preenchimento', icon: FilePlus },
  { id: 'importacao',   label: 'Importação',    icon: Upload },
  { id: 'exportacao',   label: 'Exportação',    icon: FileDown },
  { id: 'parametros',   label: 'Parâmetros',    icon: Settings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dados, setDados] = useState<Abastecimento[]>(dadosProcessados);
  const [orcamento, setOrcamento] = useState<OrcamentoDiretoria[]>(orcamentoInicial);
  const [rateios, setRateios] = useState<RateioCC[]>([]);
  const [parametros, setParametros] = useState(parametrosInicial);
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Estado persistente dos filtros do Dashboard ──────────────────────────
  const [filtrosAtivos, setFiltrosAtivos] = useState<FiltroKey[]>(FILTROS_PADRAO_KEYS);
  const [filtroSelecoes, setFiltroSelecoes] = useState<FiltroSelecoes>(FILTRO_SELECOES_VAZIO);

  const nextId = useMemo(() => {
    return dados.length > 0 ? Math.max(...dados.map(d => d.id)) + 1 : 1;
  }, [dados]);

  const handleAdd = useCallback((item: Omit<Abastecimento, 'id' | 'valor'>) => {
    const novo: Abastecimento = {
      ...item,
      id: nextId,
      valor: item.litros * parametros.precoDiesel,
    };
    setDados(prev => [...prev, novo]);
  }, [nextId, parametros.precoDiesel]);

  const handleImport = useCallback((items: Omit<Abastecimento, 'id' | 'valor'>[]) => {
    let currentId = nextId;
    const novos: Abastecimento[] = items.map(item => ({
      ...item,
      id: currentId++,
      valor: item.litros * parametros.precoDiesel,
    }));
    setDados(prev => [...prev, ...novos]);
  }, [nextId, parametros.precoDiesel]);

  const handleDelete = useCallback((id: number) => {
    setDados(prev => prev.filter(d => d.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setDados([]);
  }, []);

  const handleChangePreco = useCallback((valor: number) => {
    setParametros(prev => ({ ...prev, precoDiesel: valor }));
    setDados(prev => prev.map(d => ({
      ...d,
      valor: d.litros * valor,
    })));
  }, []);

  const dadosRealizados = useMemo(() => {
    const agrupado: Record<string, number> = {};
    dados.forEach(d => {
      agrupado[d.diretoria] = (agrupado[d.diretoria] || 0) + d.litros * parametros.precoDiesel;
    });
    return Object.entries(agrupado).map(([diretoria, realizado]) => ({ diretoria, realizado }));
  }, [dados, parametros.precoDiesel]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            dados={dados}
            orcamento={orcamento}
            precoDiesel={parametros.precoDiesel}
            filtrosAtivos={filtrosAtivos}
            setFiltrosAtivos={setFiltrosAtivos}
            filtroSelecoes={filtroSelecoes}
            setFiltroSelecoes={setFiltroSelecoes}
          />
        );
      case 'base_dados':
        return <BaseDados dados={dados} precoDiesel={parametros.precoDiesel} onDelete={handleDelete} onClearAll={handleClearAll} />;
      case 'orcamento':
        return (
          <Orcamento
            orcamento={orcamento}
            onUpdate={setOrcamento}
            dadosRealizados={dadosRealizados}
            dados={dados}
            precoDiesel={parametros.precoDiesel}
          />
        );
      case 'preenchimento':
        return <Preenchimento onAdd={handleAdd} nextId={nextId} />;
      case 'importacao':
        return <Importacao onImport={handleImport} />;
      case 'exportacao':
        return <Exportacao dados={dados} orcamento={orcamento} precoDiesel={parametros.precoDiesel} />;
      case 'rateio':
        return <Rateio dados={dados} rateios={rateios} precoDiesel={parametros.precoDiesel} onSave={setRateios} />;
      case 'parametros':
        return <Parametros precoDiesel={parametros.precoDiesel} onChangePreco={handleChangePreco} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Fuel className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Controle de Abastecimento</h1>
                <p className="text-xs text-slate-500">Sistema Corporativo de Gestão de Combustível</p>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-slate-200 overflow-hidden bg-white"
            >
              <div className="px-4 py-3 space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <p>Controle de Abastecimento v1.0 — Sistema Corporativo</p>
            <p>Preço Diesel: R$ {parametros.precoDiesel.toFixed(2)}/L | {dados.length} registros | {orcamento.length} diretorias</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
