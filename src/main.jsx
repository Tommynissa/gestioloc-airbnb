import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [reservations, setReservations] = useState([]);
  const [form, setForm] = useState({
    appartement: "Fabron",
    nom: "",
    arrivee: "",
    depart: "",
  });

  async function loadReservations() {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("arrivee", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setReservations(data || []);
  }

  useEffect(() => {
    loadReservations();
  }, []);

  async function addReservation(e) {
    e.preventDefault();

    const { error } = await supabase.from("reservations").insert([form]);

    if (error) {
      console.error(error);
      alert("Erreur lors de l'ajout");
      return;
    }

    setForm({
      appartement: "Fabron",
      nom: "",
      arrivee: "",
      depart: "",
    });

    loadReservations();
  }

  async function deleteReservation(id) {
    const { error } = await supabase.from("reservations").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Erreur lors de la suppression");
      return;
    }

    loadReservations();
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h1>GestioLoc Airbnb</h1>
      <p>Version connectée à Supabase 🚀</p>

      <form onSubmit={addReservation} style={{ display: "grid", gap: 10, marginBottom: 30 }}>
        <select
          value={form.appartement}
          onChange={(e) => setForm({ ...form, appartement: e.target.value })}
          style={{ padding: 10 }}
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
          style={{ padding: 10 }}
        />

        <input
          type="date"
          value={form.arrivee}
          onChange={(e) => setForm({ ...form, arrivee: e.target.value })}
          style={{ padding: 10 }}
        />

        <input
          type="date"
          value={form.depart}
          onChange={(e) => setForm({ ...form, depart: e.target.value })}
          style={{ padding: 10 }}
        />

        <button type="submit" style={{ padding: 12 }}>
          Ajouter
        </button>
      </form>

      <h2>Réservations</h2>

      {reservations.length === 0 ? (
        <p>Aucune réservation.</p>
      ) : (
        reservations.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <strong>{r.nom}</strong>
            <p>Appartement : {r.appartement}</p>
            <p>
              Du {r.arrivee} au {r.depart}
            </p>
            <button onClick={() => deleteReservation(r.id)}>Supprimer</button>
          </div>
        ))
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
