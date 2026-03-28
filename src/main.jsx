import React, { useEffect, useMemo, useState } from "react";

const apartments = ["Fabron", "Juan", "Killian", "Swan"];
const STORAGE_KEY = "gestioloc-monthly-v2";

const defaultState = {
  reservations: [
    {
      id: 1,
      apartment: "Fabron",
      guest: "Airbnb",
      arrival: "2026-04-05",
      departure: "2026-04-10",
      source: "Airbnb iCal",
      icalUid: "demo-fabron-1",
    },
    {
      id: 2,
      apartment: "Juan",
      guest: "Airbnb",
      arrival: "2026-04-07",
      departure: "2026-04-12",
      source: "Airbnb iCal",
      icalUid: "demo-juan-1",
    },
    {
      id: 3,
      apartment: "Swan",
      guest: "Airbnb",
      arrival: "2026-04-09",
      departure: "2026-04-13",
      source: "Airbnb iCal",
      icalUid: "demo-swan-1",
    },
  ],
  icalSources: {
    Fabron: "",
    Juan: "",
    Killian: "",
    Swan: "",
  },
  syncInfo: {
    lastSyncAt: "",
  },
};

function loadState() {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState;
  } catch {
    return defaultState;
  }
}

function saveState(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function toISODate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function monthLabel(date) {
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function isBetween(date, start, end) {
  return date >= start && date < end;
}

function buildPlanning(reservations) {
  const rows = [];
  for (const r of reservations) {
    rows.push({
      id: `${r.id}-in`,
      apartment: r.apartment,
      guest: r.guest,
      date: r.arrival,
      type: "Check-in",
      start: "16:00",
      end: "16:00",
    });
    rows.push({
      id: `${r.id}-out`,
      apartment: r.apartment,
      guest: r.guest,
      date: r.departure,
      type: "Check-out",
      start: "11:00",
      end: "11:00",
    });
    rows.push({
      id: `${r.id}-clean`,
      apartment: r.apartment,
      guest: r.guest,
      date: r.departure,
      type: "Ménage",
      start: "11:15",
      end: "13:15",
    });
  }
  return rows.sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
}

function getDayEntries(dateIso, reservations, planning, apartmentFilter) {
  const list = [];
  const day = new Date(`${dateIso}T00:00:00`);

  for (const reservation of reservations) {
    if (apartmentFilter !== "Tous" && reservation.apartment !== apartmentFilter) continue;

    const arrival = new Date(`${reservation.arrival}T00:00:00`);
    const departure = new Date(`${reservation.departure}T00:00:00`);

    if (dateIso === reservation.arrival) {
      list.push({ apartment: reservation.apartment, kind: "Check-in", tone: "green" });
    }

    if (dateIso === reservation.departure) {
      list.push({ apartment: reservation.apartment, kind: "Check-out", tone: "red" });
      list.push({ apartment: reservation.apartment, kind: "Ménage", tone: "orange" });
    }

    if (isBetween(day, arrival, departure) && dateIso !== reservation.arrival) {
      list.push({ apartment: reservation.apartment, kind: "Occupé", tone: "slate" });
    }
  }

  return list.sort((a, b) => a.apartment.localeCompare(b.apartment));
}

function buildCalendarDays(currentMonth, reservations, planning, apartmentFilter) {
  const first = startOfMonth(currentMonth);
  const last = endOfMonth(currentMonth);
  const firstWeekday = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -firstWeekday);
  const days = [];

  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i);
    const iso = toISODate(d);
    days.push({
      date: iso,
      inMonth: d.getMonth() === currentMonth.getMonth(),
      entries: getDayEntries(iso, reservations, planning, apartmentFilter),
    });
  }

  return days;
}

function badgeStyle(tone) {
  const map = {
    green: { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" },
    red: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
    orange: { background: "#ffedd5", color: "#9a3412", border: "1px solid #fdba74" },
    slate: { background: "#e2e8f0", color: "#334155", border: "1px solid #cbd5e1" },
  };
  return map[tone] || map.slate;
}

function cardStyle() {
  return {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };
}

function parseDemoIcal(apartment) {
  const today = new Date();
  const start1 = addDays(today, 2);
  const end1 = addDays(today, 5);
  const start2 = addDays(today, 7);
  const end2 = addDays(today, 10);
  return [
    {
      apartment,
      guest: "Airbnb",
      arrival: toISODate(start1),
      departure: toISODate(end1),
      source: "Airbnb iCal",
      icalUid: `${apartment.toLowerCase()}-${toISODate(start1)}-1`,
    },
    {
      apartment,
      guest: "Airbnb",
      arrival: toISODate(start2),
      departure: toISODate(end2),
      source: "Airbnb iCal",
      icalUid: `${apartment.toLowerCase()}-${toISODate(start2)}-2`,
    },
  ];
}

function ManualReservationPanel({ form, setForm, onSubmit, open, setOpen }) {
  return (
    <div style={{ ...cardStyle(), display: open ? "block" : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Ajouter une réservation</h2>
        <button onClick={() => setOpen(false)} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>Fermer</button>
      </div>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <select value={form.apartment} onChange={(e) => setForm({ ...form, apartment: e.target.value })} style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1" }}>
          {apartments.map((a) => <option key={a}>{a}</option>)}
        </select>
        <input value={form.guest} onChange={(e) => setForm({ ...form, guest: e.target.value })} placeholder="Nom du voyageur" style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        <input type="date" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        <input type="date" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        <button type="submit" style={{ border: 0, background: "#111827", color: "white", borderRadius: 10, padding: 12, cursor: "pointer" }}>Enregistrer</button>
      </form>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [selectedApartment, setSelectedApartment] = useState("Tous");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [manualOpen, setManualOpen] = useState(false);
  const [form, setForm] = useState({ apartment: "Fabron", guest: "", arrival: "", departure: "" });
  const [syncRunning, setSyncRunning] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const reservations = state.reservations;
  const planning = useMemo(() => buildPlanning(reservations), [reservations]);
  const today = todayISO();
  const calendarDays = useMemo(() => buildCalendarDays(currentMonth, reservations, planning, selectedApartment), [currentMonth, reservations, planning, selectedApartment]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => selectedApartment === "Tous" || r.apartment === selectedApartment);
  }, [reservations, selectedApartment]);

  const filteredPlanning = useMemo(() => {
    return planning.filter((p) => selectedApartment === "Tous" || p.apartment === selectedApartment);
  }, [planning, selectedApartment]);

  const arrivalsToday = filteredPlanning.filter((p) => p.date === today && p.type === "Check-in");
  const departuresToday = filteredPlanning.filter((p) => p.date === today && p.type === "Check-out");
  const cleaningsToday = filteredPlanning.filter((p) => p.date === today && p.type === "Ménage");
  const occupiedThisMonth = filteredReservations.length;
  const dayPlan = filteredPlanning.filter((p) => p.date === today).sort((a, b) => a.start.localeCompare(b.start));
  const nextEvents = filteredPlanning.filter((p) => p.date >= today).slice(0, 12);

  function updateIcalSource(apartment, value) {
    setState((s) => ({ ...s, icalSources: { ...s.icalSources, [apartment]: value } }));
  }

  function addReservation(e) {
    e.preventDefault();
    if (!form.guest || !form.arrival || !form.departure) return;
    setState((s) => ({
      ...s,
      reservations: [
        ...s.reservations,
        {
          id: Date.now(),
          apartment: form.apartment,
          guest: form.guest,
          arrival: form.arrival,
          departure: form.departure,
          source: "Manuel",
          icalUid: null,
        },
      ],
    }));
    setForm({ apartment: "Fabron", guest: "", arrival: "", departure: "" });
    setManualOpen(false);
  }

  function deleteReservation(id) {
    setState((s) => ({ ...s, reservations: s.reservations.filter((r) => r.id !== id) }));
  }

  async function runSync() {
    setSyncRunning(true);
    try {
      const imported = [];
      for (const apartment of apartments) {
        const url = state.icalSources[apartment];
        if (!url) continue;
        const rows = parseDemoIcal(apartment);
        imported.push(...rows);
      }

      setState((s) => {
        const existingManual = s.reservations.filter((r) => !r.icalUid);
        const existingAutoByUid = new Map(s.reservations.filter((r) => r.icalUid).map((r) => [r.icalUid, r]));
        const autoMerged = [...existingAutoByUid.values()].map((r) => ({ ...r }));

        for (const row of imported) {
          const found = autoMerged.find((x) => x.icalUid === row.icalUid);
          if (found) {
            found.arrival = row.arrival;
            found.departure = row.departure;
            found.apartment = row.apartment;
          } else {
            autoMerged.push({ ...row, id: Date.now() + Math.random() });
          }
        }

        return {
          ...s,
          reservations: [...existingManual, ...autoMerged],
          syncInfo: { lastSyncAt: new Date().toLocaleString("fr-FR") },
        };
      });
    } finally {
      setSyncRunning(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
          <div>
            <div style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: 2, fontSize: 12 }}>Gestion Airbnb</div>
            <h1 style={{ margin: "8px 0 6px", fontSize: 36 }}>Calendrier mensuel des appartements</h1>
            <p style={{ margin: 0, color: "#475569" }}>Vue claire du mois en cours, planning du jour et synchronisation manuelle des calendriers Airbnb.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ color: "#475569", fontSize: 14 }}>Dernière mise à jour : {state.syncInfo.lastSyncAt || "Aucune"}</div>
            <button onClick={runSync} disabled={syncRunning} style={{ border: 0, background: "#0f172a", color: "white", borderRadius: 12, padding: "12px 16px", cursor: "pointer" }}>{syncRunning ? "Synchronisation..." : "Synchroniser les calendriers"}</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            ["Arrivées aujourd’hui", arrivalsToday.length],
            ["Départs aujourd’hui", departuresToday.length],
            ["Ménages aujourd’hui", cleaningsToday.length],
            ["Appartements occupés ce mois", occupiedThisMonth],
          ].map(([label, value]) => (
            <div key={label} style={cardStyle()}>
              <div style={{ color: "#64748b", fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 20, marginBottom: 24 }}>
          <div style={cardStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>Filtres et synchronisation</h2>
              <div style={{ display: "flex", gap: 10 }}>
                <select value={selectedApartment} onChange={(e) => setSelectedApartment(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}>
                  <option>Tous</option>
                  {apartments.map((a) => <option key={a}>{a}</option>)}
                </select>
                <button onClick={() => setManualOpen((v) => !v)} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Ajouter une réservation</button>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {apartments.map((apartment) => (
                <div key={apartment} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{apartment}</div>
                  <input value={state.icalSources[apartment]} onChange={(e) => updateIcalSource(apartment, e.target.value)} placeholder={`Lien iCal Airbnb pour ${apartment}`} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #cbd5e1" }} />
                </div>
              ))}
            </div>
          </div>

          <ManualReservationPanel form={form} setForm={setForm} onSubmit={addReservation} open={manualOpen} setOpen={setManualOpen} />
        </div>

        <div style={{ ...cardStyle(), marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 24, textTransform: "capitalize" }}>{monthLabel(currentMonth)}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Précédent</button>
              <button onClick={() => setCurrentMonth(new Date())} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Mois en cours</button>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Suivant</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 10, marginBottom: 10, color: "#64748b", fontSize: 13, fontWeight: 700 }}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => <div key={day} style={{ padding: '0 4px' }}>{day}</div>)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 10 }}>
            {calendarDays.map((day) => (
              <div key={day.date} style={{ minHeight: 160, border: day.date === today ? "2px solid #0f172a" : "1px solid #e5e7eb", borderRadius: 14, padding: 10, background: day.inMonth ? "white" : "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, color: day.inMonth ? "#111827" : "#94a3b8" }}>{day.date.slice(8, 10)}</div>
                  {day.date === today ? <div style={{ fontSize: 11, background: "#0f172a", color: "white", padding: "4px 8px", borderRadius: 999 }}>Aujourd’hui</div> : null}
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {day.entries.length === 0 ? <div style={{ color: "#94a3b8", fontSize: 12 }}>—</div> : day.entries.slice(0, 5).map((entry, index) => (
                    <div key={`${day.date}-${entry.apartment}-${entry.kind}-${index}`} style={{ ...badgeStyle(entry.tone), borderRadius: 10, padding: "6px 8px", fontSize: 12, fontWeight: 700 }}>
                      {entry.apartment} • {entry.kind}
                    </div>
                  ))}
                  {day.entries.length > 5 ? <div style={{ fontSize: 12, color: "#64748b" }}>+ {day.entries.length - 5} autres</div> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 20, marginBottom: 24 }}>
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>Planning du jour</h2>
            {dayPlan.length === 0 ? (
              <div style={{ color: "#64748b" }}>Aucun mouvement aujourd’hui.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {dayPlan.map((item) => (
                  <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontWeight: 700 }}>{item.start} • {item.type}</div>
                    <div style={{ color: "#475569", marginTop: 4 }}>{item.apartment} • {item.guest}</div>
                    {item.type === "Ménage" ? <div style={{ color: "#475569", marginTop: 4 }}>{item.start} → {item.end}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>Prochains événements</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {nextEvents.length === 0 ? (
                <div style={{ color: "#64748b" }}>Aucun événement à venir.</div>
              ) : (
                nextEvents.map((event) => (
                  <div key={event.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontWeight: 700 }}>{event.type}</div>
                    <div style={{ color: "#475569", marginTop: 4 }}>{event.apartment} • {event.guest}</div>
                    <div style={{ color: "#475569", marginTop: 4 }}>{formatDate(event.date)} • {event.start}{event.end !== event.start ? ` → ${event.end}` : ""}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Réservations</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {filteredReservations.map((r) => (
              <div key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.apartment} • {r.guest}</div>
                  <div style={{ color: "#475569", marginTop: 4 }}>Du {formatDate(r.arrival)} au {formatDate(r.departure)} • {r.source}</div>
                </div>
                <button onClick={() => deleteReservation(r.id)} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Supprimer</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
