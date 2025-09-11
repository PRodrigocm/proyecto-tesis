"use client";

import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    // Simulate an API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            Sistema de Gestión Escolar
          </h1>
          
          <div className="bg-card p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">Bienvenido al sistema</h2>
            <p className="text-muted-foreground mb-6">
              Este es un sistema de gestión escolar desarrollado con Next.js, Tailwind CSS y TypeScript.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="default" 
                onClick={handleClick}
                isLoading={isLoading}
              >
                {isLoading ? 'Procesando...' : 'Comenzar'}
              </Button>
              
              <Button variant="outline">
                Más información
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Estudiantes</h3>
              <p className="text-muted-foreground mb-4">
                Gestión de estudiantes, calificaciones y asistencia.
              </p>
              <Button variant="ghost" className="mt-2">
                Ver estudiantes
              </Button>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Docentes</h3>
              <p className="text-muted-foreground mb-4">
                Administración de docentes y asignación de cursos.
              </p>
              <Button variant="ghost" className="mt-2">
                Ver docentes
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
