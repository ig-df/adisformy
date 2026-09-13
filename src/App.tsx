import React, { useState, useEffect } from 'react';
import { PressMold, UserLog, TabType, SystemStatus } from './types';
import { INITIAL_PRESS_MOLDS, INITIAL_USER_LOGS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { SearchTab } from './components/SearchTab';
import { DatabaseTab } from './components/DatabaseTab';
import { DashboardTab } from './components/DashboardTab';
import { PdfViewerModal } from './components/PdfViewerModal';
import { ScannerModal } from './components/ScannerModal';
import { MoldModal } from './components/MoldModal';
import { MoldDetailModal } from './components/MoldDetailModal';
import { triggerHaptic } from './utils/haptic';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  
  // Persistent State with localStorage fallback
  const [molds, setMolds] = useState<PressMold[]>(() => {
    const saved = localStorage.getItem('adis_formy_molds');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_PRESS_MOLDS;
      }
    }
    return INITIAL_PRESS_MOLDS;
  });

  const [logs, setLogs] = useState<UserLog[]>(() => {
    const saved = localStorage.getItem('adis_formy_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_USER_LOGS;
      }
    }
    return INITIAL_USER_LOGS;
  });

  const [systemStatus] = useState<SystemStatus>({
    githubSync: true,
    githubLastCommit: 'a94f1b2',
    supabaseConnected: true,
    supabaseLatencyMs: 24,
    geminiMode: 'configured',
    hapticEnabled: true,
  });

  // Modal States
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [pdfMold, setPdfMold] = useState<PressMold | null>(null);
  const [selectedMold, setSelectedMold] = useState<PressMold | null>(null);
  const [moldModalMode, setMoldModalMode] = useState<'create' | 'edit' | 'note' | null>(null);
  const [targetMoldForModal, setTargetMoldForModal] = useState<PressMold | null>(null);

  useEffect(() => {
    localStorage.setItem('adis_formy_molds', JSON.stringify(molds));
  }, [molds]);

  useEffect(() => {
    localStorage.setItem('adis_formy_logs', JSON.stringify(logs));
  }, [logs]);

  // Helper to append log
  const addAuditLog = (
    action: UserLog['action'],
    moldCode: string,
    moldName: string,
    details: string,
    user: string = 'Мастер цеха'
  ) => {
    const newLog: UserLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      user,
      action,
      moldCode,
      moldName,
      details,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Handlers
  const handleSaveMold = (savedMold: PressMold) => {
    const exists = molds.some((m) => m.id === savedMold.id);
    if (exists) {
      setMolds((prev) => prev.map((m) => (m.id === savedMold.id ? savedMold : m)));
      addAuditLog('edit', savedMold.code, savedMold.name, `Обновлены характеристики пресс-формы`);
    } else {
      setMolds((prev) => [savedMold, ...prev]);
      addAuditLog('edit', savedMold.code, savedMold.name, `Создана новая пресс-форма в реестре`);
    }
  };

  const handleAddNote = (moldId: string, noteText: string) => {
    const target = molds.find((m) => m.id === moldId);
    if (!target) return;

    const updatedMold: PressMold = {
      ...target,
      notes: [noteText, ...target.notes],
    };

    setMolds((prev) => prev.map((m) => (m.id === moldId ? updatedMold : m)));
    addAuditLog('add_note', target.code, target.name, `Добавлена заметка: "${noteText}"`);
  };

  const handleDeleteToTrash = (mold: PressMold) => {
    const updatedMold: PressMold = {
      ...mold,
      inTrash: true,
      deletedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setMolds((prev) => prev.map((m) => (m.id === mold.id ? updatedMold : m)));
    addAuditLog('move_trash', mold.code, mold.name, `Форма перемещена в корзину`);
  };

  const handleRestoreFromTrash = (mold: PressMold) => {
    const updatedMold: PressMold = {
      ...mold,
      inTrash: false,
      deletedAt: undefined,
    };
    setMolds((prev) => prev.map((m) => (m.id === mold.id ? updatedMold : m)));
    addAuditLog('restore', mold.code, mold.name, `Форма восстановлена из корзины в активный реестр`);
  };

  const handleScannedMold = (scannedMoldData: Partial<PressMold>) => {
    const newMold: PressMold = {
      id: `mold-scan-${Date.now()}`,
      code: scannedMoldData.code || 'PF-2026-SCAN',
      name: scannedMoldData.name || 'Сканированная пресс-форма',
      shop: scannedMoldData.shop || 'Цех №1 (Штамповка)',
      pressType: scannedMoldData.pressType || 'Пресс ПА-400Т',
      dimensions: scannedMoldData.dimensions || '800 × 600 × 400 мм',
      weightKg: scannedMoldData.weightKg || 1000,
      status: 'in_work',
      cyclesCount: 0,
      maxCycles: 50000,
      lastServicedAt: new Date().toISOString().split('T')[0],
      serialNumber: scannedMoldData.serialNumber || 'SN-AUTO',
      notes: scannedMoldData.notes || ['Создано через Gemini Vision AI'],
      inTrash: false,
      createdDate: new Date().toISOString().split('T')[0],
      navodkaTitle: `Návodka #${scannedMoldData.code || 'SCAN'}: Карточка формы.pdf`,
    };

    setMolds((prev) => [newMold, ...prev]);
    addAuditLog('scan_ocr', newMold.code, newMold.name, `Распознана бирка и создана форма через Gemini Vision AI`, 'Оператор OCR / Gemini AI');
    setActiveTab('database');
  };

  const trashCount = molds.filter((m) => m.inTrash).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Sticky Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        onOpenScanner={() => setIsScannerOpen(true)}
        trashCount={trashCount}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'search' && (
          <SearchTab
            molds={molds}
            onSelectMold={(m) => setSelectedMold(m)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenPdf={(m) => setPdfMold(m)}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseTab
            molds={molds}
            onAddMold={() => {
              setTargetMoldForModal(null);
              setMoldModalMode('create');
            }}
            onAddNote={(m) => {
              setTargetMoldForModal(m);
              setMoldModalMode('note');
            }}
            onEdit={(m) => {
              setTargetMoldForModal(m);
              setMoldModalMode('edit');
            }}
            onDeleteToTrash={handleDeleteToTrash}
            onRestoreFromTrash={handleRestoreFromTrash}
            onOpenPdf={(m) => setPdfMold(m)}
            onViewDetails={(m) => setSelectedMold(m)}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            molds={molds}
            logs={logs}
            systemStatus={systemStatus}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div>Adis Formy v2.4 | Единый модуль учета пресс-форм завода | GitHub Main Single Source of Truth</div>
      </footer>

      {/* Modals */}
      {pdfMold && (
        <PdfViewerModal mold={pdfMold} onClose={() => setPdfMold(null)} />
      )}

      {isScannerOpen && (
        <ScannerModal
          onClose={() => setIsScannerOpen(false)}
          onMoldScanned={handleScannedMold}
        />
      )}

      {selectedMold && (
        <MoldDetailModal
          mold={selectedMold}
          onClose={() => setSelectedMold(null)}
          onOpenPdf={(m) => setPdfMold(m)}
          onAddNote={(m) => {
            setSelectedMold(null);
            setTargetMoldForModal(m);
            setMoldModalMode('note');
          }}
          onEdit={(m) => {
            setSelectedMold(null);
            setTargetMoldForModal(m);
            setMoldModalMode('edit');
          }}
          onDeleteToTrash={handleDeleteToTrash}
          onRestoreFromTrash={handleRestoreFromTrash}
        />
      )}

      {moldModalMode && (
        <MoldModal
          mold={targetMoldForModal}
          mode={moldModalMode}
          onClose={() => {
            setMoldModalMode(null);
            setTargetMoldForModal(null);
          }}
          onSave={handleSaveMold}
          onAddNote={handleAddNote}
        />
      )}

    </div>
  );
}
