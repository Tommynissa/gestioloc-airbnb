import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [reservations, setReservations] = useState([]);
  const [planning, setPlanning] = useState([]);
  const [form, setForm] = useState({
    appartement: "Fabron",
    nom: "",
    arrivee: "",
    depart: "",
  });

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

  async function deleteReservation(id) {
    await supabase.from("planning").delete().eq("reservation_id", id);
    await supabase.from("reservations").delete().eq("id", id);

    loadReservations();
    loadPlanning();
  }

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h1>GestioLoc Airbnb</h1>
      <p>Réservations + planning automatique 🚀</p>

      <form onSubmit={addReservation} style={{ marginBottom: 30 }}>
        <h2>Ajouter une réservation</h2>

        <select
          value={form.appartement}
          onChange={(e) => setForm({ ...form, appartement: e.target.value })}
        >
          <option>Fabron</option>
          <option>Juan</option>
          <option>Killian</option>
          <option>Swan</option>
        </select>

        <input
          placeholder="Nom"
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
        />

        <input
          type="date"
          value={form.arrivee}
          onChange={(e) => setForm({ ...form, arrivee: e.target.value })}
        />

        <input
          type="date"
          value={form.depart}
          onChange={(e) => setForm({ ...form, depart: e.target.value })}
        />

        <button type="submit">Ajouter</button>
      </form>

      <div style={{ display: "flex", gap: 30 }}>
        <div style={{ flex: 1 }}>
          <h2>Réservations</h2>
          {reservations.map((r) => (
            <div key={r.id}>
              <strong>{r.nom}</strong>
              <p>{r.appartement}</p>
              <p>
                {r.arrivee} → {r.depart}
              </p>
              <button onClick={() => deleteReservation(r.id)}>
                Supprimer
              </button>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <h2>Planning</h2>
          {planning.map((p) => (
            <div key={p.id}>
              <strong>{p.type}</strong>
              <p>{p.nom}</p>
              <p>{p.appartement}</p>
              <p>{p.date}</p>
              <p>
                {p.heure_debut} → {p.heure_fin}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
