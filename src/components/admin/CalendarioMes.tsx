"use client";
import { useHorarios } from '@/hooks/useHorarios';
import { useState } from 'react';

const daysSpanish = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export default function CalendarioMes() {
  const { horarios, loading } = useHorarios();
  const [week, setWeek] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    const day = monday.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // adjust when sunday
    monday.setDate(monday.getDate() + diff);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  });

  if (loading) return <p>Cargando horarios...</p>;

  const horariosPorDia: Record<string, typeof horarios> = {};
  horarios.forEach(h => {
    if (!horariosPorDia[h.diaSemana]) horariosPorDia[h.diaSemana] = [];
    horariosPorDia[h.diaSemana].push(h);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {daysSpanish.map((dia, idx) => {
        const date = week[idx];
        const key = dia.toUpperCase();
        const list = horariosPorDia[key] || [];
        return (
          <div key={dia} className="bg-white shadow rounded p-3">
            <h3 className="font-bold text-indigo-700 mb-2">
              {dia} {date.getDate()}/{date.getMonth()+1}
            </h3>
            {list.length === 0 ? (
              <p className="text-sm text-gray-500">Sin clases</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {list.map(h => (
                  <li key={h.id} className="border p-1 rounded">
                    <span className="font-medium">{h.horaInicio}-{h.horaFin}</span> <br/>
                    {h.materia} - {h.grado}{h.seccion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
