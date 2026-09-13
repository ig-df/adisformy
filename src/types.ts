export type MoldStatus = 'in_work' | 'maintenance' | 'repair' | 'conserved' | 'scrapped';

export interface PressMold {
  id: string;
  code: string;            // Артикул / Шифр (например PF-2024-88A)
  name: string;            // Наименование (Пресс-форма поддона АКП-400)
  shop: string;            // Цех (Цех №1, Цех №2, Цех №3)
  pressType: string;       // Тип пресса (П-400Т, П-250Т)
  dimensions: string;      // Габариты (мм)
  weightKg: number;        // Масса (кг)
  status: MoldStatus;
  cyclesCount: number;     // Наработка циклов
  maxCycles: number;       // Максимальный ресурс циклов
  lastServicedAt: string;  // Дата последнего ТО
  serialNumber: string;    // Заводской номер
  notes: string[];         // История заметок
  pdfUrl?: string;         // Файл инструкции / Návodka
  navodkaTitle?: string;   // Заголовок технологической карты
  photoUrl?: string;       // Фото детали / формы
  inTrash: boolean;
  deletedAt?: string;
  createdDate: string;
}

export interface UserLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'add_note' | 'edit' | 'move_trash' | 'restore' | 'scan_ocr' | 'status_change' | 'cycles_update' | 'github_sync';
  moldCode: string;
  moldName: string;
  details: string;
}

export type TabType = 'search' | 'database' | 'dashboard';

export interface SystemStatus {
  githubSync: boolean;
  githubLastCommit: string;
  supabaseConnected: boolean;
  supabaseLatencyMs: number;
  geminiMode: 'free' | 'configured' | 'mock';
  hapticEnabled: boolean;
}
