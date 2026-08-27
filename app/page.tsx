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

type SyncStatus = "loading" | "saving" | "synced" | "offline";

const STORAGE_KEY = "asb-anak-tracker-v1";
const SYNC_KEY_STORAGE = "asb-anak-sync-key-v1";
const SYNC_ENDPOINT = "/api/tracker";

const DEFAULT_STATE: TrackerState = {
  children: [
    { id: "tasneem", name: "Tasneem", debt: 4600, monthlyTarget: 111, withdrawalDate: "2026-02-16", color: "#9be15d" },
    { id: "azra", name: "Azra", debt: 4000, monthlyTarget: 111, withdrawalDate: "2026-02-16", color: "#ffbd59" },
    { id: "naurah", name: "Naurah", debt: 8000, monthlyTarget: 111, withdrawalDate: "2026-02-16", color: "#79c7ff" },
  ],
  payments: [
    { id: "t-apr-26", childId: "tasneem", amount: 111, date: "2026-04-01", note: "April payment" },
    { id: "t-may-26", childId: "tasneem", amount: 1112, date: "2026-05-01", note: "May payment" },
    { id: "t-jun-26", childId: "tasneem", amount: 1112, date: "2026-06-01", note: "June payment" },
    { id: "t-jul-26", childId: "tasneem", amount: 111, date: "2026-07-01", note: "July payment" },
    { id: "n-apr-26", childId: "naurah", amount: 111, date: "2026-04-01", note: "April payment" },
    { id: "n-may-26", childId: "naurah", amount: 1112, date: "2026-05-01", note: "May payment" },
    { id: "n-jun-26", childId: "naurah", amount: 1112, date: "2026-06-01", note: "June payment" },
    { id: "n-jul-26", childId: "naurah", amount: 111, date: "2026-07-01", note: "July payment" },
  ],
  updatedAt: "2026-08-25T00:00:00.000Z",
};

function isTrackerState(value: unknown): value is TrackerState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TrackerState>;
  return Array.isArray(candidate.children)
    && candidate.children.every((child) => child
      && typeof child.id === "string"
      && typeof child.name === "string"
      && typeof child.debt === "number"
      && typeof child.monthlyTarget === "number"
      && typeof child.withdrawalDate === "string"
      && typeof child.color === "string")
    && Array.isArray(candidate.payments)
    && candidate.payments.every((payment) => payment
      && typeof payment.id === "string"
      && typeof payment.childId === "string"
      && typeof payment.amount === "number"
      && typeof payment.date === "string"
      && typeof payment.note === "string")
    && typeof candidate.updatedAt === "string";
}

function createSyncKey() {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function saveToCloud(syncKey: string, tracker: TrackerState, signal?: AbortSignal) {
  const response = await fetch(SYNC_ENDPOINT, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-sync-key": syncKey },
    body: JSON.stringify(tracker),
    signal,
  });
  if (!response.ok) throw new Error(`Sync failed with ${response.status}`);
}

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
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></>,
  edit: <><path d="m4 16-1 5 5-1L19 9l-4-4Z"/><path d="m13.5 6.5 4 4"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
  shield: <><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z"/><path d="m9 12 2 2 4-4"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

const amountFormat = new Intl.NumberFormat("en-MY", { maximumFractionDigits: 2 });
const money = (amount: number) => `RM ${amountFormat.format(amount)}`;

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function monthKey(date: Date | string) {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(date);
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [tracker, setTracker] = useState<TrackerState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [syncKey, setSyncKey] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [remoteReady, setRemoteReady] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editChildId, setEditChildId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const today = useMemo(() => new Date(), []);
  const currentMonth = monthKey(today);
  const [paymentForm, setPaymentForm] = useState({ childId: "tasneem", amount: "111", date: new Date().toISOString().slice(0, 10), note: "Monthly payment" });
  const [childForm, setChildForm] = useState({ name: "", debt: "", monthlyTarget: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadTracker() {
      let localTracker = DEFAULT_STATE;
      let hasLocalTracker = false;

      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (isTrackerState(parsed)) {
            localTracker = parsed;
            hasLocalTracker = true;
          }
        }

        const url = new URL(window.location.href);
        const keyFromLink = url.searchParams.get("sync")?.trim().toLowerCase() ?? "";
        const storedKey = window.localStorage.getItem(SYNC_KEY_STORAGE) ?? "";
        const validLinkedKey = /^[a-f0-9]{32}$/.test(keyFromLink) ? keyFromLink : "";
        const key = validLinkedKey || (/^[a-f0-9]{32}$/.test(storedKey) ? storedKey : createSyncKey());
        const localBelongsToKey = storedKey === key;

        window.localStorage.setItem(SYNC_KEY_STORAGE, key);
        setSyncKey(key);

        if (validLinkedKey) {
          url.searchParams.delete("sync");
          window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }

        const response = await fetch(SYNC_ENDPOINT, {
          headers: { "x-sync-key": key },
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.ok) {
          const cloudTracker: unknown = await response.json();
          if (!isTrackerState(cloudTracker)) throw new Error("Invalid cloud data");

          if (localBelongsToKey && hasLocalTracker && localTracker.updatedAt > cloudTracker.updatedAt) {
            await saveToCloud(key, localTracker, controller.signal);
            setTracker(localTracker);
          } else {
            setTracker(cloudTracker);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudTracker));
          }
          setRemoteReady(true);
          setSyncStatus("synced");
        } else if (response.status === 404) {
          await saveToCloud(key, localTracker, controller.signal);
          setTracker(localTracker);
          setRemoteReady(true);
          setSyncStatus("synced");
        } else {
          throw new Error(`Sync failed with ${response.status}`);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setTracker(localTracker);
        setSyncStatus("offline");
        setToast(error instanceof SyntaxError
          ? "Saved data could not be read. Using the initial data."
          : "Cloud storage is unavailable. Your data is still saved on this device.");
      } finally {
        if (!controller.signal.aborted) setHydrated(true);
      }
    }

    void loadTracker();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
    } catch {}

    if (!syncKey || !remoteReady) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSyncStatus("saving");
      saveToCloud(syncKey, tracker, controller.signal)
        .then(() => setSyncStatus("synced"))
        .catch(() => {
          if (!controller.signal.aborted) setSyncStatus("offline");
        });
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [tracker, hydrated, syncKey, remoteReady]);

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
    setPaymentForm({ childId: chosen.id, amount: String(chosen.monthlyTarget), date: new Date().toISOString().slice(0, 10), note: "Monthly payment" });
    setPaymentOpen(true);
  }

  function addPayment(event: FormEvent) {
    event.preventDefault();
    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setToast("Enter a valid payment amount.");
      return;
    }
    const payment: Payment = { id: `${paymentForm.childId}-${Date.now()}`, childId: paymentForm.childId, amount, date: paymentForm.date, note: paymentForm.note.trim() || "Payment" };
    saveChange((current) => ({ ...current, payments: [payment, ...current.payments] }));
    setPaymentOpen(false);
    setToast("Payment recorded successfully.");
  }

  function deletePayment(id: string) {
    if (!window.confirm("Delete this payment record?")) return;
    saveChange((current) => ({ ...current, payments: current.payments.filter((payment) => payment.id !== id) }));
    setToast("Payment record deleted.");
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
      setToast("Check the name and amounts entered.");
      return;
    }
    saveChange((current) => ({ ...current, children: current.children.map((child) => child.id === editChildId ? { ...child, name: childForm.name.trim(), debt, monthlyTarget: target } : child) }));
    setEditChildId(null);
    setToast("Debt details updated.");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(tracker, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-asb-anak-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Backup file downloaded.");
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
        setToast("Backup restored successfully.");
      } catch {
        setToast("Invalid backup file.");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function resetData() {
    if (!window.confirm("Restore all initial data? Your new records will be deleted.")) return;
    setTracker({ ...DEFAULT_STATE, updatedAt: new Date().toISOString() });
    setToast("Initial data restored.");
  }

  async function shareSyncLink() {
    if (!syncKey) {
      setToast("The sync link is not ready yet.");
      return;
    }

    const url = `${window.location.origin}/?sync=${syncKey}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "ASB Kids",
          text: "Open this link to access the same ASB Kids records.",
          url,
        });
        setToast("Sync link ready to share.");
      } else {
        await navigator.clipboard.writeText(url);
        setToast("Sync link copied.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setToast("Could not share the link. Please try again.");
    }
  }

  const syncLabel = syncStatus === "synced"
    ? "Saved to cloud"
    : syncStatus === "saving"
      ? "Saving…"
      : syncStatus === "loading"
        ? "Loading…"
        : "Offline — saved on this device";

  const childNameById = new Map(tracker.children.map((child) => [child.id, child.name]));
  const sortedPayments = [...tracker.payments].sort((a, b) => {
    const nameOrder = (childNameById.get(a.childId) ?? "").localeCompare(
      childNameById.get(b.childId) ?? "",
      "en-MY",
      { sensitivity: "base" },
    );
    if (nameOrder !== 0) return nameOrder;

    const dateOrder = b.date.localeCompare(a.date);
    return dateOrder !== 0 ? dateOrder : b.id.localeCompare(a.id);
  });

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true"><span>✓</span></div>
        <div><p className="eyebrow">Personal records</p><h1>ASB Kids</h1></div>
        <button className="add-top" onClick={() => openPayment()} aria-label="Add payment"><Icon name="plus" size={22}/></button>
      </header>

      <main className="main-content">
        {tab === "dashboard" && (
          <section className="page-section">
            <div className="hero-card">
              <div><p className="hero-label">Total balance</p><strong className="hero-amount">{money(totalRemaining)}</strong><p className="hero-sub">of {money(totalDebt)} withdrawn</p></div>
              <div className="progress-ring" style={{ "--progress": `${overallPercent * 3.6}deg` } as CSSProperties}><span>{overallPercent}%</span><small>repaid</small></div>
              <div className="hero-stats"><div><span>Total paid</span><strong>{money(totalPaid)}</strong></div><div><span>Withdrawal date</span><strong>16 Feb 2026</strong></div></div>
            </div>

            <div className="section-heading"><div><p className="eyebrow">Checklist</p><h2>{monthLabel(today)}</h2></div><span className="count-pill">{currentMonthPaid.length}/{tracker.children.length}</span></div>
            <div className="checklist-card">
              {tracker.children.map((child) => {
                const monthTotal = currentMonthPaid.filter((payment) => payment.childId === child.id).reduce((sum, payment) => sum + payment.amount, 0);
                const complete = monthTotal >= child.monthlyTarget;
                return <button key={child.id} className="check-row" onClick={() => openPayment(child.id)}><span className={`check-box ${complete ? "complete" : ""}`}><Icon name={complete ? "check" : "plus"} size={17}/></span><span className="avatar" style={{ "--child-color": child.color } as CSSProperties}>{child.name.charAt(0)}</span><span className="check-copy"><strong>{child.name}</strong><small>{complete ? `${money(monthTotal)} recorded` : `Target ${money(child.monthlyTarget)}`}</small></span><span className={complete ? "status paid" : "status due"}>{complete ? "Done" : "Due"}</span></button>;
              })}
            </div>

            {(paidByChild.azra ?? 0) === 0 && <button className="notice-card" onClick={() => setTab("hutang")}><span className="notice-icon">!</span><span><strong>Complete Azra&apos;s records</strong><small>Payment history has not been added yet.</small></span><Icon name="arrow" size={18}/></button>}

            <div className="section-heading compact"><div><p className="eyebrow">Summary</p><h2>Debt by child</h2></div></div>
            <div className="child-stack">
              {tracker.children.map((child) => {
                const paid = paidByChild[child.id] ?? 0;
                const remaining = Math.max(child.debt - paid, 0);
                const percent = Math.min(Math.round((paid / child.debt) * 100), 100);
                return <button key={child.id} className="child-card" onClick={() => setTab("hutang")} style={{ "--child-color": child.color } as CSSProperties}><span className="avatar large">{child.name.charAt(0)}</span><span className="child-main"><span className="child-line"><strong>{child.name}</strong><b>{money(remaining)}</b></span><span className="mini-progress"><i style={{ width: `${percent}%` }}/></span><span className="child-line muted"><small>{percent}% paid</small><small>Balance</small></span></span></button>;
              })}
            </div>
          </section>
        )}

        {tab === "hutang" && (
          <section className="page-section">
            <div className="page-title"><p className="eyebrow">Totals & progress</p><h2>Children&apos;s debts</h2><p>Check balances and update monthly targets.</p></div>
            <div className="debt-list">
              {tracker.children.map((child) => {
                const paid = paidByChild[child.id] ?? 0;
                const remaining = Math.max(child.debt - paid, 0);
                const percent = Math.min(Math.round((paid / child.debt) * 100), 100);
                return <article className="debt-card" key={child.id} style={{ "--child-color": child.color } as CSSProperties}><div className="debt-top"><span className="avatar xlarge">{child.name.charAt(0)}</span><div><p>ASB • {dateLabel(child.withdrawalDate)}</p><h3>{child.name}</h3></div><button className="icon-button" onClick={() => openEditChild(child)} aria-label={`Edit ${child.name}`}><Icon name="edit" size={18}/></button></div><div className="balance-block"><span>Current balance</span><strong>{money(remaining)}</strong></div><div className="progress-meta"><span>{money(paid)} paid</span><span>{percent}%</span></div><div className="debt-progress"><i style={{ width: `${percent}%` }}/></div><div className="debt-info"><div><span>Original amount</span><strong>{money(child.debt)}</strong></div><div><span>Monthly target</span><strong>{money(child.monthlyTarget)}</strong></div></div><button className="primary-button full" onClick={() => openPayment(child.id)}><Icon name="plus" size={19}/> Record payment</button></article>;
              })}
            </div>
          </section>
        )}

        {tab === "rekod" && (
          <section className="page-section">
            <div className="page-title with-action"><div><p className="eyebrow">All transactions</p><h2>Payment records</h2><p>{tracker.payments.length} records • {syncLabel}</p></div><button className="square-add" onClick={() => openPayment()} aria-label="Add record"><Icon name="plus" size={22}/></button></div>
            {sortedPayments.length ? <div className="history-card">{sortedPayments.map((payment) => { const child = tracker.children.find((item) => item.id === payment.childId); if (!child) return null; return <div className="history-row" key={payment.id}><span className="history-icon" style={{ "--child-color": child.color } as CSSProperties}><Icon name="check" size={17}/></span><span className="history-copy"><strong>{child.name}</strong><small>{payment.note} • {dateLabel(payment.date)}</small></span><span className="history-amount"><strong>+{money(payment.amount).replace("RM ", "RM")}</strong><button onClick={() => deletePayment(payment.id)} aria-label="Delete record"><Icon name="trash" size={16}/></button></span></div>; })}</div> : <div className="empty-state"><span><Icon name="list" size={28}/></span><h3>No payments yet</h3><p>Add your first payment to start tracking.</p><button className="primary-button" onClick={() => openPayment()}>Add payment</button></div>}
          </section>
        )}

        {tab === "tetapan" && (
          <section className="page-section">
            <div className="page-title"><p className="eyebrow">Data management</p><h2>Settings</h2><p>Records are saved in the cloud and on this device.</p></div>
            <div className="settings-group"><p className="group-label">Debts & targets</p><div className="settings-card">{tracker.children.map((child) => <button className="setting-row" key={child.id} onClick={() => openEditChild(child)}><span className="avatar" style={{ "--child-color": child.color } as CSSProperties}>{child.name.charAt(0)}</span><span><strong>{child.name}</strong><small>{money(child.debt)} • {money(child.monthlyTarget)}/month</small></span><Icon name="arrow" size={18}/></button>)}</div></div>
            <div className="settings-group"><p className="group-label">Device sync</p><div className="settings-card"><button className="setting-row" onClick={() => void shareSyncLink()}><span className="setting-icon blue"><Icon name="link" size={19}/></span><span><strong>Share sync link</strong><small>Open the link on another device</small></span><Icon name="arrow" size={18}/></button></div></div>
            <div className="settings-group"><p className="group-label">Data backup</p><div className="settings-card"><button className="setting-row" onClick={exportBackup}><span className="setting-icon green"><Icon name="download" size={19}/></span><span><strong>Download backup</strong><small>Save a copy as a JSON file</small></span><Icon name="arrow" size={18}/></button><button className="setting-row" onClick={() => importRef.current?.click()}><span className="setting-icon blue"><Icon name="upload" size={19}/></span><span><strong>Restore backup</strong><small>Import a saved file</small></span><Icon name="arrow" size={18}/></button><input ref={importRef} type="file" accept="application/json" hidden onChange={importBackup}/></div></div>
            <div className="privacy-note"><Icon name="shield" size={22}/><span><strong>{syncLabel}</strong><small>Keep your sync link private. Only share it with your own devices.</small></span></div>
            <button className="danger-button" onClick={resetData}>Restore initial data</button>
            <p className="source-note">Initial data: withdrawal on 16 February 2026. The records for Tasneem and Naurah were added from your chat; you can add Azra&apos;s payment history yourself.</p>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {([["dashboard", "home", "Home"], ["hutang", "wallet", "Debts"], ["rekod", "list", "Records"], ["tetapan", "settings", "Settings"]] as [Tab, string, string][]).map(([value, icon, label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}><Icon name={icon} size={21}/><span>{label}</span></button>)}
      </nav>

      {paymentOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaymentOpen(false); }}><form className="modal-sheet" onSubmit={addPayment}><div className="sheet-handle"/><div className="modal-title"><div><p className="eyebrow">New transaction</p><h2>Record payment</h2></div><button type="button" onClick={() => setPaymentOpen(false)} aria-label="Close"><Icon name="close" size={21}/></button></div><label><span>Child name</span><select value={paymentForm.childId} onChange={(event) => { const child = tracker.children.find((item) => item.id === event.target.value); setPaymentForm((form) => ({ ...form, childId: event.target.value, amount: child ? String(child.monthlyTarget) : form.amount })); }}>{tracker.children.map((child) => <option value={child.id} key={child.id}>{child.name}</option>)}</select></label><label><span>Payment amount (RM)</span><input inputMode="decimal" type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((form) => ({ ...form, amount: event.target.value }))} required/></label><label><span>Date</span><input type="date" value={paymentForm.date} onChange={(event) => setPaymentForm((form) => ({ ...form, date: event.target.value }))} required/></label><label><span>Note</span><input type="text" value={paymentForm.note} onChange={(event) => setPaymentForm((form) => ({ ...form, note: event.target.value }))} placeholder="Example: August payment"/></label><button className="primary-button full tall" type="submit"><Icon name="check" size={20}/> Save payment</button></form></div>}

      {editChildId && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditChildId(null); }}><form className="modal-sheet" onSubmit={updateChild}><div className="sheet-handle"/><div className="modal-title"><div><p className="eyebrow">Update</p><h2>Debt details</h2></div><button type="button" onClick={() => setEditChildId(null)} aria-label="Close"><Icon name="close" size={21}/></button></div><label><span>Name</span><input value={childForm.name} onChange={(event) => setChildForm((form) => ({ ...form, name: event.target.value }))} required/></label><label><span>Original debt (RM)</span><input inputMode="decimal" type="number" min="1" step="0.01" value={childForm.debt} onChange={(event) => setChildForm((form) => ({ ...form, debt: event.target.value }))} required/></label><label><span>Monthly target (RM)</span><input inputMode="decimal" type="number" min="1" step="0.01" value={childForm.monthlyTarget} onChange={(event) => setChildForm((form) => ({ ...form, monthlyTarget: event.target.value }))} required/></label><button className="primary-button full tall" type="submit"><Icon name="check" size={20}/> Save changes</button></form></div>}

      {toast && <div className="toast" role="status"><Icon name="check" size={18}/>{toast}</div>}
    </div>
  );
}
