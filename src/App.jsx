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
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .order("arrivee", { ascending: true });

    setReservations(data || []);
  }

  useEffect(() => {
    loadReservations();
  }, []);

  async function addReservation(e) {
    e.preventDefault();

    await supabase.from("reservations").insert([form]);

    setForm({
      appartement: "Fabron",
      nom: "",
      arrivee: "",
      depart: "",
    });

    loadReservations();
  }

  async function deleteReservation(id) {
    await supabase.from("reservations").delete().eq("id", id);
    loadReservations();
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>GestioLoc Airbnb</h1>

      <form onSubmit={addReservation} style={{ marginBottom: 20 }}>
        <select
          value={form.appartement}
          onChange={(e) =>
            setForm({ ...form, appartement: e.target.value })
          }
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

        <button>Ajouter</button>
      </form>

      {reservations.map((r) => (
        <div key={r.id}>
          {r.nom} - {r.appartement} ({r.arrivee} → {r.depart})
          <button onClick={() => deleteReservation(r.id)}>❌</button>
        </div>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
