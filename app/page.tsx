"use client";

import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Tab = "dashboard" | "hutang" | "rekod" | "tetapan";

type Child = {
  id: string;
  name: string;
  debt: number;
  monthlyTarget: number;
  withdrawalDate: string;
  color: string;
};

type Payment = {
  id: string;
  childId: string;
  amount: number;
  date: string;
  note: string;
};

type TrackerState = {
  children: Child[];
  payments: Payment[];
  updatedAt: string;
};

const STORAGE_KEY = "asb-anak-tracker-v1";

const DEFAULT_STATE: TrackerState = {
  children: [
    { id: "tasneem", name: "Tasneem", debt: 4600, monthlyTarget: 111, withdrawalDate: "2026-02-16", color: "#9be15d" },
    { id: "azra", name: "Azra", debt: 4000, monthlyTarget: 111, withdrawalDate: "2026-02-16", color: "#ffbd59" },
    { id: "naurah", name: "Naurah", debt: 8000, monthlyTarget: 111, withdrawalDate: "2026-02-16", color: "#79c7ff" },
  ],
  payments: [
    { id: "t-apr-26", childId: "tasneem", amount: 111, date: "2026-04-01", note: "Bayaran April" },
    { id: "t-may-26", childId: "tasneem", amount: 1112, date: "2026-05-01", note: "Bayaran Mei" },
    { id: "t-jun-26", childId: "tasneem", amount: 1112, date: "2026-06-01", note: "Bayaran Jun" },
    { id: "t-jul-26", childId: "tasneem", amount: 111, date: "2026-07-01", note: "Bayaran Julai" },
    { id: "n-apr-26", childId: "naurah", amount: 111, date: "2026-04-01", note: "Bayaran April" },
    { id: "n-may-26", childId: "naurah", amount: 1112, date: "2026-05-01", note: "Bayaran Mei" },
    { id: "n-jun-26", childId: "naurah", amount: 1112, date: "2026-06-01", note: "Bayaran Jun" },
    { id: "n-jul-26", childId: "naurah", amount: 111, date: "2026-07-01", note: "Bayaran Julai" },
  ],
  updatedAt: "2026-08-25T00:00:00.000Z",
};

const iconPaths: Record<string, React.ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
  wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 7h15"/><path d="M15 12h6v4h-6a2 2 0 0 1 0-4Z"/></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
  upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 21h14"/></>,
  edit: <><path d="m4 16-1 5 5-1L19 9l-4-4Z"/><path d="m13.5 6.5 4 4"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
  shield: <><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z"/><path d="m9 12 2 2 4-4"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

const amountFormat = new Intl.NumberFormat("ms-MY", { maximumFractionDigits: 2 });
const money = (amount: number) => `RM ${amountFormat.format(amount)}`;

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function monthKey(date: Date | string) {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("ms-MY", { month: "long", year: "numeric" }).format(date);
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [tracker, setTracker] = useState<TrackerState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editChildId, setEditChildId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const today = useMemo(() => new Date(), []);
  const currentMonth = monthKey(today);
  const [paymentForm, setPaymentForm] = useState({ childId: "tasneem", amount: "111", date: new Date().toISOString().slice(0, 10), note: "Bayaran bulanan" });
  const [childForm, setChildForm] = useState({ name: "", debt: "", monthlyTarget: "" });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setTracker(JSON.parse(saved) as TrackerState);
      } catch {
        setToast("Data simpanan tak dapat dibaca. Data asal digunakan.");
      } finally {
        setHydrated(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
  }, [tracker, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const paidByChild = useMemo(() => tracker.payments.reduce<Record<string, number>>((totals, payment) => {
    totals[payment.childId] = (totals[payment.childId] ?? 0) + payment.amount;
    return totals;
  }, {}), [tracker.payments]);

  const totalDebt = tracker.children.reduce((sum, child) => sum + child.debt, 0);
  const totalPaid = tracker.children.reduce((sum, child) => sum + Math.min(paidByChild[child.id] ?? 0, child.debt), 0);
  const totalRemaining = Math.max(totalDebt - totalPaid, 0);
  const overallPercent = totalDebt ? Math.round((totalPaid / totalDebt) * 100) : 0;
  const currentMonthPaid = tracker.payments.filter((payment) => monthKey(payment.date) === currentMonth);

  function saveChange(update: (current: TrackerState) => TrackerState) {
    setTracker((current) => ({ ...update(current), updatedAt: new Date().toISOString() }));
  }

  function openPayment(childId?: string) {
    const chosen = tracker.children.find((child) => child.id === childId) ?? tracker.children[0];
    setPaymentForm({ childId: chosen.id, amount: String(chosen.monthlyTarget), date: new Date().toISOString().slice(0, 10), note: "Bayaran bulanan" });
    setPaymentOpen(true);
  }

  function addPayment(event: FormEvent) {
    event.preventDefault();
    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setToast("Masukkan jumlah bayaran yang betul.");
      return;
    }
    const payment: Payment = { id: `${paymentForm.childId}-${Date.now()}`, childId: paymentForm.childId, amount, date: paymentForm.date, note: paymentForm.note.trim() || "Bayaran" };
    saveChange((current) => ({ ...current, payments: [payment, ...current.payments] }));
    setPaymentOpen(false);
    setToast("Bayaran berjaya direkod.");
  }

  function deletePayment(id: string) {
    if (!window.confirm("Padam rekod bayaran ini?")) return;
    saveChange((current) => ({ ...current, payments: current.payments.filter((payment) => payment.id !== id) }));
    setToast("Rekod bayaran dipadam.");
  }

  function openEditChild(child: Child) {
    setChildForm({ name: child.name, debt: String(child.debt), monthlyTarget: String(child.monthlyTarget) });
    setEditChildId(child.id);
  }

  function updateChild(event: FormEvent) {
    event.preventDefault();
    const debt = Number(childForm.debt);
    const target = Number(childForm.monthlyTarget);
    if (!childForm.name.trim() || debt <= 0 || target <= 0) {
      setToast("Semak nama dan jumlah yang dimasukkan.");
      return;
    }
    saveChange((current) => ({ ...current, children: current.children.map((child) => child.id === editChildId ? { ...child, name: childForm.name.trim(), debt, monthlyTarget: target } : child) }));
    setEditChildId(null);
    setToast("Maklumat hutang dikemas kini.");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(tracker, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-asb-anak-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Fail backup telah dimuat turun.");
  }

  function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as TrackerState;
        if (!Array.isArray(data.children) || !Array.isArray(data.payments)) throw new Error("Invalid");
        setTracker({ ...data, updatedAt: new Date().toISOString() });
        setToast("Backup berjaya dipulihkan.");
      } catch {
        setToast("Fail backup tidak sah.");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function resetData() {
    if (!window.confirm("Pulihkan semua data asal? Rekod baharu anda akan dipadam.")) return;
    setTracker({ ...DEFAULT_STATE, updatedAt: new Date().toISOString() });
    setToast("Data asal telah dipulihkan.");
  }

  const sortedPayments = [...tracker.payments].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true"><span>✓</span></div>
        <div><p className="eyebrow">Rekod peribadi</p><h1>ASB Anak</h1></div>
        <button className="add-top" onClick={() => openPayment()} aria-label="Tambah bayaran"><Icon name="plus" size={22}/></button>
      </header>

      <main className="main-content">
        {tab === "dashboard" && (
          <section className="page-section">
            <div className="hero-card">
              <div><p className="hero-label">Baki keseluruhan</p><strong className="hero-amount">{money(totalRemaining)}</strong><p className="hero-sub">daripada {money(totalDebt)} yang dikeluarkan</p></div>
              <div className="progress-ring" style={{ "--progress": `${overallPercent * 3.6}deg` } as CSSProperties}><span>{overallPercent}%</span><small>selesai</small></div>
              <div className="hero-stats"><div><span>Sudah dibayar</span><strong>{money(totalPaid)}</strong></div><div><span>Tarikh ambil</span><strong>16 Feb 2026</strong></div></div>
            </div>

            <div className="section-heading"><div><p className="eyebrow">Checklist</p><h2>{monthLabel(today)}</h2></div><span className="count-pill">{currentMonthPaid.length}/{tracker.children.length}</span></div>
            <div className="checklist-card">
              {tracker.children.map((child) => {
                const monthTotal = currentMonthPaid.filter((payment) => payment.childId === child.id).reduce((sum, payment) => sum + payment.amount, 0);
                const complete = monthTotal >= child.monthlyTarget;
                return <button key={child.id} className="check-row" onClick={() => openPayment(child.id)}><span className={`check-box ${complete ? "complete" : ""}`}><Icon name={complete ? "check" : "plus"} size={17}/></span><span className="avatar" style={{ "--child-color": child.color } as CSSProperties}>{child.name.charAt(0)}</span><span className="check-copy"><strong>{child.name}</strong><small>{complete ? `${money(monthTotal)} direkod` : `Sasaran ${money(child.monthlyTarget)}`}</small></span><span className={complete ? "status paid" : "status due"}>{complete ? "Selesai" : "Belum"}</span></button>;
              })}
            </div>

            {(paidByChild.azra ?? 0) === 0 && <button className="notice-card" onClick={() => setTab("hutang")}><span className="notice-icon">!</span><span><strong>Lengkapkan rekod Azra</strong><small>Sejarah bayaran belum dimasukkan.</small></span><Icon name="arrow" size={18}/></button>}

            <div className="section-heading compact"><div><p className="eyebrow">Ringkasan</p><h2>Hutang setiap anak</h2></div></div>
            <div className="child-stack">
              {tracker.children.map((child) => {
                const paid = paidByChild[child.id] ?? 0;
                const remaining = Math.max(child.debt - paid, 0);
                const percent = Math.min(Math.round((paid / child.debt) * 100), 100);
                return <button key={child.id} className="child-card" onClick={() => setTab("hutang")} style={{ "--child-color": child.color } as CSSProperties}><span className="avatar large">{child.name.charAt(0)}</span><span className="child-main"><span className="child-line"><strong>{child.name}</strong><b>{money(remaining)}</b></span><span className="mini-progress"><i style={{ width: `${percent}%` }}/></span><span className="child-line muted"><small>{percent}% dibayar</small><small>Baki</small></span></span></button>;
              })}
            </div>
          </section>
        )}

        {tab === "hutang" && (
          <section className="page-section">
            <div className="page-title"><p className="eyebrow">Jumlah & kemajuan</p><h2>Hutang anak</h2><p>Semak baki dan kemas kini sasaran bulanan.</p></div>
            <div className="debt-list">
              {tracker.children.map((child) => {
                const paid = paidByChild[child.id] ?? 0;
                const remaining = Math.max(child.debt - paid, 0);
                const percent = Math.min(Math.round((paid / child.debt) * 100), 100);
                return <article className="debt-card" key={child.id} style={{ "--child-color": child.color } as CSSProperties}><div className="debt-top"><span className="avatar xlarge">{child.name.charAt(0)}</span><div><p>ASB • {dateLabel(child.withdrawalDate)}</p><h3>{child.name}</h3></div><button className="icon-button" onClick={() => openEditChild(child)} aria-label={`Edit ${child.name}`}><Icon name="edit" size={18}/></button></div><div className="balance-block"><span>Baki semasa</span><strong>{money(remaining)}</strong></div><div className="progress-meta"><span>{money(paid)} dibayar</span><span>{percent}%</span></div><div className="debt-progress"><i style={{ width: `${percent}%` }}/></div><div className="debt-info"><div><span>Jumlah asal</span><strong>{money(child.debt)}</strong></div><div><span>Sasaran/bulan</span><strong>{money(child.monthlyTarget)}</strong></div></div><button className="primary-button full" onClick={() => openPayment(child.id)}><Icon name="plus" size={19}/> Rekod bayaran</button></article>;
              })}
            </div>
          </section>
        )}

        {tab === "rekod" && (
          <section className="page-section">
            <div className="page-title with-action"><div><p className="eyebrow">Semua transaksi</p><h2>Rekod bayaran</h2><p>{tracker.payments.length} rekod disimpan dalam telefon ini.</p></div><button className="square-add" onClick={() => openPayment()} aria-label="Tambah rekod"><Icon name="plus" size={22}/></button></div>
            {sortedPayments.length ? <div className="history-card">{sortedPayments.map((payment) => { const child = tracker.children.find((item) => item.id === payment.childId); if (!child) return null; return <div className="history-row" key={payment.id}><span className="history-icon" style={{ "--child-color": child.color } as CSSProperties}><Icon name="check" size={17}/></span><span className="history-copy"><strong>{child.name}</strong><small>{payment.note} • {dateLabel(payment.date)}</small></span><span className="history-amount"><strong>+{money(payment.amount).replace("RM ", "RM")}</strong><button onClick={() => deletePayment(payment.id)} aria-label="Padam rekod"><Icon name="trash" size={16}/></button></span></div>; })}</div> : <div className="empty-state"><span><Icon name="list" size={28}/></span><h3>Belum ada bayaran</h3><p>Tambah bayaran pertama untuk mula menjejak.</p><button className="primary-button" onClick={() => openPayment()}>Tambah bayaran</button></div>}
          </section>
        )}

        {tab === "tetapan" && (
          <section className="page-section">
            <div className="page-title"><p className="eyebrow">Kawalan data</p><h2>Tetapan</h2><p>Semua rekod disimpan secara peribadi pada peranti anda.</p></div>
            <div className="settings-group"><p className="group-label">Hutang & sasaran</p><div className="settings-card">{tracker.children.map((child) => <button className="setting-row" key={child.id} onClick={() => openEditChild(child)}><span className="avatar" style={{ "--child-color": child.color } as CSSProperties}>{child.name.charAt(0)}</span><span><strong>{child.name}</strong><small>{money(child.debt)} • {money(child.monthlyTarget)}/bulan</small></span><Icon name="arrow" size={18}/></button>)}</div></div>
            <div className="settings-group"><p className="group-label">Backup data</p><div className="settings-card"><button className="setting-row" onClick={exportBackup}><span className="setting-icon green"><Icon name="download" size={19}/></span><span><strong>Muat turun backup</strong><small>Simpan salinan fail JSON</small></span><Icon name="arrow" size={18}/></button><button className="setting-row" onClick={() => importRef.current?.click()}><span className="setting-icon blue"><Icon name="upload" size={19}/></span><span><strong>Pulihkan backup</strong><small>Import fail yang disimpan</small></span><Icon name="arrow" size={18}/></button><input ref={importRef} type="file" accept="application/json" hidden onChange={importBackup}/></div></div>
            <div className="privacy-note"><Icon name="shield" size={22}/><span><strong>Data kekal pada peranti</strong><small>Tiada maklumat dihantar ke bank atau pelayan luar.</small></span></div>
            <button className="danger-button" onClick={resetData}>Pulihkan data asal</button>
            <p className="source-note">Data permulaan: pengeluaran pada 16 Februari 2026. Rekod Tasneem dan Naurah dimasukkan daripada chat anda; sejarah bayaran Azra boleh ditambah sendiri.</p>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Navigasi utama">
        {([["dashboard", "home", "Utama"], ["hutang", "wallet", "Hutang"], ["rekod", "list", "Rekod"], ["tetapan", "settings", "Tetapan"]] as [Tab, string, string][]).map(([value, icon, label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}><Icon name={icon} size={21}/><span>{label}</span></button>)}
      </nav>

      {paymentOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaymentOpen(false); }}><form className="modal-sheet" onSubmit={addPayment}><div className="sheet-handle"/><div className="modal-title"><div><p className="eyebrow">Transaksi baharu</p><h2>Rekod bayaran</h2></div><button type="button" onClick={() => setPaymentOpen(false)} aria-label="Tutup"><Icon name="close" size={21}/></button></div><label><span>Nama anak</span><select value={paymentForm.childId} onChange={(event) => { const child = tracker.children.find((item) => item.id === event.target.value); setPaymentForm((form) => ({ ...form, childId: event.target.value, amount: child ? String(child.monthlyTarget) : form.amount })); }}>{tracker.children.map((child) => <option value={child.id} key={child.id}>{child.name}</option>)}</select></label><label><span>Jumlah bayaran (RM)</span><input inputMode="decimal" type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((form) => ({ ...form, amount: event.target.value }))} required/></label><label><span>Tarikh</span><input type="date" value={paymentForm.date} onChange={(event) => setPaymentForm((form) => ({ ...form, date: event.target.value }))} required/></label><label><span>Catatan</span><input type="text" value={paymentForm.note} onChange={(event) => setPaymentForm((form) => ({ ...form, note: event.target.value }))} placeholder="Contoh: Bayaran Ogos"/></label><button className="primary-button full tall" type="submit"><Icon name="check" size={20}/> Simpan bayaran</button></form></div>}

      {editChildId && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditChildId(null); }}><form className="modal-sheet" onSubmit={updateChild}><div className="sheet-handle"/><div className="modal-title"><div><p className="eyebrow">Kemas kini</p><h2>Maklumat hutang</h2></div><button type="button" onClick={() => setEditChildId(null)} aria-label="Tutup"><Icon name="close" size={21}/></button></div><label><span>Nama</span><input value={childForm.name} onChange={(event) => setChildForm((form) => ({ ...form, name: event.target.value }))} required/></label><label><span>Jumlah hutang asal (RM)</span><input inputMode="decimal" type="number" min="1" step="0.01" value={childForm.debt} onChange={(event) => setChildForm((form) => ({ ...form, debt: event.target.value }))} required/></label><label><span>Sasaran bulanan (RM)</span><input inputMode="decimal" type="number" min="1" step="0.01" value={childForm.monthlyTarget} onChange={(event) => setChildForm((form) => ({ ...form, monthlyTarget: event.target.value }))} required/></label><button className="primary-button full tall" type="submit"><Icon name="check" size={20}/> Simpan perubahan</button></form></div>}

      {toast && <div className="toast" role="status"><Icon name="check" size={18}/>{toast}</div>}
    </div>
  );
}
