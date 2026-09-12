import React, { useState } from 'react';
import {
  ChevronDown,
  MessageSquare,
  Settings,
  FileText,
  Image as ImageIcon,
  Edit3,
  X,
  Plus,
  Loader2,
  Trash2
} from 'lucide-react';
import { Mold, MoldComment, Customer } from '../types';
import {
  formatPositionDisplay,
  getPositionBadgeClass,
  parseNavodkaItems,
  getTitleFromFilename,
  sanitizeFileName,
  supabase,
  triggerHaptic
} from '../lib/supabase';

interface MoldRowProps {
  mold: Mold;
  comments: MoldComment[];
  customers: Customer[];
  isSuperUser: boolean;
  currentUser: string | null;
  onEditPosition: (moldId: string, currentPos: string) => void;
  onEditCustomer: (moldId: string, currentCust: string) => void;
  onOpenCommentModal: (moldId: string) => void;
  onOpenFullEdit: (moldId: string, currentPos: string, currentStatus: string, currentProdName: string) => void;
  onOpenPhotoModal: (url: string, title: string) => void;
  onOpenPdfModal: (url: string, title: string) => void;
  onOpenViewComment: (comment: MoldComment) => void;
  onCommentRightClick: (e: React.MouseEvent, commentId: string | number) => void;
  onRowRightClick: (e: React.MouseEvent, moldId: string) => void;
  onCustomerRightClick: (e: React.MouseEvent, customerName: string) => void;
  onSaveAccordionChanges: (
    moldId: string,
    newProductName: string,
    newPhotos: string[],
    newNavodkaUrl: string
  ) => Promise<void>;
}

export const MoldRow: React.FC<MoldRowProps> = ({
  mold,
  comments,
  customers,
  isSuperUser,
  currentUser,
  onEditPosition,
  onEditCustomer,
  onOpenCommentModal,
  onOpenFullEdit,
  onOpenPhotoModal,
  onOpenPdfModal,
  onOpenViewComment,
  onCommentRightClick,
  onRowRightClick,
  onCustomerRightClick,
  onSaveAccordionChanges,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingAccordion, setIsEditingAccordion] = useState(false);
  const [productNameInput, setProductNameInput] = useState(mold.product_name || '');
  const [existingPhotos, setExistingPhotos] = useState<string[]>(mold.photo_urls || []);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [pendingPhotoPreviews, setPendingPhotoPreviews] = useState<string[]>([]);
  const [navodkaList, setNavodkaList] = useState(parseNavodkaItems(mold.navodka_url));
  const [pendingNavodkas, setPendingNavodkas] = useState<File[]>([]);
  const [replaceNavodkaMap, setReplaceNavodkaMap] = useState<Record<number, File>>({});
  const [isSaving, setIsSaving] = useState(false);

  const customerObj = customers.find(c => c.name.toLowerCase() === mold.customer.toLowerCase());
  const customerBg = customerObj ? customerObj.bg : '#ffffff';

  // Toggle Accordion
  const handleToggleAccordion = () => {
    triggerHaptic([10]);
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setProductNameInput(mold.product_name || '');
      setExistingPhotos(mold.photo_urls || []);
      setNavodkaList(parseNavodkaItems(mold.navodka_url));
      setPendingPhotos([]);
      setPendingPhotoPreviews([]);
      setPendingNavodkas([]);
      setReplaceNavodkaMap({});
      setIsEditingAccordion(false);
    }
  };

  // Status dot color
  const getStatusDotColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('po údržbě') || s.includes('po udrzbe')) return 'bg-emerald-500';
    if (s.includes('frontě na údržbu') || s.includes('fronte na udrzbe')) return 'bg-orange-500';
    if (s.includes('frontě na opravu') || s.includes('fronte na opravu')) return 'bg-red-500';
    if (s.includes('na opravě pryč') || s.includes('na oprave pryc')) return 'bg-red-500';
    if (s.includes('na údržbě') || s.includes('na udrzbe') || s.includes('opravě')) return 'bg-yellow-400';
    return 'bg-slate-400';
  };

  // Handle Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    const availableSlots = 5 - (existingPhotos.length + pendingPhotos.length);
    const addedFiles = files.slice(0, availableSlots);

    if (addedFiles.length < files.length) {
      alert("Maximálně 5 fotografií pro formu.");
    }

    const previews = addedFiles.map((file: File) => URL.createObjectURL(file));
    setPendingPhotos(prev => [...prev, ...addedFiles]);
    setPendingPhotoPreviews(prev => [...prev, ...previews]);
  };

  const removePendingPhoto = (idx: number) => {
    URL.revokeObjectURL(pendingPhotoPreviews[idx]);
    setPendingPhotos(prev => prev.filter((_, i) => i !== idx));
    setPendingPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingPhoto = (idx: number) => {
    if (!confirm("Smazat tuto fotografii?")) return;
    setExistingPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle Navodka selection
  const handleNavodkaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    setPendingNavodkas(prev => [...prev, ...files]);
  };

  const removePendingNavodka = (idx: number) => {
    setPendingNavodkas(prev => prev.filter((_, i) => i !== idx));
  };

  const handleNavodkaReplace = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setReplaceNavodkaMap(prev => ({ ...prev, [index]: e.target.files![0] }));
  };

  const removeSpecificNavodka = (idx: number) => {
    if (!confirm("Smazat tuto návodku?")) return;
    setNavodkaList(prev => prev.filter((_, i) => i !== idx));
    setReplaceNavodkaMap(prev => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });
  };

  // Save changes
  const handleSaveDetails = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const updatedPhotos = [...existingPhotos];

      // Upload pending photos
      for (const file of pendingPhotos) {
        const cleanOrigName = sanitizeFileName(file.name || "photo.jpg");
        const fileName = `${mold.id}_${Date.now()}_${cleanOrigName}`;
        const { error } = await supabase.storage.from('mold-photos').upload(fileName, file, { upsert: true });
        if (!error) {
          const { data } = supabase.storage.from('mold-photos').getPublicUrl(fileName);
          updatedPhotos.push(data.publicUrl);
        }
      }

      const updatedNavodkas = [...navodkaList];

      // Handle replacements
      for (const [idxStr, fileItem] of Object.entries(replaceNavodkaMap)) {
        const idx = parseInt(idxStr, 10);
        const file = fileItem as File;
        if (updatedNavodkas[idx] && file) {
          const cleanOrigName = sanitizeFileName(file.name || "navodka.pdf");
          const fileName = `navodka_${mold.id}_${Date.now()}_${cleanOrigName}`;
          const { error } = await supabase.storage.from('mold-photos').upload(fileName, file, { upsert: true });
          if (!error) {
            const { data } = supabase.storage.from('mold-photos').getPublicUrl(fileName);
            const title = getTitleFromFilename(file.name, idx + 1);
            updatedNavodkas[idx] = { url: data.publicUrl, title };
          }
        }
      }

      // Handle new navodkas
      for (const file of pendingNavodkas) {
        const cleanOrigName = sanitizeFileName(file.name || "navodka.pdf");
        const fileName = `navodka_${mold.id}_${Date.now()}_${cleanOrigName}`;
        const { error } = await supabase.storage.from('mold-photos').upload(fileName, file, { upsert: true });
        if (!error) {
          const { data } = supabase.storage.from('mold-photos').getPublicUrl(fileName);
          const title = getTitleFromFilename(file.name, updatedNavodkas.length + 1);
          updatedNavodkas.push({ url: data.publicUrl, title });
        }
      }

      const finalNavodkaUrl = updatedNavodkas.length > 0 ? JSON.stringify(updatedNavodkas) : '';

      await onSaveAccordionChanges(
        mold.id,
        productNameInput.trim(),
        updatedPhotos,
        finalNavodkaUrl
      );

      setIsEditingAccordion(false);
      setPendingPhotos([]);
      setPendingPhotoPreviews([]);
      setPendingNavodkas([]);
      setReplaceNavodkaMap({});
    } catch (err) {
      console.error("Save details error:", err);
      alert("Chyba při ukládání detailů.");
    } finally {
      setIsSaving(false);
    }
  };

  const navodkasParsed = parseNavodkaItems(mold.navodka_url);
  const positionBadgeClass = getPositionBadgeClass(mold.position);
  const displayPos = formatPositionDisplay(mold.position);
  const isMezisklad = mold.position.toLowerCase().includes('mezisklad');

  return (
    <>
      <tr
        className="hover:bg-slate-50 transition-colors select-none"
        onContextMenu={(e) => onRowRightClick(e, mold.id)}
      >
        {/* Číslo formy & Výroba */}
        <td className="p-2 sm:p-3 align-top border-b border-slate-200">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleToggleAccordion}
              className={`w-6 h-6 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-transform ${
                isExpanded ? 'rotate-180 bg-slate-700 text-white' : ''
              }`}
              title="Zobrazit detaily formy"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <span
              onClick={handleToggleAccordion}
              className="font-bold text-slate-900 cursor-pointer hover:underline text-sm sm:text-base"
            >
              {mold.id}
            </span>

            {mold.status && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-white border border-slate-200 font-medium">
                <span className={`w-2 h-2 rounded-full ${getStatusDotColor(mold.status)}`} />
                {mold.status}
              </span>
            )}
          </div>

          {mold.product_name && (
            <div className="text-xs text-slate-500 mt-1 capitalize">
              Výroba: {mold.product_name}
            </div>
          )}

          {/* Comments preview */}
          {comments.length > 0 && (
            <div className="mt-2 space-y-1 w-full text-left">
              {comments.map(c => (
                <div
                  key={c.id}
                  onClick={() => onOpenViewComment(c)}
                  onContextMenu={(e) => onCommentRightClick(e, c.id)}
                  className="bg-slate-100/80 hover:bg-slate-200/70 border-l-3 border-slate-300 hover:border-blue-500 rounded p-1.5 text-xs cursor-pointer transition"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                    <span>👤 {c.user_name || 'Neznámý'}</span>
                    <span>{new Date(c.created_at).toLocaleDateString('cs-CZ')}</span>
                  </div>
                  <p className="line-clamp-2 text-slate-800 text-[11px] mt-0.5 whitespace-pre-wrap">
                    {c.comment}
                  </p>
                  {c.photo_urls && c.photo_urls.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold mt-0.5">
                      <ImageIcon className="w-3 h-3" />
                      <span>{c.photo_urls.length} foto závady</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </td>

        {/* Zákazník */}
        <td className="p-2 sm:p-3 align-top border-b border-slate-200 text-center">
          <span
            onClick={() => onEditCustomer(mold.id, mold.customer)}
            onContextMenu={(e) => onCustomerRightClick(e, mold.customer)}
            style={{ backgroundColor: customerBg }}
            className="inline-block px-2 py-1 rounded text-xs font-semibold cursor-pointer border border-slate-300 text-slate-950 transition hover:scale-105"
            title="Klikněte pro změnu zákazníka"
          >
            {mold.customer}
          </span>
        </td>

        {/* Pozice a akce */}
        <td className="p-2 sm:p-3 align-top border-b border-slate-200 text-right">
          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
            <div className="flex flex-col items-end">
              <span
                onClick={() => onEditPosition(mold.id, mold.position)}
                className={`font-mono px-2 py-0.5 rounded text-xs font-bold cursor-pointer hover:scale-105 transition shadow-2xs ${positionBadgeClass}`}
                title="Klikněte pro změnu pozice"
              >
                {displayPos}
              </span>
              {isMezisklad && mold.previous_position && (
                <span className="text-[10px] text-slate-500 italic mt-0.5">
                  (Původně: {mold.previous_position})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onOpenCommentModal(mold.id)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs"
                title="Přidat poznámku"
              >
                <img src="/icon5.png" alt="Poznámka" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              </button>
              <button
                onClick={() => onOpenFullEdit(mold.id, mold.position, mold.status, mold.product_name)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs"
                title="Upravit stav / pozici"
              >
                <img src="/icon1.png" alt="Upravit" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              </button>
            </div>
          </div>
        </td>
      </tr>

      {/* Accordion Detaily / Úprava with smooth grid animation */}
      <tr>
        <td colSpan={3} className="p-0 border-none">
          <div className={`accordion-anim-wrapper ${isExpanded ? 'open' : ''}`}>
            <div className="min-h-0 p-3 sm:p-4 bg-white border-b border-slate-200 shadow-inner space-y-3">
              {!isEditingAccordion ? (
                <>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Detail formy {mold.id}
                    </span>
                    {isSuperUser && (
                      <button
                        onClick={() => setIsEditingAccordion(true)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-xs text-slate-700 font-semibold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <img src="/icon9.png" alt="Upravit" className="w-3.5 h-3.5 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        <span>Upravit</span>
                      </button>
                    )}
                  </div>

                  <div className="text-sm">
                    <strong className="text-slate-700">Výroba: </strong>
                    <span className="text-slate-900 capitalize">
                      {mold.product_name || <span className="text-slate-400 italic">Nezadáno</span>}
                    </span>
                  </div>

                  {/* Návodka */}
                  <div>
                    <div className="text-xs font-semibold text-blue-600 mb-1.5">
                      Návodka k výrobě:
                    </div>
                    {navodkasParsed.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {navodkasParsed.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => onOpenPdfModal(item.url, `${mold.id} — ${item.title}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:border-blue-500 hover:bg-slate-50 transition shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>{item.title}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Není přiložena</span>
                    )}
                  </div>

                  {/* Fotografie */}
                  <div>
                    <div className="text-xs font-semibold text-slate-600 mb-1.5">
                      Fotografie formy ({mold.photo_urls?.length || 0}/5):
                    </div>
                    {mold.photo_urls && mold.photo_urls.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {mold.photo_urls.map((url, idx) => (
                          <div
                            key={idx}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:scale-105 transition"
                            onClick={() => onOpenPhotoModal(url, `Forma ${mold.id} (Foto ${idx + 1})`)}
                          >
                            <img src={url} alt="Forma" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Žádné fotografie</span>
                    )}
                  </div>
                </>
              ) : (
                /* Superuser Edit Mode */
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Úprava formy {mold.id}
                    </span>
                    <button
                      onClick={() => setIsEditingAccordion(false)}
                      className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md bg-white hover:bg-slate-100"
                    >
                      Zrušit
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Název výroby / dílu:
                    </label>
                    <input
                      type="text"
                      value={productNameInput}
                      onChange={(e) => setProductNameInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Návodky v editaci */}
                  <div>
                    <label className="block text-xs font-medium text-blue-600 mb-1">
                      Návodky k výrobě:
                    </label>
                    <div className="space-y-1.5 mb-2">
                      {navodkaList.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs"
                        >
                          <span className="font-semibold truncate max-w-[150px]">{item.title}</span>
                          <div className="flex items-center gap-1.5">
                            {replaceNavodkaMap[idx] ? (
                              <>
                                <span className="text-[11px] text-emerald-600 truncate max-w-[100px]">
                                  {replaceNavodkaMap[idx].name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplaceNavodkaMap(prev => {
                                      const copy = { ...prev };
                                      delete copy[idx];
                                      return copy;
                                    });
                                  }}
                                  className="text-[11px] text-slate-500 hover:text-slate-800"
                                >
                                  Zrušit
                                </button>
                              </>
                            ) : (
                              <label className="px-2 py-0.5 text-[11px] bg-white border border-slate-200 rounded cursor-pointer hover:bg-slate-100">
                                Nahradit
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,image/*"
                                  className="hidden"
                                  onChange={(e) => handleNavodkaReplace(idx, e)}
                                />
                              </label>
                            )}
                            <button
                              type="button"
                              onClick={() => removeSpecificNavodka(idx)}
                              className="px-1.5 py-0.5 text-[11px] bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                            >
                              Smazat
                            </button>
                          </div>
                        </div>
                      ))}

                      {pendingNavodkas.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs"
                        >
                          <span className="font-semibold text-emerald-700 truncate max-w-[180px]">
                            + {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removePendingNavodka(idx)}
                            className="text-[11px] text-red-600 hover:underline"
                          >
                            Zrušit
                          </button>
                        </div>
                      ))}
                    </div>

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 shadow-xs">
                      <Plus className="w-3.5 h-3.5" />
                      Přidat návodku
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        multiple
                        className="hidden"
                        onChange={handleNavodkaSelect}
                      />
                    </label>
                  </div>

                  {/* Fotografie v editaci */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Fotografie ({existingPhotos.length + pendingPhotos.length}/5):
                    </label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {existingPhotos.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                          <img src={url} alt="Foto" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeExistingPhoto(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black text-xs"
                          >
                            &times;
                          </button>
                        </div>
                      ))}

                      {pendingPhotoPreviews.map((preview, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500">
                          <img src={preview} alt="Nové foto" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePendingPhoto(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black text-xs"
                          >
                            &times;
                          </button>
                        </div>
                      ))}

                      {existingPhotos.length + pendingPhotos.length < 5 && (
                        <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 bg-slate-50">
                          <Plus className="w-5 h-5 text-slate-400" />
                          <span className="text-[10px] text-slate-500 font-medium">Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handlePhotoSelect}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveDetails}
                      disabled={isSaving}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Uložit změny
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
};
