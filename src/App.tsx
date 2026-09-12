import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Trash2,
  ArrowDownToDot,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Mold, MoldComment, MoldLog, Customer, ActiveSession, ToastMessage } from './types';
import {
  API_URL,
  API_KEY,
  GOOGLE_SCRIPT_URL,
  DEFAULT_CUSTOMERS,
  BASE_SYSTEM_CUSTOMERS,
  supabase,
  triggerHaptic,
  sanitizeFileName
} from './lib/supabase';
import { Header } from './components/Header';
import { SearchTab } from './components/SearchTab';
import { DatabaseTab } from './components/DatabaseTab';
import { DashboardTab } from './components/DashboardTab';
import {
  LoginModal,
  PositionModal,
  CustomerModal,
  FullEditModal,
  CommentModal,
  ViewCommentModal,
  DirectProdModal,
  AddModal,
  LogsModal,
  TrashModal,
  AddCustomerModal,
  EditCustomerColorModal,
  PhotoModal,
  PdfModal,
  HeliosAdminModal,
  OnlineUsersPopover
} from './components/Modals';

export default function App() {
  // ----------------------------------------------------
  // Core State
  // ----------------------------------------------------
  const [molds, setMolds] = useState<Mold[]>([]);
  const [comments, setComments] = useState<MoldComment[]>([]);
  const [logs, setLogs] = useState<MoldLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>(DEFAULT_CUSTOMERS);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('adis_user_name') || null;
  });
  const [isSuperUser, setIsSuperUser] = useState<boolean>(() => {
    return localStorage.getItem('adis_is_superuser') === 'true';
  });

  // Navigation
  const [activeTab, setActiveTab] = useState<'search' | 'database' | 'dashboard'>('search');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState('ALL');

  // Modals Visibility
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isDirectProdOpen, setIsDirectProdOpen] = useState(false);
  const [isHeliosOpen, setIsHeliosOpen] = useState(false);
  const [isOnlineUsersOpen, setIsOnlineUsersOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Selected item modal states
  const [editingPosition, setEditingPosition] = useState<{ moldId: string; pos: string } | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<{ moldId: string; cust: string } | null>(null);
  const [editingFull, setEditingFull] = useState<{ moldId: string; pos: string; status: string; prodName: string } | null>(null);
  const [commentingMoldId, setCommentingMoldId] = useState<string | null>(null);
  const [viewingComment, setViewingComment] = useState<MoldComment | null>(null);
  const [editingCustomerColor, setEditingCustomerColor] = useState<{ name: string; color: string } | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);
  const [previewPdf, setPreviewPdf] = useState<{ url: string; title: string } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, isError = false) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, isError }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  }, []);

  // ----------------------------------------------------
  // Presence & Online Tracking
  // ----------------------------------------------------
  const pingPresence = useCallback(async () => {
    if (!currentUser) return;
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    try {
      await supabase
        .from('active_sessions')
        .upsert({
          user_name: currentUser.trim(),
          last_seen: new Date().toISOString(),
          device_type: isMobile ? 'Mobile' : 'PC',
          role: isSuperUser ? 'superuser' : 'operator'
        }, { onConflict: 'user_name' });
    } catch (e) {
      console.warn("Presence ping error:", e);
    }
  }, [currentUser, isSuperUser]);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('active_sessions')
        .select('*')
        .order('last_seen', { ascending: false });
      if (data) setActiveSessions(data);
    } catch (e) {
      console.warn("Fetch active sessions error:", e);
    }
  }, []);

  // ----------------------------------------------------
  // Data Fetching
  // ----------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      // Fetch customers
      try {
        const { data: custData } = await supabase.from('customers').select('*');
        if (custData && custData.length > 0) {
          const list = custData.map((c: any) => ({ name: c.name, bg: c.bg_color || '#ffffff' }));
          const others = list.find((c: any) => c.name.toLowerCase() === 'others');
          const listWithoutOthers = list.filter((c: any) => c.name.toLowerCase() !== 'others');
          if (others) listWithoutOthers.push(others);
          else listWithoutOthers.push({ name: "Others", bg: "#fdfbf7" });
          setCustomers(listWithoutOthers);
        }
      } catch (err) {
        console.warn("Fetch customers error:", err);
      }

      // Fetch molds
      const { data: moldsData, error: moldsErr } = await supabase
        .from('molds')
        .select('*');

      if (moldsErr) throw moldsErr;

      if (moldsData) {
        const mapped: Mold[] = moldsData.map((item: any) => {
          let photos: string[] = [];
          if (item.photo_url) {
            try {
              const parsed = JSON.parse(item.photo_url);
              photos = Array.isArray(parsed) ? parsed : [item.photo_url];
            } catch {
              photos = [item.photo_url];
            }
          }
          return {
            id: String(item.id),
            position: item.position || '',
            customer: item.customer || 'Others',
            status: item.status || '',
            is_deleted: Boolean(item.is_deleted),
            product_name: item.product_name || '',
            photo_urls: photos,
            navodka_url: item.navodka_url || '',
            previous_position: item.previous_position || ''
          };
        }).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

        setMolds(mapped);
      }

      // Fetch comments
      try {
        const { data: commsData } = await supabase
          .from('mold_comments')
          .select('*')
          .order('created_at', { ascending: false });

        if (commsData) {
          const mappedComms: MoldComment[] = commsData.map((c: any) => {
            let photos: string[] = [];
            if (c.photo_urls) {
              if (Array.isArray(c.photo_urls)) photos = c.photo_urls;
              else if (typeof c.photo_urls === 'string') {
                try {
                  const parsed = JSON.parse(c.photo_urls);
                  photos = Array.isArray(parsed) ? parsed : [c.photo_urls];
                } catch {
                  photos = [c.photo_urls];
                }
              }
            }
            return {
              id: c.id,
              mold_id: String(c.mold_id),
              user_name: c.user_name,
              comment: c.comment,
              photo_urls: photos,
              created_at: c.created_at
            };
          });
          setComments(mappedComms);
        }
      } catch (e) {
        console.warn("Fetch comments error:", e);
      }

      // Fetch logs
      try {
        const { data: logsData } = await supabase
          .from('mold_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (logsData) setLogs(logsData);
      } catch (e) {
        console.warn("Fetch logs error:", e);
      }

      await fetchActiveSessions();
    } catch (e: any) {
      console.error("Overall fetch error:", e);
      showToast("Chyba při stahování dat z databáze", true);
    } finally {
      setIsLoading(false);
    }
  }, [fetchActiveSessions, showToast]);

  // Initial load and Realtime Subscription
  useEffect(() => {
    fetchData();
    pingPresence();

    const presenceInterval = setInterval(pingPresence, 2 * 60 * 1000);

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'molds' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mold_comments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mold_logs' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions' }, () => fetchActiveSessions())
      .subscribe();

    return () => {
      clearInterval(presenceInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchData, pingPresence, fetchActiveSessions]);

  // Dynamic Auto-Hiding Scrollbar
  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (!document.body.classList.contains('is-scrolling')) {
        document.body.classList.add('is-scrolling');
      }
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 750);
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  // ----------------------------------------------------
  // Auth Handlers
  // ----------------------------------------------------
  const handleLogin = (username: string, superuser: boolean) => {
    setCurrentUser(username);
    setIsSuperUser(superuser);
    localStorage.setItem('adis_user_name', username);
    localStorage.setItem('adis_is_superuser', superuser ? 'true' : 'false');
    showToast(superuser ? `Přihlášen jako Superuser: ${username}` : `Přihlášen: ${username}`);
    pingPresence();

    // Log login
    supabase.from('mold_logs').insert([{
      mold_id: 'SYSTEM',
      old_position: 'Autorizace',
      new_position: superuser ? 'Přihlášení (Superuser)' : 'Přihlášení uživatele',
      user_name: username
    }]).then(() => {});
  };

  const handleLogout = () => {
    triggerHaptic([15]);
    if (confirm(`Chcete se odhlásit z účtu ${currentUser}?`)) {
      setCurrentUser(null);
      setIsSuperUser(false);
      localStorage.removeItem('adis_user_name');
      localStorage.removeItem('adis_is_superuser');
      showToast("Byli jste odhlášen");
    }
  };

  const requireAuth = (): boolean => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return false;
    }
    return true;
  };

  const requireSuperUser = (): boolean => {
    if (!requireAuth()) return false;
    if (!isSuperUser) {
      alert("Tato akce je přístupná pouze pro superuživatele (admin)!");
      return false;
    }
    return true;
  };

  // ----------------------------------------------------
  // Mold Actions
  // ----------------------------------------------------
  // Edit Position
  const handleSavePosition = async (moldId: string, newPos: string) => {
    const mold = molds.find(m => m.id === moldId);
    if (!mold) return;

    const oldPos = mold.position;
    let prevPosToSave = mold.previous_position;
    if (newPos.toLowerCase().includes('mezisklad')) {
      if (!oldPos.toLowerCase().includes('mezisklad')) {
        prevPosToSave = oldPos;
      }
    } else {
      prevPosToSave = '';
    }

    // Optimistic
    setMolds(prev => prev.map(m => m.id === moldId ? { ...m, position: newPos, previous_position: prevPosToSave } : m));
    showToast(`Pozice změněna na ${newPos}`);

    try {
      await Promise.all([
        supabase.from('molds').update({ position: newPos, previous_position: prevPosToSave }).eq('id', moldId),
        supabase.from('mold_logs').insert([{
          mold_id: moldId,
          old_position: `Pozice: ${oldPos}`,
          new_position: `Pozice: ${newPos}`,
          user_name: currentUser || 'Neznámý'
        }])
      ]);
    } catch (e) {
      console.error(e);
      showToast("Chyba při ukládání pozice", true);
    }
  };

  // Change Customer
  const handleSaveCustomer = async (moldId: string, newCust: string) => {
    const mold = molds.find(m => m.id === moldId);
    if (!mold) return;
    const oldCust = mold.customer;

    // Optimistic
    setMolds(prev => prev.map(m => m.id === moldId ? { ...m, customer: newCust } : m));
    showToast(`Zákazník změněn na ${newCust}`);

    try {
      await Promise.all([
        supabase.from('molds').update({ customer: newCust }).eq('id', moldId),
        supabase.from('mold_logs').insert([{
          mold_id: moldId,
          old_position: `Zákazník: ${oldCust}`,
          new_position: `Zákazník: ${newCust}`,
          user_name: currentUser || 'Neznámý'
        }])
      ]);
    } catch (e) {
      console.error(e);
      showToast("Chyba při změně zákazníka", true);
    }
  };

  // Full Edit (Status, Position, autoMezisklad)
  const handleSaveFullEdit = async (
    moldId: string,
    targetPos: string,
    newStatus: string,
    autoMezisklad: boolean
  ) => {
    const mold = molds.find(m => m.id === moldId);
    if (!mold) return;

    let finalPos = targetPos;
    let prevPosToSave = mold.previous_position;
    const isRepairStatus = ['Ve frontě na údržbu', 'Ve frontě na opravu', 'Na údržbě / Na opravě', 'Na opravě pryč'].includes(newStatus);

    if (!isRepairStatus && !autoMezisklad) {
      if (mold.previous_position && mold.previous_position.trim() !== '') {
        finalPos = mold.previous_position;
        prevPosToSave = '';
      }
    } else if (autoMezisklad) {
      if (mold.position && !mold.position.toLowerCase().includes('mezisklad')) {
        prevPosToSave = mold.position;
      }
      finalPos = newStatus === 'Na opravě pryč' ? 'Mezisklad Externí' : 'Mezisklad';
    }

    setMolds(prev => prev.map(m => m.id === moldId ? {
      ...m,
      position: finalPos,
      status: newStatus,
      previous_position: prevPosToSave
    } : m));

    showToast(`Forma ${moldId} byla upravena`);

    try {
      await Promise.all([
        supabase.from('molds').update({
          position: finalPos,
          status: newStatus,
          previous_position: prevPosToSave
        }).eq('id', moldId),
        supabase.from('mold_logs').insert([{
          mold_id: moldId,
          old_position: `Původně: ${mold.position}`,
          new_position: `Pozice: ${finalPos}, Stav: ${newStatus || 'žádný'}`,
          user_name: currentUser || 'Neznámý'
        }])
      ]);
    } catch (e) {
      console.error(e);
      showToast("Chyba při úpravě formy", true);
    }
  };

  // Add Comment
  const handleAddComment = async (moldId: string, text: string) => {
    try {
      const { data, error } = await supabase.from('mold_comments').insert([{
        mold_id: moldId,
        user_name: currentUser || 'Neznámý',
        comment: text,
        photo_urls: "[]"
      }]).select('*');

      if (error) throw error;
      if (data && data[0]) {
        setComments(prev => [data[0], ...prev]);
        showToast(`Poznámka přidána k formě ${moldId}`);
      }
    } catch (e) {
      console.error(e);
      showToast("Chyba při přidávání poznámky", true);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string | number) => {
    if (!requireAuth()) return;
    try {
      await supabase.from('mold_comments').delete().eq('id', commentId);
      setComments(prev => prev.filter(c => String(c.id) !== String(commentId)));
      showToast("Poznámka byla smazána");
    } catch (e) {
      console.error(e);
      showToast("Chyba při mazání poznámky", true);
    }
  };

  // Direct Production Move (Forma po výrobě)
  const handleDirectProdMove = async (
    moldId: string,
    status: string,
    commentText: string,
    photos: File[]
  ) => {
    const existing = molds.find(m => m.id === moldId);
    const oldPos = existing ? existing.position : 'Neznámá';
    const targetPos = status === 'Na opravě pryč' ? 'Mezisklad Externí' : 'Mezisklad';

    let prevPosToSave = existing ? existing.previous_position : '';
    if (oldPos && !oldPos.toLowerCase().includes('mezisklad')) {
      prevPosToSave = oldPos;
    }

    // Upload defect photos if any
    const uploadedPhotos: string[] = [];
    for (const file of photos) {
      const cleanName = sanitizeFileName(file.name || 'defect.jpg');
      const fileName = `defect_${moldId}_${Date.now()}_${cleanName}`;
      const { error } = await supabase.storage.from('mold-photos').upload(fileName, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('mold-photos').getPublicUrl(fileName);
        uploadedPhotos.push(data.publicUrl);
      }
    }

    // Optimistic update
    setMolds(prev => prev.map(m => m.id === moldId ? {
      ...m,
      position: targetPos,
      status: status,
      previous_position: prevPosToSave
    } : m));

    showToast(`Forma ${moldId} přesunuta na ${targetPos}`);

    try {
      await Promise.all([
        supabase.from('molds').update({
          position: targetPos,
          status: status,
          previous_position: prevPosToSave
        }).eq('id', moldId),
        supabase.from('mold_logs').insert([{
          mold_id: moldId,
          old_position: `Pozice: ${oldPos}`,
          new_position: `Pozice: ${targetPos}, Stav: ${status}`,
          user_name: currentUser || 'Neznámý'
        }])
      ]);

      if (commentText || uploadedPhotos.length > 0) {
        const { data: newComm } = await supabase.from('mold_comments').insert([{
          mold_id: moldId,
          user_name: currentUser || 'Neznámý',
          comment: commentText || 'Odesláno z výroby',
          photo_urls: JSON.stringify(uploadedPhotos)
        }]).select('*');

        if (newComm && newComm[0]) {
          setComments(prev => [{
            ...newComm[0],
            photo_urls: uploadedPhotos
          }, ...prev]);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Chyba při přesunu formy", true);
    }
  };

  // Add Mold
  const handleAddNewMold = async (
    id: string,
    prodName: string,
    customer: string,
    position: string,
    status: string
  ) => {
    if (molds.some(m => m.id === id)) {
      alert(`Forma s číslem ${id} již existuje!`);
      return;
    }

    const newMold: Mold = {
      id,
      product_name: prodName,
      customer,
      position,
      status,
      is_deleted: false,
      photo_urls: [],
      navodka_url: '',
      previous_position: ''
    };

    setMolds(prev => [...prev, newMold].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })));
    showToast(`Forma ${id} byla vytvořena`);

    try {
      await Promise.all([
        supabase.from('molds').insert([{
          id,
          product_name: prodName,
          customer,
          position,
          status,
          is_deleted: false,
          navodka_url: '',
          previous_position: ''
        }]),
        supabase.from('mold_logs').insert([{
          mold_id: id,
          old_position: 'Nová forma',
          new_position: position,
          user_name: currentUser || 'Neznámý'
        }])
      ]);
    } catch (e) {
      console.error(e);
      showToast("Chyba při ukládání formy", true);
    }
  };

  // Save Accordion Changes (product name, návodka, photos)
  const handleSaveAccordionChanges = async (
    moldId: string,
    newProductName: string,
    newPhotos: string[],
    newNavodkaUrl: string
  ) => {
    setMolds(prev => prev.map(m => m.id === moldId ? {
      ...m,
      product_name: newProductName,
      photo_urls: newPhotos,
      navodka_url: newNavodkaUrl
    } : m));

    showToast(`Detail formy ${moldId} byl uložen`);

    try {
      await Promise.all([
        supabase.from('molds').update({
          product_name: newProductName,
          photo_url: JSON.stringify(newPhotos),
          navodka_url: newNavodkaUrl
        }).eq('id', moldId),
        supabase.from('mold_logs').insert([{
          mold_id: moldId,
          old_position: 'Detail formy',
          new_position: 'Aktualizace návodky / foto',
          user_name: currentUser || 'Neznámý'
        }])
      ]);
    } catch (e) {
      console.error(e);
      showToast("Chyba při ukládání detailů", true);
    }
  };

  // Soft Delete to Trash
  const handleSoftDelete = async (moldId: string) => {
    if (!requireAuth()) return;
    if (!confirm(`Opravdu přesunout formu ${moldId} do koše?`)) return;

    setMolds(prev => prev.map(m => m.id === moldId ? { ...m, is_deleted: true } : m));
    showToast(`Forma ${moldId} přesunuta do koše`);

    try {
      await Promise.all([
        supabase.from('molds').update({ is_deleted: true }).eq('id', moldId),
        supabase.from('mold_logs').insert([{
          mold_id: moldId,
          old_position: 'Aktivní',
          new_position: 'Koš',
          user_name: currentUser || 'Neznámý'
        }])
      ]);
    } catch (e) {
      console.error(e);
      showToast("Chyba při přesunu do koše", true);
    }
  };

  // Restore from Trash
  const handleRestoreMold = async (moldId: string) => {
    setMolds(prev => prev.map(m => m.id === moldId ? { ...m, is_deleted: false } : m));
    showToast(`Forma ${moldId} byla obnovena`);

    try {
      await Promise.all([
        supabase.from('molds').update({ is_deleted: false }).eq('id', moldId),
        supabase.from('mold_logs').insert([{
          mold_id: moldId,
          old_position: 'Koš',
          new_position: 'Obnovena',
          user_name: currentUser || 'Neznámý'
        }])
      ]);
    } catch (e) {
      console.error(e);
      showToast("Chyba při obnovení formy", true);
    }
  };

  // Empty Trash
  const handleEmptyTrash = async () => {
    try {
      await supabase.from('molds').delete().eq('is_deleted', true);
      setMolds(prev => prev.filter(m => !m.is_deleted));
      setIsTrashOpen(false);
      showToast("Koš byl vyčištěn");

      await supabase.from('mold_logs').insert([{
        mold_id: 'SYSTEM',
        old_position: 'Koš',
        new_position: 'Trvale vyčištěn',
        user_name: currentUser || 'Neznámý'
      }]);
    } catch (e) {
      console.error(e);
      showToast("Chyba při vysypávání koše", true);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    try {
      await supabase.from('mold_logs').delete().neq('mold_id', 'NULL_VAL');
      setLogs([]);
      setIsLogsOpen(false);
      showToast("Historie byla vyčištěna");
    } catch (e) {
      console.error(e);
      showToast("Chyba při čištění historie", true);
    }
  };

  // Add Customer
  const handleAddCustomer = async (name: string, bg: string) => {
    if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert("Tento zákazník již existuje!");
      return;
    }
    const updated = [...customers];
    const othersIdx = updated.findIndex(c => c.name.toLowerCase() === 'others');
    if (othersIdx !== -1) updated.splice(othersIdx, 0, { name, bg });
    else updated.push({ name, bg });

    setCustomers(updated);
    showToast(`Zákazník ${name} byl přidán`);

    try {
      await supabase.from('customers').insert([{
        name,
        bg_color: bg,
        text_color: '#000000',
        border_color: '#cbd5e1'
      }]);
    } catch (e) {
      console.error(e);
    }
  };

  // Edit Customer Color
  const handleEditCustomerColor = async (customerName: string, newBg: string) => {
    setCustomers(prev => prev.map(c => c.name === customerName ? { ...c, bg: newBg } : c));
    showToast(`Barva zákazníka ${customerName} byla změněna`);

    try {
      await supabase.from('customers').update({ bg_color: newBg }).eq('name', customerName);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (customerName: string) => {
    if (!requireAuth()) return;
    if (BASE_SYSTEM_CUSTOMERS.includes(customerName)) {
      alert("Výchozího zákazníka nelze smazat!");
      return;
    }
    if (!confirm(`Opravdu smazat zákazníka ${customerName}?`)) return;

    setCustomers(prev => prev.filter(c => c.name !== customerName));
    if (customerFilter === customerName) setCustomerFilter('ALL');
    showToast(`Zákazník ${customerName} byl smazán`);

    try {
      await supabase.from('customers').delete().eq('name', customerName);
    } catch (e) {
      console.error(e);
    }
  };

  // Helios Instant Send
  const handleHeliosInstantSend = async (
    emails: string[],
    formats: { sql: boolean; csv: boolean }
  ) => {
    showToast("Odesílání exportu na e-mail...");
    const activeMolds = molds.filter(m => !m.is_deleted);
    const nowStr = new Date().toLocaleString('cs-CZ');

    const payload = {
      action: "sendInstant",
      emails,
      formats,
      molds: activeMolds.map(m => {
        const comms = comments.filter(c => c.mold_id === m.id);
        const lastC = comms[0]?.comment || '';
        return {
          id: m.id,
          position: m.position,
          customer: m.customer,
          status: m.status,
          product_name: m.product_name,
          last_comment: lastC,
          photos: m.photo_urls,
          updated_at: nowStr
        };
      })
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showToast("Data byla úspěšně odeslána na e-mail!");
    } catch (e) {
      console.error(e);
      showToast("Chyba při odesílání e-mailu", true);
    }
  };

  // Helios Auto Settings
  const handleSaveHeliosAuto = async (
    emails: string[],
    formats: { sql: boolean; csv: boolean },
    frequency: string,
    time: string
  ) => {
    showToast("Ukládání automatického exportu...");
    try {
      await supabase.from('app_settings').upsert([
        { key: 'adis_auto_emails', value: JSON.stringify(emails) },
        { key: 'adis_auto_freq', value: frequency },
        { key: 'adis_auto_time', value: time },
        { key: 'adis_auto_formats', value: JSON.stringify(formats) }
      ], { onConflict: 'key' });

      const params = new URLSearchParams({
        action: "saveSettings",
        emails: JSON.stringify(emails),
        formats: JSON.stringify(formats),
        frequency,
        time,
        enabled: emails.length > 0 ? "true" : "false"
      });

      await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      });
      showToast("Nastavení automatického exportu uloženo!");
    } catch (e) {
      console.error(e);
      showToast("Chyba při ukládání nastavení", true);
    }
  };

  // ----------------------------------------------------
  // Filtered lists and calculations
  // ----------------------------------------------------
  const activeMolds = useMemo(() => molds.filter(m => !m.is_deleted), [molds]);
  const deletedMolds = useMemo(() => molds.filter(m => m.is_deleted), [molds]);

  const searchFilteredMolds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const isWholeWord = (text: string, target: string) => {
      if (!text || !target) return false;
      const t = text.toLowerCase().trim();
      const p = target.toLowerCase().trim();
      if (t === p) return true;
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('(^|[^a-z0-9])' + escaped + '([^a-z0-9]|$)', 'i');
      return regex.test(t);
    };

    const scored = [];
    for (const m of activeMolds) {
      const id = m.id.toLowerCase();
      const pos = m.position.toLowerCase();
      const cust = m.customer.toLowerCase();
      const prod = (m.product_name || '').toLowerCase();
      const status = (m.status || '').toLowerCase();

      let score = 0;
      if (id === q) score += 1000;
      else if (id.startsWith(q)) score += 500;
      else if (id.includes(q)) score += 200;

      if (prod) {
        if (prod === q) score += 800;
        else if (isWholeWord(prod, q)) score += 600;
        else if (prod.startsWith(q)) score += 300;
        else if (prod.includes(q)) score += 100;
      }

      if (cust === q) score += 400;
      else if (isWholeWord(cust, q)) score += 300;
      else if (cust.includes(q)) score += 150;

      if (pos === q || pos.startsWith(q)) score += 250;
      else if (pos.includes(q)) score += 120;

      if (status.includes(q)) score += 80;

      if (score > 0) {
        scored.push({ mold: m, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.mold);
  }, [activeMolds, searchQuery]);

  const databaseFilteredMolds = useMemo(() => {
    if (customerFilter === 'ALL') return activeMolds;
    return activeMolds.filter(m => m.customer.toLowerCase() === customerFilter.toLowerCase());
  }, [activeMolds, customerFilter]);

  const dashboardCounts = useMemo(() => {
    return {
      all: activeMolds.filter(m => m.status && m.status.trim() !== '').length,
      fronteUdrzbu: activeMolds.filter(m => m.status === 'Ve frontě na údržbu').length,
      fronteOpravu: activeMolds.filter(m => m.status === 'Ve frontě na opravu').length,
      naUdrzbe: activeMolds.filter(m => m.status === 'Na údržbě / Na opravě').length,
      opravePryc: activeMolds.filter(m => m.status === 'Na opravě pryč').length,
    };
  }, [activeMolds]);

  const dashboardFilteredMolds = useMemo(() => {
    const withStatus = activeMolds.filter(m => m.status && m.status.trim() !== '');
    if (dashboardStatusFilter === 'ALL') return withStatus;
    return withStatus.filter(m => m.status === dashboardStatusFilter);
  }, [activeMolds, dashboardStatusFilter]);

  const hasActiveIn24h = useMemo(() => {
    const now = Date.now();
    return activeSessions.some(s => {
      const diff = (now - new Date(s.last_seen).getTime()) / 60000;
      return diff <= 1440;
    });
  }, [activeSessions]);

  // Tab indicator measurement
  const searchTabRef = useRef<HTMLButtonElement>(null);
  const databaseTabRef = useRef<HTMLButtonElement>(null);
  const dashboardTabRef = useRef<HTMLButtonElement>(null);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    let targetBtn: HTMLButtonElement | null = null;
    if (activeTab === 'search') targetBtn = searchTabRef.current;
    else if (activeTab === 'database') targetBtn = databaseTabRef.current;
    else if (activeTab === 'dashboard') targetBtn = dashboardTabRef.current;

    if (targetBtn) {
      setTabIndicatorStyle({
        left: targetBtn.offsetLeft,
        width: targetBtn.offsetWidth,
      });
    }
  }, [activeTab]);

  // Horizontal touch swipe gesture between tabs
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.changedTouches[0].screenX);
    setTouchStartY(e.changedTouches[0].screenY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.changedTouches[0].screenX - touchStartX;
    const diffY = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX < 0) {
        // Swipe left -> next tab
        if (activeTab === 'search') setActiveTab('database');
        else if (activeTab === 'database') setActiveTab('dashboard');
      } else {
        // Swipe right -> prev tab
        if (activeTab === 'dashboard') setActiveTab('database');
        else if (activeTab === 'database') setActiveTab('search');
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col justify-center items-center sm:py-3 select-none">
      {/* Container */}
      <div className="w-full max-w-4xl bg-white border border-slate-200 sm:rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-screen sm:min-h-[720px] relative">
        {/* Header */}
        <Header
          currentUser={currentUser}
          isSuperUser={isSuperUser}
          hasActiveIn24h={hasActiveIn24h}
          onAuthClick={() => {
            if (currentUser) handleLogout();
            else setIsLoginOpen(true);
          }}
          onSuperuserClick={() => setIsHeliosOpen(true)}
          onToggleOnlineUsers={() => setIsOnlineUsersOpen(prev => !prev)}
          onOpenAddModal={() => {
            if (requireAuth()) setIsAddOpen(true);
          }}
          onOpenLogsModal={() => setIsLogsOpen(true)}
          onReload={() => window.location.reload()}
        />

        {/* Tabs Bar with animated gliding indicator */}
        <div className="tabs">
          <button
            ref={searchTabRef}
            id="btn-search"
            onClick={() => setActiveTab('search')}
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          >
            Vyhledávání
          </button>
          <button
            ref={databaseTabRef}
            id="btn-database"
            onClick={() => setActiveTab('database')}
            className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          >
            Databáze
          </button>
          <button
            ref={dashboardTabRef}
            id="btn-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </button>
          <div
            id="tabIndicator"
            className="tab-indicator"
            style={{
              left: `${tabIndicatorStyle.left}px`,
              width: `${tabIndicatorStyle.width}px`,
            }}
          />
        </div>

        {/* Tab Content with swipe support */}
        <main
          id="swipeContentArea"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 p-3 sm:p-5 flex flex-col relative overflow-hidden"
        >
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
              <span className="text-sm">Načítání dat z cloudu...</span>
            </div>
          ) : (
            <>
              {activeTab === 'search' && (
                <SearchTab
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filteredMolds={searchFilteredMolds}
                  comments={comments}
                  customers={customers}
                  isSuperUser={isSuperUser}
                  currentUser={currentUser}
                  onEditPosition={(id, pos) => {
                    if (requireAuth()) setEditingPosition({ moldId: id, pos });
                  }}
                  onEditCustomer={(id, cust) => {
                    if (requireAuth()) setEditingCustomer({ moldId: id, cust });
                  }}
                  onOpenCommentModal={(id) => {
                    if (requireAuth()) setCommentingMoldId(id);
                  }}
                  onOpenFullEdit={(id, pos, status, prodName) => {
                    if (requireAuth()) setEditingFull({ moldId: id, pos, status, prodName });
                  }}
                  onOpenPhotoModal={(url, title) => setPreviewPhoto({ url, title })}
                  onOpenPdfModal={(url, title) => setPreviewPdf({ url, title })}
                  onOpenViewComment={(c) => setViewingComment(c)}
                  onCommentRightClick={(_, cId) => handleDeleteComment(cId)}
                  onRowRightClick={(_, mId) => handleSoftDelete(mId)}
                  onCustomerRightClick={(_, custName) => {
                    if (requireSuperUser()) {
                      const cObj = customers.find(c => c.name === custName);
                      setEditingCustomerColor({ name: custName, color: cObj?.bg || '#ffffff' });
                    }
                  }}
                  onSaveAccordionChanges={handleSaveAccordionChanges}
                />
              )}

              {activeTab === 'database' && (
                <DatabaseTab
                  currentCustomerFilter={customerFilter}
                  onFilterCustomer={setCustomerFilter}
                  onOpenAddCustomerModal={() => {
                    if (requireAuth()) setIsAddCustomerOpen(true);
                  }}
                  customers={customers}
                  filteredMolds={databaseFilteredMolds}
                  totalActiveCount={activeMolds.length}
                  comments={comments}
                  isSuperUser={isSuperUser}
                  currentUser={currentUser}
                  onEditPosition={(id, pos) => {
                    if (requireAuth()) setEditingPosition({ moldId: id, pos });
                  }}
                  onEditCustomer={(id, cust) => {
                    if (requireAuth()) setEditingCustomer({ moldId: id, cust });
                  }}
                  onOpenCommentModal={(id) => {
                    if (requireAuth()) setCommentingMoldId(id);
                  }}
                  onOpenFullEdit={(id, pos, status, prodName) => {
                    if (requireAuth()) setEditingFull({ moldId: id, pos, status, prodName });
                  }}
                  onOpenPhotoModal={(url, title) => setPreviewPhoto({ url, title })}
                  onOpenPdfModal={(url, title) => setPreviewPdf({ url, title })}
                  onOpenViewComment={(c) => setViewingComment(c)}
                  onCommentRightClick={(_, cId) => handleDeleteComment(cId)}
                  onRowRightClick={(_, mId) => handleSoftDelete(mId)}
                  onCustomerRightClick={(_, custName) => {
                    if (requireSuperUser()) {
                      const cObj = customers.find(c => c.name === custName);
                      setEditingCustomerColor({ name: custName, color: cObj?.bg || '#ffffff' });
                    }
                  }}
                  onSaveAccordionChanges={handleSaveAccordionChanges}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardTab
                  currentDashboardFilter={dashboardStatusFilter}
                  onFilterDashboard={setDashboardStatusFilter}
                  filteredMolds={dashboardFilteredMolds}
                  counts={dashboardCounts}
                  comments={comments}
                  customers={customers}
                  isSuperUser={isSuperUser}
                  currentUser={currentUser}
                  onEditPosition={(id, pos) => {
                    if (requireAuth()) setEditingPosition({ moldId: id, pos });
                  }}
                  onEditCustomer={(id, cust) => {
                    if (requireAuth()) setEditingCustomer({ moldId: id, cust });
                  }}
                  onOpenCommentModal={(id) => {
                    if (requireAuth()) setCommentingMoldId(id);
                  }}
                  onOpenFullEdit={(id, pos, status, prodName) => {
                    if (requireAuth()) setEditingFull({ moldId: id, pos, status, prodName });
                  }}
                  onOpenPhotoModal={(url, title) => setPreviewPhoto({ url, title })}
                  onOpenPdfModal={(url, title) => setPreviewPdf({ url, title })}
                  onOpenViewComment={(c) => setViewingComment(c)}
                  onCommentRightClick={(_, cId) => handleDeleteComment(cId)}
                  onRowRightClick={(_, mId) => handleSoftDelete(mId)}
                  onCustomerRightClick={(_, custName) => {
                    if (requireSuperUser()) {
                      const cObj = customers.find(c => c.name === custName);
                      setEditingCustomerColor({ name: custName, color: cObj?.bg || '#ffffff' });
                    }
                  }}
                  onSaveAccordionChanges={handleSaveAccordionChanges}
                />
              )}
            </>
          )}
        </main>

        {/* Floating Action Buttons */}
        {/* Left: Trash Bin (if any deleted molds exist) */}
        {deletedMolds.length > 0 && (
          <button
            id="trashCornerBtn"
            onClick={() => setIsTrashOpen(true)}
            title="Koš (Smazané formy)"
            className="floating-corner-btn-left"
          >
            <img src="/icon7.png" alt="Koš" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
            <span
              id="trashBadge"
              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-xs"
            >
              {deletedMolds.length}
            </span>
          </button>
        )}

        {/* Right: Quick Move from Production (Forma po výrobě -> Mezisklad) */}
        <button
          id="directProdBtn"
          onClick={() => {
            if (requireAuth()) setIsDirectProdOpen(true);
          }}
          title="Forma po výrobě"
          className="floating-corner-btn"
        >
          <img src="/icon6.png" alt="Forma po výrobě" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
        </button>
      </div>

      {/* Online Users Popover */}
      <OnlineUsersPopover
        isOpen={isOnlineUsersOpen}
        onClose={() => setIsOnlineUsersOpen(false)}
        sessions={activeSessions}
        onRefresh={fetchActiveSessions}
      />

      {/* All Modal Dialogs */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />

      <AddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        customers={customers}
        onAdd={handleAddNewMold}
      />

      <LogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={logs}
        isSuperUser={isSuperUser}
        onClearLogs={handleClearLogs}
      />

      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        deletedMolds={deletedMolds}
        onRestore={handleRestoreMold}
        onEmptyTrash={handleEmptyTrash}
      />

      <DirectProdModal
        isOpen={isDirectProdOpen}
        onClose={() => setIsDirectProdOpen(false)}
        onExecute={handleDirectProdMove}
      />

      {editingPosition && (
        <PositionModal
          isOpen={true}
          onClose={() => setEditingPosition(null)}
          moldId={editingPosition.moldId}
          currentPos={editingPosition.pos}
          onSave={handleSavePosition}
        />
      )}

      {editingCustomer && (
        <CustomerModal
          isOpen={true}
          onClose={() => setEditingCustomer(null)}
          moldId={editingCustomer.moldId}
          currentCustomer={editingCustomer.cust}
          customers={customers}
          onSave={handleSaveCustomer}
        />
      )}

      {editingFull && (
        <FullEditModal
          isOpen={true}
          onClose={() => setEditingFull(null)}
          moldId={editingFull.moldId}
          currentPos={editingFull.pos}
          currentStatus={editingFull.status}
          onSave={handleSaveFullEdit}
        />
      )}

      {commentingMoldId && (
        <CommentModal
          isOpen={true}
          onClose={() => setCommentingMoldId(null)}
          moldId={commentingMoldId}
          onAddComment={handleAddComment}
        />
      )}

      {viewingComment && (
        <ViewCommentModal
          isOpen={true}
          onClose={() => setViewingComment(null)}
          comment={viewingComment}
          onDelete={handleDeleteComment}
          onOpenPhoto={(url, title) => setPreviewPhoto({ url, title })}
        />
      )}

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onAdd={handleAddCustomer}
      />

      {editingCustomerColor && (
        <EditCustomerColorModal
          isOpen={true}
          onClose={() => setEditingCustomerColor(null)}
          customerName={editingCustomerColor.name}
          initialColor={editingCustomerColor.color}
          onSave={handleEditCustomerColor}
        />
      )}

      {previewPhoto && (
        <PhotoModal
          isOpen={true}
          onClose={() => setPreviewPhoto(null)}
          url={previewPhoto.url}
          title={previewPhoto.title}
        />
      )}

      {previewPdf && (
        <PdfModal
          isOpen={true}
          onClose={() => setPreviewPdf(null)}
          url={previewPdf.url}
          title={previewPdf.title}
        />
      )}

      <HeliosAdminModal
        isOpen={isHeliosOpen}
        onClose={() => setIsHeliosOpen(false)}
        molds={molds}
        comments={comments}
        onInstantSend={handleHeliosInstantSend}
        onSaveAutoSettings={handleSaveHeliosAuto}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xl border flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 pointer-events-auto ${
              t.isError
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            {t.isError ? (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
