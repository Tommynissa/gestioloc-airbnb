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
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("arrivee", { ascending: true });

    if (error) {
      console.error("Erreur chargement réservations:", error);
      alert("Erreur chargement réservations : " + JSON.stringify(error));
      return;
    }

    setReservations(data || []);
  }

  async function loadPlanning() {
    const { data, error } = await supabase
      .from("planning")
      .select("*")
      .order("date", { ascending: true })
      .order("heure_debut", { ascending: true });

    if (error) {
      console.error("Erreur chargement planning:", error);
      alert("Erreur chargement planning : " + JSON.stringify(error));
      return;
    }

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
      console.error("Erreur ajout réservation:", error);
      alert("Erreur ajout réservation : " + JSON.stringify(error));
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
        console.error("Erreur création planning:", planningError);
        alert("Erreur planning complète : " + JSON.stringify(planningError));
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
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erreur suppression réservation:", error);
      alert("Erreur suppression réservation : " + JSON.stringify(error));
      return;
    }

    loadReservations();
    loadPlanning();
  }

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 1100,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>GestioLoc Airbnb</h1>
      <p>Réservations + planning automatique 🚀</p>

      <form
        onSubmit={addReservation}
        style={{
          display: "grid",
          gap: 10,
          marginBottom: 30,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
        }}
      >
        <h2 style={{ margin: 0 }}>Ajouter une réservation</h2>

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
          Ajouter la réservation
        </button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        <div>
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
                <button onClick={() => deleteReservation(r.id)}>
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>

        <div>
          <h2>Planning</h2>

          {planning.length === 0 ? (
            <p>Aucun planning.</p>
          ) : (
            planning.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <strong>{item.type}</strong>
                <p>{item.nom}</p>
                <p>Appartement : {item.appartement}</p>
                <p>Date : {item.date}</p>
                <p>
                  Heure : {item.heure_debut} → {item.heure_fin}
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
