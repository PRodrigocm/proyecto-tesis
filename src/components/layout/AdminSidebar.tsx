import React, { useState } from "react";

const menu = [
  {
    label: "Usuarios",
    children: [
      { label: "Docente", href: "/admin/usuarios/docente" },
      { label: "Apoderado", href: "/admin/usuarios/apoderado" },
      { label: "Estudiante", href: "/admin/usuarios/estudiante" },
      { label: "Administrativo", href: "/admin/usuarios/administrativo" },
    ],
  },
  {
    label: "Horarios",
    children: [
      { label: "Horario General", href: "/admin/horarios/general" },
      { label: "Horario Grados y Sección", href: "/admin/horarios/grados" },
      { label: "Horario Taller", href: "/admin/horarios/taller" },
    ],
  },
  {
    label: "Asistencia",
    children: [
      { label: "Grados y Sección", href: "/admin/asistencia/grados" },
      { label: "Retiros", href: "/admin/asistencia/retiros" },
    ],
  },
];

export default function AdminSidebar() {
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (label: string) => {
    setOpen(open === label ? null : label);
  };

  return (
    <aside className="w-64 bg-white border-r shadow-lg min-h-full pt-8">
      <nav className="space-y-2 px-4">
        {menu.map((item) => (
          <div key={item.label}>
            <button
              className="flex items-center w-full py-2 px-2 text-left font-semibold text-gray-700 hover:bg-indigo-50 rounded transition"
              onClick={() => toggle(item.label)}
            >
              <span className="flex-1">{item.label}</span>
              <svg className={`w-4 h-4 ml-2 transform transition-transform ${open === item.label ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            {open === item.label && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children.map((sub) => (
                  <a
                    key={sub.label}
                    href={sub.href}
                    className="block py-1 px-2 rounded text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition"
                  >
                    {sub.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
