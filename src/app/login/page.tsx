"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface Institucion {
  id: number;
  nombre: string;
}

interface RolOption {
  value: string;
  label: string;
}

export default function LoginPage() {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [form, setForm] = useState({
    institucionId: "",
    dni: "",
    password: "",
    rol: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Simulación de fetch a la BD para instituciones y roles
    // Reemplazar por fetch real a la API cuando esté disponible
    setInstituciones([
      { id: 1, nombre: "IEP San Martín" },
      { id: 2, nombre: "IEP Santa Rosa" }
    ]);
    setRoles([
      { value: "ADMIN", label: "Administrador" },
      { value: "ADMINISTRATIVO", label: "Administrativo" },
      { value: "DOCENTE", label: "Docente" },
      { value: "APODERADO", label: "Apoderado" }
    ]);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Aquí iría la lógica de login (fetch a la API)
    setTimeout(() => {
      setLoading(false);
      // Redirigir según rol, simulado
      if (form.rol === "ADMIN") {
        window.location.href = "/admin";
      } else {
        alert("Login exitoso (simulado). Implementar redirección por rol.");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6 border border-gray-100"
      >
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-4">Inicio de Sesión</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Institución Educativa</label>
          <select
            name="institucionId"
            value={form.institucionId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Seleccione una institución</option>
            {instituciones.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">DNI</label>
          <input
            type="text"
            name="dni"
            value={form.dni}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            maxLength={12}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rol</label>
          <select
            name="rol"
            value={form.rol}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Seleccione un rol</option>
            {roles.map((rol) => (
              <option key={rol.value} value={rol.value}>{rol.label}</option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        <Button type="submit" className="w-full" isLoading={loading}>
          Iniciar Sesión
        </Button>
      </form>
    </div>
  );
}
