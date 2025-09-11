import React from "react";

export default function AdminDashboard() {
  // Simulación de datos de usuario e institución (reemplazar por datos reales de sesión)
  const institucion = "IEP San Martín";
  const usuario = "admin@sanmartin.edu";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-indigo-700 mb-4">Bienvenido al Panel Administrativo</h1>
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-600">Institución:</span>
          <span className="text-indigo-700 font-bold">{institucion}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-600">Usuario:</span>
          <span className="text-gray-800 font-bold">{usuario}</span>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <span className="text-gray-500">Accesos rápidos:</span>
          <div className="grid grid-cols-2 gap-4">
            <a href="/admin/usuarios/docente" className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-2 px-4 rounded shadow text-center transition">Gestión Docentes</a>
            <a href="/admin/asistencia/grados" className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-2 px-4 rounded shadow text-center transition">Asistencia Grados</a>
            <a href="/admin/horarios/general" className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold py-2 px-4 rounded shadow text-center transition">Horario General</a>
            <a href="/admin/asistencia/retiros" className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded shadow text-center transition">Retiros</a>
          </div>
        </div>
      </div>
    </div>
  );
}
