/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Scan, Plus, FileSpreadsheet, Wrench, Settings, User, 
  LogOut, Shield, CheckCircle, AlertTriangle, RefreshCw, Trash2, 
  Edit3, Eye, FileText, Camera, Upload, X, Check, ArrowRight,
  Database, HelpCircle, Layers, Building, Calendar, Info
} from 'lucide-react';

interface Mold {
  id: string;
  number: string;
  name: string;
  customer: string;
  status: 'active' | 'maintenance' | 'storage' | 'inactive';
  rack: string;
  position: string;
  cavities: number;
  lastMaintenance?: string;
  notes?: string;
  created_at?: string;
}

const INITIAL_MOLDS: Mold[] = [
  { id: '1', number: '765', name: 'Kryt konektoru', customer: 'Automotive CZ', status: 'active', rack: 'A1', position: '04', cavities: 4, lastMaintenance: '2026-01-15', notes: 'Pravidelná kontrola OK' },
  { id: '2', number: '976', name: 'Držák kabelu', customer: 'Bosch', status: 'maintenance', rack: 'B2', position: '12', cavities: 2, lastMaintenance: '2025-11-20', notes: 'Výměna vyhazovačů' },
  { id: '3', number: '808', name: 'Steckdeckel', customer: 'Siemens', status: 'active', rack: 'A3', position: '08', cavities: 8, lastMaintenance: '2026-02-10', notes: 'Bez závad' },
  { id: '4', number: '584', name: 'Kryt pojistky', customer: 'Continental', status: 'storage', rack: 'C1', position: '01', cavities: 4, lastMaintenance: '2025-09-10', notes: 'Uloženo do zásoby' },
  { id: '5', number: '10425', name: 'Panel ovladače', customer: 'Valeo', status: 'active', rack: 'D4', position: '05', cavities: 1, lastMaintenance: '2026-02-01', notes: 'V provozu' },
];

const CUSTOMERS = ['Všichni', 'Automotive CZ', 'Bosch', 'Siemens', 'Continental', 'Valeo'];
const STATUSES = [
  { key: 'all', label: 'Všechny stavy' },
  { key: 'active', label: 'V provozu' },
  { key: 'maintenance', label: 'Údržba' },
  { key: 'storage', label: 'Sklad' }
];

export default function App() {
  const [molds, setMolds] = useState<Mold[]>(() => {
    const saved = localStorage.getItem('adis_molds');
    return saved ? JSON.parse(saved) : INITIAL_MOLDS;
  });

  const [activeTab, setActiveTab] = useState<'inventory' | 'maintenance' | 'export'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('Všichni');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [selectedMold, setSelectedMold] = useState<Mold | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(() => {
    const saved = localStorage.getItem('adis_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('adis_molds', JSON.stringify(molds));
  }, [molds]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      showToast('Zadejte e-mail', 'error');
      return;
    }
    const newUser = { email: emailInput, role: emailInput.includes('admin') ? 'admin' : 'operator' };
    setUser(newUser);
    localStorage.setItem('adis_user', JSON.stringify(newUser));
    setIsAuthOpen(false);
    showToast(`Přihlášeno jako ${newUser.email}`);
    setEmailInput('');
    setPasswordInput('');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('adis_user');
    showToast('Odhlášeno');
  };

  const handleScanImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      setIsScanning(true);
      try {
        const res = await fetch('/api/gemini/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64String, mode: 'mold' })
        });
        const data = await res.json();
        if (data.success && data.data) {
          setScanResult(data.data);
          const foundNum = data.data.primary_number;
          if (foundNum) {
            setSearchTerm(foundNum);
            showToast(`Naleena forma: ${foundNum}`);
          } else {
            showToast('Forma nebyla v obrázku detekována', 'error');
          }
        } else {
          showToast(data.error || 'Chyba AI rozpoznávání', 'error');
        }
      } catch (err: any) {
        showToast(err.message || 'Chyba připojení k AI serveru', 'error');
      } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredMolds = molds.filter(m => {
    const matchesSearch = 
      m.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.rack.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCustomer = selectedCustomer === 'Všichni' || m.customer === selectedCustomer;
    const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;

    return matchesSearch && matchesCustomer && matchesStatus;
  });

  const exportToHelios = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["CisloFormy,Nazev,Zakaznik,Stav,Regal,Pozice,Dutiny,PosledniUdrzba"].join(",") + "\n" +
      molds.map(m => [m.number, `"${m.name}"`, `"${m.customer}"`, m.status, m.rack, m.position, m.cavities, m.lastMaintenance || ''].join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `helios_export_formy_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export do Helios CSV byl úspěšně vygenerován');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col items-center">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast-notification show ${toastType === 'error' ? 'toast-error' : ''}`}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-xl shadow-sm my-4 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="relative bg-white border-b border-slate-200 px-6 py-5 flex flex-col items-center justify-center">
          <div className="absolute left-6 top-5 flex items-center gap-2">
            {user ? (
              <button 
                onClick={handleLogout}
                className="auth-btn logged-in"
                title="Odhlásit se"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold">{user.email}</span>
                <LogOut className="w-3.5 h-3.5 ml-1 text-white" />
              </button>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)}
                className="auth-btn"
              >
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold">Přihlásit</span>
              </button>
            )}
          </div>

          <div className="absolute right-6 top-5 flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="top-icon-btn"
              title="AI Skener formy"
            >
              <Scan className="w-4 h-4 text-slate-700" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleScanImage} 
              accept="image/*" 
              capture="environment"
              className="hidden" 
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-lg text-lg">A • f</span>
              Adis Formy
            </h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
              Systém pro evidenci a správu forem skladu závodu
            </p>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex border-b border-slate-200 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-slate-900 text-slate-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Layers className="w-4 h-4" />
            Sklad forem ({molds.length})
          </button>
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'maintenance' ? 'border-slate-900 text-slate-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Wrench className="w-4 h-4" />
            Údržba a servis
          </button>
          <button 
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'export' ? 'border-slate-900 text-slate-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Helios Export
          </button>
        </nav>

        {/* Content Area */}
        <main className="p-6 flex-1 flex flex-col gap-5 min-h-[500px]">
          
          {activeTab === 'inventory' && (
            <div className="flex flex-col gap-4 flex-1">
              {/* Search & AI Scan banner if active */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Vyhledat podle čísla formy, názvu, zákazníka nebo regálu..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <span>{isScanning ? 'Rozpoznávám...' : 'AI Sken'}</span>
                </button>
              </div>

              {/* Customer Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {CUSTOMERS.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCustomer(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedCustomer === c ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                {STATUSES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSelectedStatus(s.key)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${selectedStatus === s.key ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {s.label}
                  </button>
                ))}
                <div className="ml-auto text-xs font-medium text-slate-400">
                  Nalezeno: {filteredMolds.length} forem
                </div>
              </div>

              {/* Molds Table / Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Forma</th>
                        <th className="py-3 px-4">Název / Díl</th>
                        <th className="py-3 px-4">Zákazník</th>
                        <th className="py-3 px-4">Pozice</th>
                        <th className="py-3 px-4">Stav</th>
                        <th className="py-3 px-4 text-right">Akce</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredMolds.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400">
                            Žádné formy neodpovídají zadanému filtru.
                          </td>
                        </tr>
                      ) : (
                        filteredMolds.map(mold => (
                          <tr key={mold.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-mono">
                                #{mold.number}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {mold.name}
                              <div className="text-[11px] text-slate-400">Dutiny: {mold.cavities}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                                <Building className="w-3 h-3 text-slate-400" />
                                {mold.customer}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                              Regál {mold.rack} - Poz {mold.position}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                mold.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                mold.status === 'maintenance' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  mold.status === 'active' ? 'bg-emerald-500' :
                                  mold.status === 'maintenance' ? 'bg-amber-500' : 'bg-slate-400'
                                }`} />
                                {mold.status === 'active' ? 'V provozu' : mold.status === 'maintenance' ? 'Údržba' : 'Sklad'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button 
                                onClick={() => { setSelectedMold(mold); setIsModalOpen(true); }}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                title="Detail formy"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Sledování údržby a servisních zásahů</h2>
                  <p className="text-xs text-slate-500">Přehled forem vyžadujících servis nebo s naplánovanou údržbou</p>
                </div>
                <button 
                  onClick={() => showToast('Nová údržba byla připravena')}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Zapsat servis
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {molds.map(m => (
                  <div key={m.id} className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">#{m.number}</span>
                          <h3 className="font-semibold text-slate-900">{m.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Zákazník: {m.customer} • Regál {m.rack}-{m.position}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                        m.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {m.status === 'maintenance' ? 'Probíhá servis' : 'V pořádku'}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600 flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Poslední údržba:</span>
                        <span className="font-medium text-slate-700">{m.lastMaintenance || 'Zatím neevidováno'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Poznámka:</span>
                        <span className="font-medium text-slate-700">{m.notes || 'Bez poznámek'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button 
                        onClick={() => {
                          const updated = molds.map(item => item.id === m.id ? { ...item, status: item.status === 'maintenance' ? 'active' : 'maintenance' as any, lastMaintenance: new Date().toISOString().slice(0,10) } : item);
                          setMolds(updated);
                          showToast(`Stav údržby formy #${m.number} byl aktualizován`);
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        {m.status === 'maintenance' ? 'Ukončit údržbu' : 'Zadat do údržby'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="max-w-md flex flex-col gap-2">
                <h2 className="text-xl font-bold text-slate-900">Export dat do ERP Helios</h2>
                <p className="text-sm text-slate-500">
                  Stáhněte aktuální stav skladu forem ve formátu CSV optimalizovaném pro přímý import do podnikového systému Helios.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={exportToHelios}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Stáhnout Helios CSV
                </button>
              </div>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div>Adis Formy • Sklad závodu</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Online / Synchronizováno
          </div>
        </footer>

      </div>

      {/* Mold Detail Modal */}
      {isModalOpen && selectedMold && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base bg-white border border-slate-200 px-2.5 py-1 rounded-lg">#{selectedMold.number}</span>
                <h3 className="font-bold text-slate-900 text-base">{selectedMold.name}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Zákazník</span>
                  <span className="font-semibold text-slate-800">{selectedMold.customer}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Umístění</span>
                  <span className="font-semibold text-slate-800 font-mono">Regál {selectedMold.rack} - Poz {selectedMold.position}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Počet dutin</span>
                  <span className="font-semibold text-slate-800 font-mono">{selectedMold.cavities}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Stav</span>
                  <span className="font-semibold text-slate-800">{selectedMold.status}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">Poznámka / Servisní historie</label>
                <textarea 
                  value={selectedMold.notes || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMold({ ...selectedMold, notes: val });
                    setMolds(molds.map(m => m.id === selectedMold.id ? { ...m, notes: val } : m));
                  }}
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Zadejte poznámku k formě..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold"
              >
                Hotovo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-base">Přihlášení do Adis Formy</h3>
              <button onClick={() => setIsAuthOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">E-mail</label>
                <input 
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="uzivatel@adismoulds.cz"
                  className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Heslo</label>
                <input 
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <button 
                type="submit"
                className="mt-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                Přihlásit se
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
