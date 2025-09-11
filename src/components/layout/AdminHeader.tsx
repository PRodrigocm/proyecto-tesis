import React from "react";

export default function AdminHeader() {
  // Simulación: estos valores deberían venir de un contexto de sesión
  const institucion = "IEP San Martín";
  const usuario = "admin@sanmartin.edu";

  return (
    <header className="w-full bg-indigo-700 text-white px-6 py-4 flex items-center justify-between shadow">
      <div className="font-bold text-lg">{institucion}</div>
      <div className="flex items-center gap-4">
        <span className="font-semibold">{usuario}</span>
        <img
          src="https://ui-avatars.com/api/?name=Admin"
          alt="Avatar"
          className="w-8 h-8 rounded-full border-2 border-white shadow"
        />
      </div>
    </header>
  );
}
