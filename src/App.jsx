import React, { useMemo, useState } from "react";

const APARTMENTS = ["Fabron", "Juan", "Killian", "Swan"];
const APARTMENT_COLORS = {
  Fabron: "#2563eb",
  Juan: "#16a34a",
  Killian: "#dc2626",
  Swan: "#a855f7",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR");
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
    rows.push({ id: `${r.id}-in`, apartment: r.apartment, guest: r.guest, date: r.arrival, type: "Check-in", start: "16:00" });
    rows.push({ id: `${r.id}-out`, apartment: r.apartment, guest: r.guest, date: r.departure, type: "Check-out", start: "11:00" });
    rows.push({ id: `${r.id}-clean`, apartment: r.apartment, guest: r.guest, date: r.departure, type: "Ménage", start: "11:15" });
  });
  return rows.sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
}

function buildCalendar(month) {
  const first = startOfMonth(month);
  const startDay = (first.getDay() + 6) % 7;
  const startDate = addDays(first, -startDay);
  const days = [];

  for (let i = 0; i < 42; i += 1) {
    const d = addDays(startDate, i);
    days.push({
      date: toISODate(d),
      inMonth: d.getMonth() === month.getMonth(),
      week: Math.floor(i / 7),
      col: i % 7,
    });
  }

  return days;
}

function buildReservationBands(month, reservations, apartmentFilter) {
  const first = startOfMonth(month);
  const startDay = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -startDay);
  const bands = [];

  reservations
    .filter((r) => apartmentFilter === "Tous" || r.apartment === apartmentFilter)
    .forEach((reservation) => {
      const start = new Date(`${reservation.arrival}T00:00:00`);
      const endExclusive = new Date(`${reservation.departure}T00:00:00`);

      for (let week = 0; week < 6; week += 1) {
        const weekStart = addDays(gridStart, week * 7);
        const weekEnd = addDays(weekStart, 7);
        const segStart = start > weekStart ? start : weekStart;
        const segEnd = endExclusive < weekEnd ? endExclusive : weekEnd;

        if (segStart < segEnd) {
          const startCol = Math.floor((segStart - weekStart) / 86400000);
          const spanDays = Math.floor((segEnd - segStart) / 86400000);
          bands.push({
            id: `${reservation.id}-${week}`,
            apartment: reservation.apartment,
            guest: reservation.guest,
            week,
            startCol,
            spanDays,
          });
        }
      }
    });

  return bands;
}

function Card({ children }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [reservations] = useState([
    { id: 1, apartment: "Fabron", guest: "Airbnb", arrival: "2026-04-05", departure: "2026-04-10" },
    { id: 2, apartment: "Juan", guest: "Airbnb", arrival: "2026-04-08", departure: "2026-04-13" },
    { id: 3, apartment: "Killian", guest: "Airbnb", arrival: "2026-04-11", departure: "2026-04-16" },
    { id: 4, apartment: "Swan", guest: "Airbnb", arrival: "2026-04-18", departure: "2026-04-22" },
    { id: 5, apartment: "Fabron", guest: "Airbnb", arrival: "2026-04-23", departure: "2026-04-28" },
  ]);

  const [month, setMonth] = useState(new Date("2026-04-01"));
  const [selectedApartment, setSelectedApartment] = useState("Tous");

  const today = todayISO();
  const filteredReservations = reservations.filter(
    (r) => selectedApartment === "Tous" || r.apartment === selectedApartment
  );
  const planning = buildPlanning(filteredReservations);
  const calendar = useMemo(() => buildCalendar(month), [month]);
  const bands = useMemo(
    () => buildReservationBands(month, reservations, selectedApartment),
    [month, reservations, selectedApartment]
  );

  const arrivals = planning.filter((p) => p.date === today && p.type === "Check-in");
  const departures = planning.filter((p) => p.date === today && p.type === "Check-out");
  const cleaning = planning.filter((p) => p.date === today && p.type === "Ménage");

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
          <div>
            <div style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: 2, fontSize: 12 }}>Gestion Airbnb</div>
            <h1 style={{ margin: "8px 0 6px", fontSize: 36 }}>Calendrier mensuel des appartements</h1>
            <p style={{ margin: 0, color: "#475569" }}>Vue type Airbnb avec bandes couleur par appartement.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              value={selectedApartment}
              onChange={(e) => setSelectedApartment(e.target.value)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
            >
              <option>Tous</option>
              {APARTMENTS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
          <Card>
            <div style={{ color: "#64748b", fontSize: 14 }}>Arrivées aujourd’hui</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{arrivals.length}</div>
          </Card>
          <Card>
            <div style={{ color: "#64748b", fontSize: 14 }}>Départs aujourd’hui</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{departures.length}</div>
          </Card>
          <Card>
            <div style={{ color: "#64748b", fontSize: 14 }}>Ménages aujourd’hui</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{cleaning.length}</div>
          </Card>
        </div>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24, textTransform: "capitalize" }}>{monthLabel(month)}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setMonth(addDays(month, -30))} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Précédent</button>
              <button onClick={() => setMonth(addDays(month, 30))} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Suivant</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            {APARTMENTS.map((apartment) => (
              <div key={apartment} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ width: 14, height: 14, borderRadius: 999, background: APARTMENT_COLORS[apartment], display: "inline-block" }} />
                {apartment}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 10, color: "#64748b", fontSize: 13, fontWeight: 700 }}>
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {Array.from({ length: 6 }).map((_, weekIndex) => {
              const weekDays = calendar.slice(weekIndex * 7, weekIndex * 7 + 7);
              const weekBands = bands.filter((band) => band.week === weekIndex);

              return (
                <div key={weekIndex} style={{ position: "relative" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                    {weekDays.map((day) => (
                      <div
                        key={day.date}
                        style={{
                          border: day.date === today ? "2px solid #111827" : "1px solid #d1d5db",
                          borderRadius: 14,
                          padding: 10,
                          minHeight: 118,
                          background: day.inMonth ? "white" : "#f5f5f5",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontWeight: "bold", color: day.inMonth ? "#111827" : "#9ca3af" }}>{day.date.slice(8, 10)}</div>
                          {day.date === today ? (
                            <div style={{ fontSize: 10, background: "#111827", color: "white", borderRadius: 999, padding: "3px 7px" }}>
                              Aujourd’hui
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ position: "absolute", left: 0, right: 0, top: 34, pointerEvents: "none" }}>
                    {weekBands.map((band, index) => (
                      <div
                        key={band.id}
                        style={{
                          position: "absolute",
                          left: `calc(${band.startCol} * (100% / 7) + ${band.startCol * 8}px)`,
                          width: `calc(${band.spanDays} * (100% / 7) + ${(band.spanDays - 1) * 8}px)`,
                          transform: `translateY(${index * 28}px)`,
                          height: 24,
                          borderRadius: 999,
                          background: APARTMENT_COLORS[band.apartment],
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          padding: "0 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          opacity: 0.95,
                        }}
                      >
                        {band.apartment}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <Card>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>Planning du jour</h2>
            {planning.filter((p) => p.date === today).length === 0 ? (
              <p style={{ color: "#64748b" }}>Aucun mouvement aujourd’hui.</p>
            ) : (
              planning.filter((p) => p.date === today).map((item) => (
                <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700 }}>{item.start} • {item.type}</div>
                  <div style={{ color: "#475569", marginTop: 4 }}>{item.apartment} • {item.guest}</div>
                </div>
              ))
            )}
          </Card>

          <Card>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>Réservations</h2>
            {filteredReservations.map((r) => (
              <div key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>{r.apartment}</div>
                <div style={{ color: "#475569", marginTop: 4 }}>Du {formatDate(r.arrival)} au {formatDate(r.departure)}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
