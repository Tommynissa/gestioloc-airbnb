import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function App() {
  const [reservations, setReservations] = useState([]);
  const [planning, setPlanning] = useState([]);
  const [form, setForm] = useState({
    appartement: "Fabron",
    nom: "",
    arrivee: "",
    depart: "",
  });

  const today = getToday();

  async function loadReservations() {
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .order("arrivee", { ascending: true });

    setReservations(data || []);
  }

  async function loadPlanning() {
    const { data } = await supabase
      .from("planning")
      .select("*")
      .order("date", { ascending: true })
      .order("heure_debut", { ascending: true });

    setPlanning(data || []);
  }

  useEffect(() => {
    loadReservations();
    loadPlanning();
  }, []);

  async function addReservation(e) {
    e.preventDefault();

    if (!form.nom || !form.arrivee || !form.depart) {
      alert("Merci de remplir tous les champs.");
      return;
    }

    if (form.depart <= form.arrivee) {
      alert("La date de départ doit être après la date d’arrivée.");
      return;
    }

    const { data, error } = await supabase
      .from("reservations")
      .insert([form])
      .select();

    if (error) {
      alert("Erreur lors de l'ajout de la réservation.");
      return;
    }

    const reservation = data?.[0];

    if (reservation) {
      const planningItems = [
        {
          appartement: reservation.appartement,
          nom: reservation.nom,
          date: reservation.arrivee,
          type: "Check-in",
          heure_debut: "16:00",
          heure_fin: "16:00",
        },
        {
          appartement: reservation.appartement,
          nom: reservation.nom,
          date: reservation.depart,
          type: "Check-out",
          heure_debut: "11:00",
          heure_fin: "11:00",
        },
        {
          appartement: reservation.appartement,
          nom: reservation.nom,
          date: reservation.depart,
          type: "Ménage",
          heure_debut: "11:15",
          heure_fin: "13:15",
        },
      ];

      const { error: planningError } = await supabase
        .from("planning")
        .insert(planningItems);

      if (planningError) {
        alert("Réservation ajoutée, mais erreur lors de la création du planning.");
      }
    }

    setForm({
      appartement: "Fabron",
      nom: "",
      arrivee: "",
      depart: "",
    });

    loadReservations();
    loadPlanning();
  }

  async function deleteReservation(id, appartement, nom, arrivee, depart) {
    await supabase
      .from("planning")
      .delete()
      .eq("appartement", appartement)
      .eq("nom", nom)
      .in("date", [arrivee, depart]);

    await supabase.from("reservations").delete().eq("id", id);

    loadReservations();
    loadPlanning();
  }

  const arrivalsToday = useMemo(
    () =>
      planning.filter(
        (item) => item.date === today && item.type === "Check-in"
      ),
    [planning, today]
  );

  const departuresToday = useMemo(
    () =>
      planning.filter(
        (item) => item.date === today && item.type === "Check-out"
      ),
    [planning, today]
  );

  const cleaningsToday = useMemo(
    () =>
      planning.filter(
        (item) => item.date === today && item.type === "Ménage"
      ),
    [planning, today]
  );

  const nextEvents = useMemo(
    () => planning.filter((item) => item.date >= today).slice(0, 10),
    [planning, today]
  );

  const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  const sectionTitle = {
    marginTop: 0,
    marginBottom: 16,
    fontSize: 24,
  };

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 1200,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        background: "#f7f7f7",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>GestioLoc Airbnb</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Dashboard locations + planning automatique
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 30,
        }}
      >
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Date du jour</h3>
          <p style={{ fontSize: 24, fontWeight: "bold", marginBottom: 0 }}>
            {today}
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Arrivées aujourd’hui</h3>
          <p style={{ fontSize: 30, fontWeight: "bold", marginBottom: 0 }}>
            {arrivalsToday.length}
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Départs aujourd’hui</h3>
          <p style={{ fontSize: 30, fontWeight: "bold", marginBottom: 0 }}>
            {departuresToday.length}
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Ménages aujourd’hui</h3>
          <p style={{ fontSize: 30, fontWeight: "bold", marginBottom: 0 }}>
            {cleaningsToday.length}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20,
          marginBottom: 30,
        }}
      >
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Arrivées du jour</h2>
          {arrivalsToday.length === 0 ? (
            <p>Aucune arrivée aujourd’hui.</p>
          ) : (
            arrivalsToday.map((item) => (
              <div
                key={item.id}
                style={{
                  borderTop: "1px solid #eee",
                  paddingTop: 10,
                  marginTop: 10,
                }}
              >
                <strong>{item.nom}</strong>
                <p style={{ margin: "6px 0" }}>{item.appartement}</p>
                <p style={{ margin: 0 }}>Heure : {item.heure_debut}</p>
              </div>
            ))
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitle}>Départs du jour</h2>
          {departuresToday.length === 0 ? (
            <p>Aucun départ aujourd’hui.</p>
          ) : (
            departuresToday.map((item) => (
              <div
                key={item.id}
                style={{
                  borderTop: "1px solid #eee",
                  paddingTop: 10,
                  marginTop: 10,
                }}
              >
                <strong>{item.nom}</strong>
                <p style={{ margin: "6px 0" }}>{item.appartement}</p>
                <p style={{ margin: 0 }}>Heure : {item.heure_debut}</p>
              </div>
            ))
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitle}>Ménages du jour</h2>
          {cleaningsToday.length === 0 ? (
            <p>Aucun ménage aujourd’hui.</p>
          ) : (
            cleaningsToday.map((item) => (
              <div
                key={item.id}
                style={{
                  borderTop: "1px solid #eee",
                  paddingTop: 10,
                  marginTop: 10,
                }}
              >
                <strong>{item.nom}</strong>
                <p style={{ margin: "6px 0" }}>{item.appartement}</p>
                <p style={{ margin: 0 }}>
                  {item.heure_debut} → {item.heure_fin}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 30 }}>
        <h2 style={sectionTitle}>Ajouter une réservation</h2>

        <form
          onSubmit={addReservation}
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <select
            value={form.appartement}
            onChange={(e) => setForm({ ...form, appartement: e.target.value })}
            style={{ padding: 12 }}
          >
            <option>Fabron</option>
            <option>Juan</option>
            <option>Killian</option>
            <option>Swan</option>
          </select>

          <input
            placeholder="Nom du voyageur"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            style={{ padding: 12 }}
          />

          <input
            type="date"
            value={form.arrivee}
            onChange={(e) => setForm({ ...form, arrivee: e.target.value })}
            style={{ padding: 12 }}
          />

          <input
            type="date"
            value={form.depart}
            onChange={(e) => setForm({ ...form, depart: e.target.value })}
            style={{ padding: 12 }}
          />

          <button
            type="submit"
            style={{
              padding: 14,
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Ajouter la réservation
          </button>
        </form>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Réservations</h2>
          {reservations.length === 0 ? (
            <p>Aucune réservation.</p>
          ) : (
            reservations.map((r) => (
              <div
                key={r.id}
                style={{
                  borderTop: "1px solid #eee",
                  paddingTop: 12,
                  marginTop: 12,
                }}
              >
                <strong>{r.nom}</strong>
                <p style={{ margin: "6px 0" }}>Appartement : {r.appartement}</p>
                <p style={{ margin: "6px 0" }}>
                  Du {r.arrivee} au {r.depart}
                </p>
                <button
                  onClick={() =>
                    deleteReservation(
                      r.id,
                      r.appartement,
                      r.nom,
                      r.arrivee,
                      r.depart
                    )
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    cursor: "pointer",
                  }}
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitle}>Prochains événements</h2>
          {nextEvents.length === 0 ? (
            <p>Aucun événement.</p>
          ) : (
            nextEvents.map((p) => (
              <div
                key={p.id}
                style={{
                  borderTop: "1px solid #eee",
                  paddingTop: 12,
                  marginTop: 12,
                }}
              >
                <strong>{p.type}</strong>
                <p style={{ margin: "6px 0" }}>{p.nom}</p>
                <p style={{ margin: "6px 0" }}>{p.appartement}</p>
                <p style={{ margin: "6px 0" }}>Date : {p.date}</p>
                <p style={{ margin: 0 }}>
                  Heure : {p.heure_debut} → {p.heure_fin}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
