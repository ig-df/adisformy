import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileCode,
  FileSpreadsheet,
  Mail,
  Clock,
  Check,
  RotateCcw,
  Upload,
  Smartphone,
  Monitor,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Mold, MoldComment, MoldLog, Customer, ActiveSession } from '../types';
import {
  PALETTE_COLORS,
  POSSIBLE_POSITIONS,
  autoDotPosition,
  triggerHaptic,
  EMAIL_REGEX,
  sanitizeFileName,
  supabase
} from '../lib/supabase';

// ----------------------------------------------------
// Base Modal Wrapper
// ----------------------------------------------------
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxWidth} bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200`}
      >
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3.5 text-sm">
          {children}
        </div>

        {footer && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Position Autocomplete Input
// ----------------------------------------------------
export const PositionInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "např. 12A z. nebo Mezisklad" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const filtered = value.trim()
    ? POSSIBLE_POSITIONS.filter(p => p.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 35)
    : [];

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white font-mono text-sm"
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-30 max-h-48 overflow-y-auto bg-white border border-blue-500 rounded-b-lg shadow-xl divide-y divide-slate-100">
            {filtered.map(pos => (
              <div
                key={pos}
                onClick={() => {
                  onChange(pos);
                  setIsOpen(false);
                }}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer font-mono text-xs text-slate-800"
              >
                {pos}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ----------------------------------------------------
// Login Modal
// ----------------------------------------------------
export const LoginModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLogin: (name: string, isSuper: boolean) => void;
}> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const u = username.trim();
    if (!u) {
      alert("Zadejte vaše jméno nebo směnu!");
      return;
    }
    if (password === 'adisadmin') {
      onLogin(u, true);
      onClose();
    } else if (password === 'adisadis') {
      onLogin(u, false);
      onClose();
    } else {
      alert("Nesprávné heslo!");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Přihlášení uživatele" maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Vaše jméno nebo směna:
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="např. Směna A / Jan"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Heslo:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
          />
        </div>
        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Zrušit
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            Přihlásit se
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ----------------------------------------------------
// Position Quick Edit Modal
// ----------------------------------------------------
export const PositionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  moldId: string;
  currentPos: string;
  onSave: (moldId: string, newPos: string) => void;
}> = ({ isOpen, onClose, moldId, currentPos, onSave }) => {
  const [pos, setPos] = useState(currentPos);

  React.useEffect(() => {
    setPos(currentPos);
  }, [currentPos, isOpen]);

  const handleSave = () => {
    const formatted = autoDotPosition(pos);
    if (!formatted) {
      alert("Zadejte pozici!");
      return;
    }
    onSave(moldId, formatted);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Změnit pozici: Forma ${moldId}`}
      maxWidth="max-w-sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Zrušit
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Uložit
          </button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Nová pozice (stávající: {currentPos}):
        </label>
        <PositionInput value={pos} onChange={setPos} />
      </div>
    </Modal>
  );
};

// ----------------------------------------------------
// Customer Select Modal
// ----------------------------------------------------
export const CustomerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  moldId: string;
  currentCustomer: string;
  customers: Customer[];
  onSave: (moldId: string, newCust: string) => void;
}> = ({ isOpen, onClose, moldId, currentCustomer, customers, onSave }) => {
  const [cust, setCust] = useState(currentCustomer);

  React.useEffect(() => {
    setCust(currentCustomer);
  }, [currentCustomer, isOpen]);

  const handleSave = () => {
    onSave(moldId, cust);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Změnit zákazníka: Forma ${moldId}`}
      maxWidth="max-w-sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Zrušit
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Uložit
          </button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Vyberte zákazníka:
        </label>
        <select
          value={cust}
          onChange={(e) => setCust(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white text-sm"
        >
          {customers.map(c => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>
    </Modal>
  );
};

// ----------------------------------------------------
// Full Edit Modal
// ----------------------------------------------------
export const FullEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  moldId: string;
  currentPos: string;
  currentStatus: string;
  onSave: (moldId: string, newPos: string, newStatus: string, autoMezisklad: boolean) => void;
}> = ({ isOpen, onClose, moldId, currentPos, currentStatus, onSave }) => {
  const [pos, setPos] = useState(currentPos);
  const [status, setStatus] = useState(currentStatus);
  const [autoMezisklad, setAutoMezisklad] = useState(
    ['Ve frontě na údržbu', 'Ve frontě na opravu', 'Na údržbě / Na opravě', 'Na opravě pryč'].includes(currentStatus)
  );

  React.useEffect(() => {
    setPos(currentPos);
    setStatus(currentStatus);
    setAutoMezisklad(
      ['Ve frontě na údržbu', 'Ve frontě na opravu', 'Na údržbě / Na opravě', 'Na opravě pryč'].includes(currentStatus)
    );
  }, [currentPos, currentStatus, isOpen]);

  const handleStatusChange = (newStat: string) => {
    setStatus(newStat);
    if (['Ve frontě na údržbu', 'Ve frontě na opravu', 'Na údržbě / Na opravě', 'Na opravě pryč'].includes(newStat)) {
      setAutoMezisklad(true);
    }
  };

  const handleSave = () => {
    const formatted = autoDotPosition(pos);
    onSave(moldId, formatted, status, autoMezisklad);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upravit formu: ${moldId}`}
      maxWidth="max-w-sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Zrušit
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Uložit
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Pozice:
          </label>
          <PositionInput value={pos} onChange={setPos} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Stav formy:
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white text-sm"
          >
            <option value="">(Bez stavu)</option>
            <option value="Po údržbě">Po údržbě</option>
            <option value="Ve frontě na údržbu">Ve frontě na údržbu</option>
            <option value="Ve frontě na opravu">Ve frontě na opravu</option>
            <option value="Na údržbě / Na opravě">Na údržbě / Na opravě</option>
            <option value="Na opravě pryč">Na opravě pryč</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="chkAutoMezisklad"
            checked={autoMezisklad}
            onChange={(e) => setAutoMezisklad(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
          />
          <label htmlFor="chkAutoMezisklad" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
            Přesunout na Mezisklad
          </label>
        </div>
      </div>
    </Modal>
  );
};

// ----------------------------------------------------
// Comment Add Modal
// ----------------------------------------------------
export const CommentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  moldId: string;
  onAddComment: (moldId: string, text: string) => void;
}> = ({ isOpen, onClose, moldId, onAddComment }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) {
      alert("Zadejte text poznámky!");
      return;
    }
    onAddComment(moldId, text.trim());
    setText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Přidat poznámku k formě ${moldId}`}
      maxWidth="max-w-md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Přidat poznámku
          </button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Poznámka / Důležitá informace:
        </label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Popište zjištěný stav, číslo dílu, nebo informaci pro údržbu..."
          className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm"
          autoFocus
        />
      </div>
    </Modal>
  );
};

// ----------------------------------------------------
// View Comment Modal
// ----------------------------------------------------
export const ViewCommentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  comment: MoldComment | null;
  onDelete: (commentId: string | number) => void;
  onOpenPhoto: (url: string, title: string) => void;
}> = ({ isOpen, onClose, comment, onDelete, onOpenPhoto }) => {
  if (!comment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail poznámky — Forma ${comment.mold_id}`}
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-between items-center w-full">
          <button
            onClick={() => {
              if (confirm("Opravdu smazat tuto poznámku?")) {
                onDelete(comment.id);
                onClose();
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Smazat poznámku
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Zavřít
          </button>
        </div>
      }
    >
      <div className="space-y-2.5">
        <div className="text-xs text-slate-500 font-medium">
          Autor: <strong className="text-slate-700">{comment.user_name || 'Neznámý'}</strong> |{' '}
          {new Date(comment.created_at).toLocaleString('cs-CZ')}
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 whitespace-pre-wrap">
          {comment.comment}
        </div>

        {comment.photo_urls && comment.photo_urls.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Fotografie závady ({comment.photo_urls.length}):
            </label>
            <div className="flex flex-wrap gap-2">
              {comment.photo_urls.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenPhoto(url, `Závada ${comment.mold_id} (${idx + 1})`)}
                  className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:scale-105 transition"
                >
                  <img src={url} alt="Foto závady" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ----------------------------------------------------
// Direct Production Quick Move Modal (Forma po výrobě)
// ----------------------------------------------------
export const DirectProdModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onExecute: (
    moldId: string,
    status: string,
    comment: string,
    photos: File[]
  ) => Promise<void>;
}> = ({ isOpen, onClose, onExecute }) => {
  const [moldId, setMoldId] = useState('');
  const [status, setStatus] = useState('Ve frontě na údržbu');
  const [comment, setComment] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    const added = files.slice(0, 2 - pendingPhotos.length);
    if (added.length < files.length) {
      alert("Maximálně 2 fotografie závady!");
    }
    const newPreviews = added.map((f: File) => URL.createObjectURL(f));
    setPendingPhotos(prev => [...prev, ...added]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setPendingPhotos(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!moldId.trim()) {
      alert("Zadejte číslo formy!");
      return;
    }
    setIsSubmitting(true);
    try {
      await onExecute(moldId.trim(), status, comment.trim(), pendingPhotos);
      setMoldId('');
      setComment('');
      setPendingPhotos([]);
      setPreviews([]);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Chyba při přesunu formy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Forma po výrobě (Mezisklad)"
      maxWidth="max-w-md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            {isSubmitting ? "Odesílání..." : "Odeslat do meziskladu"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Číslo formy:
          </label>
          <input
            type="text"
            value={moldId}
            onChange={(e) => setMoldId(e.target.value)}
            placeholder="např. 145"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Požadovaný stav:
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white text-sm"
          >
            <option value="Ve frontě na údržbu">Ve frontě na údržbu (Mezisklad)</option>
            <option value="Ve frontě na opravu">Ve frontě na opravu (Mezisklad)</option>
            <option value="Na opravě pryč">Na opravě pryč (Mezisklad Externí)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Poznámka / Problémy (nepovinné):
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Popište vzniklý problém nebo závadu..."
            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Fotografie závady (max 2 fotky):
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {previews.map((preview, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500">
                <img src={preview} alt="Foto" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black text-xs"
                >
                  &times;
                </button>
              </div>
            ))}

            {pendingPhotos.length < 2 && (
              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 bg-slate-50">
                <Plus className="w-5 h-5 text-slate-400" />
                <span className="text-[10px] text-slate-500 font-medium">+ Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ----------------------------------------------------
// Add Mold Modal
// ----------------------------------------------------
export const AddModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onAdd: (
    id: string,
    prodName: string,
    customer: string,
    position: string,
    status: string
  ) => void;
}> = ({ isOpen, onClose, customers, onAdd }) => {
  const [id, setId] = useState('');
  const [prodName, setProdName] = useState('');
  const [customer, setCustomer] = useState(customers[0]?.name || 'Others');
  const [position, setPosition] = useState('Mezisklad');
  const [status, setStatus] = useState('');

  const handleSubmit = () => {
    if (!id.trim() || !position.trim()) {
      alert("Vyplňte číslo formy a pozici!");
      return;
    }
    onAdd(id.trim(), prodName.trim(), customer, autoDotPosition(position), status);
    setId('');
    setProdName('');
    setPosition('Mezisklad');
    setStatus('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Přidat novou formu"
      maxWidth="max-w-md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            Přidat formu
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Číslo formy (ID):
          </label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="např. 145"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Název výroby / dílu:
          </label>
          <input
            type="text"
            value={prodName}
            onChange={(e) => setProdName(e.target.value)}
            placeholder="např. Kryt motoru"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Zákazník:
          </label>
          <select
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white text-sm"
          >
            {customers.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Pozice:
          </label>
          <PositionInput value={position} onChange={setPosition} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Stav formy:
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white text-sm"
          >
            <option value="">(Bez stavu)</option>
            <option value="Po údržbě">Po údržbě</option>
            <option value="Ve frontě na údržbu">Ve frontě na údržbu</option>
            <option value="Ve frontě na opravu">Ve frontě na opravu</option>
            <option value="Na údržbě / Na opravě">Na údržbě / Na opravě</option>
            <option value="Na opravě pryč">Na opravě pryč</option>
          </select>
        </div>
      </div>
    </Modal>
  );
};

// ----------------------------------------------------
// History Logs Modal
// ----------------------------------------------------
export const LogsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  logs: MoldLog[];
  isSuperUser: boolean;
  onClearLogs: () => void;
}> = ({ isOpen, onClose, logs, isSuperUser, onClearLogs }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historie změn"
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-between items-center w-full">
          {isSuperUser && (
            <button
              onClick={() => {
                if (confirm("Opravdu vyčistit celou historii?")) onClearLogs();
              }}
              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-semibold"
            >
              Vyčistit historii
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Zavřít
          </button>
        </div>
      }
    >
      {logs.length === 0 ? (
        <div className="text-center py-8 text-slate-400">Zatím žádná historie</div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="py-2.5 space-y-0.5 text-xs">
              <div className="text-slate-800">
                Forma <strong className="text-slate-900">{log.mold_id}</strong>:{' '}
                <span className="line-through opacity-60">{log.old_position || '—'}</span> &rarr;{' '}
                <strong className="text-blue-600">{log.new_position}</strong>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>{log.user_name || 'Neznámý'}</span>
                <span>{new Date(log.created_at).toLocaleString('cs-CZ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

// ----------------------------------------------------
// Trash Modal
// ----------------------------------------------------
export const TrashModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  deletedMolds: Mold[];
  onRestore: (moldId: string) => void;
  onEmptyTrash: () => void;
}> = ({ isOpen, onClose, deletedMolds, onRestore, onEmptyTrash }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Koš (Smazané formy)"
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-between items-center w-full">
          <button
            onClick={() => {
              if (confirm(`Opravdu trvale smazat ${deletedMolds.length} forem z koše?`)) {
                onEmptyTrash();
              }
            }}
            disabled={deletedMolds.length === 0}
            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-semibold disabled:opacity-40"
          >
            Vyčistit koš
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Zavřít
          </button>
        </div>
      }
    >
      {deletedMolds.length === 0 ? (
        <div className="text-center py-8 text-slate-400">Koš je prázdný</div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
          {deletedMolds.map(mold => (
            <div key={mold.id} className="py-2.5 flex justify-between items-center text-xs">
              <div>
                <strong>Forma {mold.id}</strong> ({mold.customer}, {mold.position})
              </div>
              <button
                onClick={() => onRestore(mold.id)}
                className="px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Obnovit
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

// ----------------------------------------------------
// Customer Add / Edit Color Modals
// ----------------------------------------------------
export const AddCustomerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, bg: string) => void;
}> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#ffffff');

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Zadejte název zákazníka!");
      return;
    }
    onAdd(name.trim(), color);
    setName('');
    setColor('#ffffff');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Přidat nového zákazníka"
      maxWidth="max-w-xs"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Přidat
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Název zákazníka:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Vybrat barvu štítku:
          </label>
          <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50">
            {PALETTE_COLORS.map(c => (
              <div
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`h-7 rounded border cursor-pointer transition ${
                  color === c ? 'ring-2 ring-blue-600 scale-105 border-slate-900' : 'border-slate-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const EditCustomerColorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  initialColor: string;
  onSave: (customerName: string, newColor: string) => void;
}> = ({ isOpen, onClose, customerName, initialColor, onSave }) => {
  const [color, setColor] = useState(initialColor);

  React.useEffect(() => {
    setColor(initialColor);
  }, [initialColor, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Změnit barvu: ${customerName}`}
      maxWidth="max-w-xs"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Zrušit
          </button>
          <button
            onClick={() => {
              onSave(customerName, color);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Uložit
          </button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Vyberte barvu štítku:
        </label>
        <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50">
          {PALETTE_COLORS.map(c => (
            <div
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`h-7 rounded border cursor-pointer transition ${
                color === c ? 'ring-2 ring-blue-600 scale-105 border-slate-900' : 'border-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};

// ----------------------------------------------------
// Photo Preview & PDF Preview Modals
// ----------------------------------------------------
export const PhotoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}> = ({ isOpen, onClose, url, title }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-lg">
      <div className="flex justify-center items-center p-2 bg-slate-950/5 rounded-lg">
        <img src={url} alt={title} className="max-h-[60vh] max-w-full object-contain rounded-md" />
      </div>
    </Modal>
  );
};

export const PdfModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}> = ({ isOpen, onClose, url, title }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-4xl">
      <div className="w-full h-[70vh] rounded-lg overflow-hidden border border-slate-200">
        <iframe src={url} title={title} className="w-full h-full border-none" />
      </div>
    </Modal>
  );
};

// ----------------------------------------------------
// Helios Superuser Panel Modal
// ----------------------------------------------------
export const HeliosAdminModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  molds: Mold[];
  comments: MoldComment[];
  onInstantSend: (emails: string[], formats: { sql: boolean; csv: boolean }) => void;
  onSaveAutoSettings: (
    emails: string[],
    formats: { sql: boolean; csv: boolean },
    frequency: string,
    time: string
  ) => void;
}> = ({ isOpen, onClose, molds, comments, onInstantSend, onSaveAutoSettings }) => {
  const [openSection, setOpenSection] = useState<'manual' | 'instant' | 'auto' | null>('manual');

  // Instant export state
  const [instSql, setInstSql] = useState(false);
  const [instCsv, setInstCsv] = useState(false);
  const [instEmails, setInstEmails] = useState<string[]>(['']);

  // Auto export state
  const [autoSql, setAutoSql] = useState(false);
  const [autoCsv, setAutoCsv] = useState(false);
  const [autoEmails, setAutoEmails] = useState<string[]>([]);
  const [autoFreq, setAutoFreq] = useState('daily');
  const [autoTime, setAutoTime] = useState('08:00');

  // Load saved settings
  React.useEffect(() => {
    if (isOpen) {
      try {
        const savedInst = localStorage.getItem('adis_inst_emails');
        if (savedInst) setInstEmails(JSON.parse(savedInst));
        const savedAuto = localStorage.getItem('adis_auto_emails');
        if (savedAuto) setAutoEmails(JSON.parse(savedAuto));
        const savedFreq = localStorage.getItem('adis_auto_freq');
        if (savedFreq) setAutoFreq(savedFreq);
        const savedTime = localStorage.getItem('adis_auto_time');
        if (savedTime) setAutoTime(savedTime);
        const savedFormats = localStorage.getItem('adis_auto_formats');
        if (savedFormats) {
          const parsed = JSON.parse(savedFormats);
          setAutoSql(parsed.sql || false);
          setAutoCsv(parsed.csv || false);
        }
      } catch {}
    }
  }, [isOpen]);

  // Manual SQL Export
  const handleExportSql = () => {
    const activeMolds = molds.filter(i => !i.is_deleted);
    const sqlLines = [
      `-- Adis Formy - Export pro Helios`,
      `-- Generováno: ${new Date().toLocaleString()}`,
      `BEGIN TRANSACTION;`,
      ``,
      `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Adis_Form_Integration')`,
      `CREATE TABLE Adis_Form_Integration (`,
      `    FormID NVARCHAR(50),`,
      `    ProductName NVARCHAR(255),`,
      `    Customer NVARCHAR(100),`,
      `    Position NVARCHAR(100),`,
      `    Status NVARCHAR(100),`,
      `    LastComment NVARCHAR(MAX),`,
      `    PhotoLink NVARCHAR(MAX),`,
      `    UpdatedAt DATETIME,`,
      `    PRIMARY KEY (FormID, Position)`,
      `);`,
      ``,
      `DELETE FROM Adis_Form_Integration;`,
      ``
    ];

    const insertedPairs = new Set();

    activeMolds.forEach(i => {
      const formId = String(i.id || '').trim();
      const position = String(i.position || '').trim();
      const pairKey = `${formId}_${position}`;
      if (insertedPairs.has(pairKey)) return;
      insertedPairs.add(pairKey);

      const comms = comments.filter(c => String(c.mold_id) === formId);
      const lastC = (comms.length > 0 && comms[0].comment)
        ? String(comms[0].comment).replace(/'/g, "''").replace(/\r?\n/g, " ")
        : "";

      const allPhotoUrls = [...(i.photo_urls || [])];
      comms.forEach(c => {
        if (c.photo_urls) {
          c.photo_urls.forEach(pUrl => {
            if (pUrl && !allPhotoUrls.includes(pUrl)) allPhotoUrls.push(pUrl);
          });
        }
      });

      const cleanPhotos = allPhotoUrls.join(", ").replace(/'/g, "''");
      const cleanId = formId.replace(/'/g, "''").substring(0, 50);
      const cleanProd = String(i.product_name || '').replace(/'/g, "''").substring(0, 255);
      const cleanCust = String(i.customer || '').replace(/'/g, "''").substring(0, 100);
      const cleanPos = position.replace(/'/g, "''").substring(0, 100);
      const cleanStatus = String(i.status || '').replace(/'/g, "''").substring(0, 100);

      sqlLines.push(`INSERT INTO Adis_Form_Integration (FormID, ProductName, Customer, Position, Status, LastComment, PhotoLink, UpdatedAt)`);
      sqlLines.push(`VALUES (N'${cleanId}', N'${cleanProd}', N'${cleanCust}', N'${cleanPos}', N'${cleanStatus}', N'${lastC}', N'${cleanPhotos}', GETDATE());`);
    });

    sqlLines.push(``);
    sqlLines.push(`COMMIT;`);

    const blob = new Blob([sqlLines.join("\n")], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `helios_sync_${new Date().toISOString().slice(0, 10)}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Manual CSV Export
  const handleExportCsv = () => {
    const activeMolds = molds.filter(i => !i.is_deleted);
    let csv = "\uFEFFID_Formy;Výroba;Zákazník;Pozice;Stav;Poslední_Komentář;Foto;Poslední_Aktualizace\n";
    const nowStr = new Date().toLocaleString('cs-CZ');

    activeMolds.forEach(i => {
      const comms = comments.filter(c => String(c.mold_id) === String(i.id));
      const lastC = (comms.length > 0 && comms[0].comment) ? comms[0].comment : "";
      const photos = (i.photo_urls || []).join(", ");
      csv += `${i.id};${i.product_name || ''};${i.customer};${i.position};${i.status || ''};"${lastC.replace(/"/g, '""')}";"${photos}";"${nowStr}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center font-bold text-xs">
            H
          </span>
          <span>Helios Superuser Panel</span>
        </div>
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-3">
        {/* Section 1: Manual Export */}
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div
            onClick={() => setOpenSection(openSection === 'manual' ? null : 'manual')}
            className="p-3 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition font-semibold text-xs text-slate-800"
          >
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-700" />
              <span>Ruční vývoz dat do Heliosu</span>
            </div>
            <span>{openSection === 'manual' ? '▲' : '▼'}</span>
          </div>

          {openSection === 'manual' && (
            <div className="p-3 space-y-2 border-t border-slate-200">
              <p className="text-[11px] text-slate-500">
                Okamžité stažení souboru se všemi aktuálními formami:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportSql}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition"
                >
                  <img src="/sql.png" alt="SQL" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  SQL pro Helios
                </button>
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Export CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Instant Email */}
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div
            onClick={() => setOpenSection(openSection === 'instant' ? null : 'instant')}
            className="p-3 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition font-semibold text-xs text-slate-800"
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-700" />
              <span>Odeslat na e-mail okamžitě</span>
            </div>
            <span>{openSection === 'instant' ? '▲' : '▼'}</span>
          </div>

          {openSection === 'instant' && (
            <div className="p-3 space-y-2.5 border-t border-slate-200">
              <p className="text-[11px] text-slate-500">Vyberte soubory k odeslání:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInstSql(!instSql)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    instSql ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <img src="/sql.png" alt="SQL" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  SQL pro Helios {instSql && '✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setInstCsv(!instCsv)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    instCsv ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  CSV soubor {instCsv && '✓'}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  E-mailové adresy:
                </label>
                <div className="space-y-1.5">
                  {instEmails.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const copy = [...instEmails];
                          copy[idx] = e.target.value;
                          setInstEmails(copy);
                        }}
                        placeholder="email@firma.cz"
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setInstEmails(prev => prev.filter((_, i) => i !== idx))}
                        className="w-6 h-6 rounded text-red-500 hover:bg-red-50 flex items-center justify-center text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {instEmails.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setInstEmails(prev => [...prev, ''])}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      + Přidat e-mail
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  const valid = instEmails.filter(e => e.trim() && EMAIL_REGEX.test(e.trim()));
                  if (valid.length === 0) {
                    alert("Zadejte platnou e-mailovou adresu!");
                    return;
                  }
                  if (!instSql && !instCsv) {
                    alert("Vyberte alespoň jeden formát (SQL nebo CSV)!");
                    return;
                  }
                  localStorage.setItem('adis_inst_emails', JSON.stringify(valid));
                  onInstantSend(valid, { sql: instSql, csv: instCsv });
                  onClose();
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                Odeslat vybrané na e-mail
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Automatic Schedule */}
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div
            onClick={() => setOpenSection(openSection === 'auto' ? null : 'auto')}
            className="p-3 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition font-semibold text-xs text-slate-800"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <span>Automatické odesílání na e-mail</span>
            </div>
            <span>{openSection === 'auto' ? '▲' : '▼'}</span>
          </div>

          {openSection === 'auto' && (
            <div className="p-3 space-y-2.5 border-t border-slate-200">
              <p className="text-[11px] text-slate-500">Vyberte soubory pro automatický export:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAutoSql(!autoSql)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    autoSql ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <img src="/sql.png" alt="SQL" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  SQL pro Helios {autoSql && '✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setAutoCsv(!autoCsv)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    autoCsv ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  CSV soubor {autoCsv && '✓'}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  E-mailové adresy příjemců:
                </label>
                <div className="space-y-1.5">
                  {autoEmails.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const copy = [...autoEmails];
                          copy[idx] = e.target.value;
                          setAutoEmails(copy);
                        }}
                        placeholder="email@firma.cz"
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setAutoEmails(prev => prev.filter((_, i) => i !== idx))}
                        className="w-6 h-6 rounded text-red-500 hover:bg-red-50 flex items-center justify-center text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {autoEmails.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setAutoEmails(prev => [...prev, ''])}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      + Přidat e-mail
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Frekvence:
                  </label>
                  <select
                    value={autoFreq}
                    onChange={(e) => setAutoFreq(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="daily">Každý den</option>
                    <option value="weekly">Každý týden</option>
                    <option value="monthly">Každý měsíc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Čas:
                  </label>
                  <select
                    value={autoTime}
                    onChange={(e) => setAutoTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="06:00">06:00 (Ráno)</option>
                    <option value="08:00">08:00</option>
                    <option value="12:00">12:00 (Poledne)</option>
                    <option value="16:00">16:00</option>
                    <option value="18:00">18:00 (Večer)</option>
                    <option value="22:00">22:00 (Noc)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  const valid = autoEmails.filter(e => e.trim() && EMAIL_REGEX.test(e.trim()));
                  if (valid.length === 0 && !confirm("Seznam e-mailů je prázdný. Automatické odesílání bude vypnuto. Pokračovat?")) {
                    return;
                  }
                  localStorage.setItem('adis_auto_emails', JSON.stringify(valid));
                  localStorage.setItem('adis_auto_freq', autoFreq);
                  localStorage.setItem('adis_auto_time', autoTime);
                  localStorage.setItem('adis_auto_formats', JSON.stringify({ sql: autoSql, csv: autoCsv }));

                  onSaveAutoSettings(valid, { sql: autoSql, csv: autoCsv }, autoFreq, autoTime);
                  onClose();
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                Uložit nastavení automatického odesílání
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ----------------------------------------------------
// Online Users Popover
// ----------------------------------------------------
export const OnlineUsersPopover: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  sessions: ActiveSession[];
  onRefresh: () => void;
}> = ({ isOpen, onClose, sessions, onRefresh }) => {
  if (!isOpen) return null;

  const now = new Date();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-12 left-3 z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Uživatelé v systému
          </span>
          <button
            onClick={onRefresh}
            className="w-6 h-6 rounded text-slate-500 hover:bg-slate-100 flex items-center justify-center transition"
            title="Obnovit"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1.5 divide-y divide-slate-50">
          {sessions.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">Žádné aktivní relace</div>
          ) : (
            sessions.map((sess, idx) => {
              const lastSeen = new Date(sess.last_seen);
              const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);
              const isOnline = diffMinutes < 30;

              return (
                <div key={idx} className="pt-1.5 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <span>{sess.user_name}</span>
                      {sess.role === 'superuser' && (
                        <span className="text-[10px] text-red-600 font-bold">(Admin)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      {sess.device_type?.toLowerCase().includes('mobil') ? (
                        <Smartphone className="w-3 h-3" />
                      ) : (
                        <Monitor className="w-3 h-3" />
                      )}
                      <span>{sess.device_type || 'PC'}</span>
                    </div>
                  </div>

                  <div>
                    {isOnline ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                        {diffMinutes < 60 ? `${diffMinutes}m` : `${Math.floor(diffMinutes / 60)}h`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
