import React, { useState } from "react";

export default function App() {
  const [reservations, setReservations] = useState([]);

  return (
    <div style={{ padding: 20 }}>
      <h1>GestioLoc Airbnb</h1>
      <p>Version web prête à déployer 🚀</p>
      <button onClick={() => setReservations([...reservations, { id: Date.now() }])}>
        Ajouter réservation test
      </button>
      <p>Total réservations: {reservations.length}</p>
    </div>
  );
}
