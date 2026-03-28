import React, { useMemo, useState } from "react";

const APARTMENTS = ["Fabron", "Juan", "Killian", "Swan"];
const APARTMENT_COLORS = {
  Fabron: { solid: "#2563eb", soft: "#dbeafe", text: "#1d4ed8" },
  Juan: { solid: "#16a34a", soft: "#dcfce7", text: "#15803d" },
  Killian: { solid: "#dc2626", soft: "#fee2e2", text: "#b91c1c" },
  Swan: { solid: "#a855f7", soft: "#f3e8ff", text: "#9333ea" },
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
            arrival: reservation.arrival,
            departure: reservation.departure,
          });
        }
      }
    });

  return bands;
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        padding: 20,
        boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
        ...style,
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
    { id: 6, apartment: "Juan", guest: "Airbnb", arrival: "2026-04-24", departure: "2026-04-29" },
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
  const dayPlan = planning.filter((p) => p.date === today).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Inter, Arial, sans-serif",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        minHeight: "100vh",
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1380, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: 2, fontSize: 12, fontWeight: 700 }}>Gestion Airbnb</div>
            <h1 style={{ margin: "8px 0 6px", fontSize: 40, lineHeight: 1.05 }}>Calendrier mensuel premium</h1>
            <p style={{ margin: 0, color: "#475569", fontSize: 16 }}>Vue inspirée d’Airbnb avec bandes de séjour colorées par appartement.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selectedApartment}
              onChange={(e) => setSelectedApartment(e.target.value)}
              style={{ padding: 12, borderRadius: 14, border: "1px solid #cbd5e1", background: "white", minWidth: 170 }}
            >
              <option>Tous</option>
              {APARTMENTS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <button style={{ border: 0, background: "#0f172a", color: "white", borderRadius: 14, padding: "12px 16px", fontWeight: 700, cursor: "pointer" }}>
              Synchroniser les calendriers
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 22 }}>
          {[
            ["Arrivées aujourd’hui", arrivals.length],
            ["Départs aujourd’hui", departures.length],
            ["Ménages aujourd’hui", cleaning.length],
            ["Séjours visibles", filteredReservations.length],
          ].map(([label, value]) => (
            <Card key={label}>
              <div style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{value}</div>
            </Card>
          ))}
        </div>

        <Card style={{ marginBottom: 22, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 26, textTransform: "capitalize" }}>{monthLabel(month)}</h2>
              <div style={{ color: "#64748b", marginTop: 6 }}>Lecture visuelle des séjours comme sur une vue calendrier de location.</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setMonth(addDays(month, -30))} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600 }}>Précédent</button>
              <button onClick={() => setMonth(addDays(month, 30))} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600 }}>Suivant</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
            {APARTMENTS.map((apartment) => (
              <div key={apartment} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#334155" }}>
                <span style={{ width: 14, height: 14, borderRadius: 999, background: APARTMENT_COLORS[apartment].solid, display: "inline-block" }} />
                {apartment}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 12, color: "#64748b", fontSize: 13, fontWeight: 700 }}>
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day} style={{ paddingLeft: 4 }}>{day}</div>
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
                          border: day.date === today ? "2px solid #111827" : "1px solid #dbe3ee",
                          borderRadius: 18,
                          padding: 12,
                          minHeight: 138,
                          background: day.inMonth ? "white" : "#f8fafc",
                          boxShadow: day.date === today ? "0 0 0 3px rgba(17,24,39,0.05)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div style={{ fontWeight: 800, color: day.inMonth ? "#111827" : "#9ca3af", fontSize: 15 }}>{day.date.slice(8, 10)}</div>
                          {day.date === today ? (
                            <div style={{ fontSize: 10, background: "#111827", color: "white", borderRadius: 999, padding: "4px 8px", fontWeight: 700 }}>
                              Aujourd’hui
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ position: "absolute", left: 0, right: 0, top: 42, pointerEvents: "none" }}>
                    {weekBands.map((band, index) => {
                      const palette = APARTMENT_COLORS[band.apartment];
                      return (
                        <div
                          key={band.id}
                          style={{
                            position: "absolute",
                            left: `calc(${band.startCol} * (100% / 7) + ${band.startCol * 8}px + 6px)`,
                            width: `calc(${band.spanDays} * (100% / 7) + ${(band.spanDays - 1) * 8}px - 12px)`,
                            transform: `translateY(${index * 30}px)`,
                            height: 28,
                            borderRadius: 999,
                            background: palette.solid,
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 12px",
                            fontSize: 12,
                            fontWeight: 800,
                            boxShadow: "0 8px 18px rgba(15,23,42,0.14)",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            opacity: 0.97,
                          }}
                        >
                          <span>{band.apartment}</span>
                          <span style={{ opacity: 0.92 }}>{formatDate(band.arrival).slice(0, 5)} → {formatDate(band.departure).slice(0, 5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1.3fr", gap: 20 }}>
          <Card style={{ padding: 14 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>Planning du jour</h2>
            {dayPlan.length === 0 ? (
              <p style={{ color: "#64748b" }}>Aucun mouvement aujourd’hui.</p>
            ) : (
              dayPlan.map((item) => {
                const palette = APARTMENT_COLORS[item.apartment];
                return (
                  <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 10, marginBottom: 10, background: palette.soft }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 800, color: palette.text }}>{item.start} • {item.type}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: palette.text }}>{item.apartment}</div>
                    </div>
                    <div style={{ color: "#475569", marginTop: 6 }}>{item.guest}</div>
                  </div>
                );
              })
            )}
          </Card>

          <Card>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>Séjours visibles</h2>
            {filteredReservations.map((r) => {
              const palette = APARTMENT_COLORS[r.apartment];
              return (
                <div key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 10, marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{r.apartment}</div>
                    <div style={{ color: "#475569", marginTop: 4 }}>Du {formatDate(r.arrival)} au {formatDate(r.departure)}</div>
                  </div>
                  <div style={{ minWidth: 92, textAlign: "right" }}>
                    <div style={{ background: palette.soft, color: palette.text, border: `1px solid ${palette.solid}33`, borderRadius: 999, padding: "6px 10px", fontWeight: 700, fontSize: 12 }}>
                      {r.guest}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}
