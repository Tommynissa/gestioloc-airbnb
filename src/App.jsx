import React, { useEffect, useMemo, useState } from "react";

const APARTMENTS = ["Fabron", "Juan", "Killian", "Swan"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthLabel(date) {
  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function buildPlanning(reservations) {
  const rows = [];
  reservations.forEach((r) => {
    rows.push({
      id: `${r.id}-in`,
      apartment: r.apartment,
      guest: r.guest,
      date: r.arrival,
      type: "Check-in",
      start: "16:00",
    });
    rows.push({
      id: `${r.id}-out`,
      apartment: r.apartment,
      guest: r.guest,
      date: r.departure,
      type: "Check-out",
      start: "11:00",
    });
    rows.push({
      id: `${r.id}-clean`,
      apartment: r.apartment,
      guest: r.guest,
      date: r.departure,
      type: "Ménage",
      start: "11:15",
    });
  });
  return rows;
}

function getDayEntries(date, reservations) {
  const entries = [];
  reservations.forEach((r) => {
    if (r.arrival === date)
      entries.push({ apartment: r.apartment, type: "Check-in" });
    if (r.departure === date) {
      entries.push({ apartment: r.apartment, type: "Check-out" });
      entries.push({ apartment: r.apartment, type: "Ménage" });
    }
    if (date > r.arrival && date < r.departure)
      entries.push({ apartment: r.apartment, type: "Occupé" });
  });
  return entries;
}

function buildCalendar(currentMonth, reservations) {
  const first = startOfMonth(currentMonth);
  const startDay = (first.getDay() + 6) % 7;
  const startDate = addDays(first, -startDay);

  const days = [];

  for (let i = 0; i < 42; i++) {
    const d = addDays(startDate, i);
    const iso = toISODate(d);

    days.push({
      date: iso,
      inMonth: d.getMonth() === currentMonth.getMonth(),
      entries: getDayEntries(iso, reservations),
    });
  }

  return days;
}

export default function App() {
  const [reservations, setReservations] = useState([
    {
      id: 1,
      apartment: "Fabron",
      guest: "Airbnb",
      arrival: "2026-04-05",
      departure: "2026-04-10",
    },
    {
      id: 2,
      apartment: "Juan",
      guest: "Airbnb",
      arrival: "2026-04-08",
      departure: "2026-04-12",
    },
  ]);

  const [month, setMonth] = useState(new Date());

  const today = todayISO();
  const planning = buildPlanning(reservations);
  const calendar = useMemo(
    () => buildCalendar(month, reservations),
    [month, reservations]
  );

  const arrivals = planning.filter(
    (p) => p.date === today && p.type === "Check-in"
  );
  const departures = planning.filter(
    (p) => p.date === today && p.type === "Check-out"
  );
  const cleaning = planning.filter(
    (p) => p.date === today && p.type === "Ménage"
  );

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Calendrier mensuel des appartements</h1>

      {/* DASHBOARD */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div>Arrivées : {arrivals.length}</div>
        <div>Départs : {departures.length}</div>
        <div>Ménages : {cleaning.length}</div>
      </div>

      {/* NAV MOIS */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setMonth(addDays(month, -30))}>
          ← Précédent
        </button>
        <span style={{ margin: "0 10px" }}>{monthLabel(month)}</span>
        <button onClick={() => setMonth(addDays(month, 30))}>
          Suivant →
        </button>
      </div>

      {/* CALENDRIER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 10,
        }}
      >
        {calendar.map((day) => (
          <div
            key={day.date}
            style={{
              border: "1px solid #ccc",
              padding: 8,
              minHeight: 100,
              background: day.inMonth ? "white" : "#f5f5f5",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {day.date.slice(8, 10)}
            </div>

            {day.entries.map((e, i) => (
              <div key={i} style={{ fontSize: 12 }}>
                {e.apartment} - {e.type}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
