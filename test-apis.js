// Script para probar TODAS las APIs del sistema
const BASE_URL = 'http://localhost:3000';

let TOKEN = '';
let createdIds = {}; // Para guardar IDs creados y usarlos en otras pruebas

async function login() {
  try {
    console.log('🔐 Intentando login con admin...');
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@franciscobolognesi.edu.pe',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      TOKEN = data.data?.token || data.token;
      console.log('✅ Login exitoso');
      console.log('   Rol:', data.data?.user?.rol);
      return true;
    } else {
      const errorData = await response.json();
      console.log('❌ Login fallido:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ Error en login:', error.message);
    return false;
  }
}

async function testAPI(name, url, method = 'GET', body = null) {
  console.log(`\n📡 Probando: ${name}`);
  console.log(`   URL: ${url}`);
  console.log(`   Método: ${method}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${url}`, options);
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
      if (typeof data === 'object') {
        console.log(`   📦 Respuesta:`, JSON.stringify(data).substring(0, 200) + '...');
      }
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   📦 Error:`, data);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('🧪 PRUEBAS COMPLETAS DE TODAS LAS APIs DEL SISTEMA');
  console.log('='.repeat(70));
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n⚠️ No se pudo hacer login. Abortando pruebas.');
    return;
  }

  // ============================================================
  // 1. APIs DE USUARIOS
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('👥 APIs DE USUARIOS');
  console.log('='.repeat(70));

  // Crear Administrativo
  const adminData = {
    nombre: 'Test',
    apellido: 'Administrativo',
    dni: '99999901',
    email: 'test.admin@test.com',
    password: 'test123',
    telefono: '999888777',
    direccion: 'Calle Test 123',
    idIe: 1
  };
  const adminResult = await testAPI('Crear Administrativo', '/api/usuarios/administrativos', 'POST', adminData);
  if (adminResult.success) createdIds.administrativo = adminResult.data?.data?.idUsuario;

  // Crear Docente
  const docenteData = {
    nombre: 'Test',
    apellido: 'Docente',
    dni: '99999902',
    email: 'test.docente@test.com',
    password: 'test123',
    telefono: '999888776',
    especialidad: 'Matemáticas',
    idIe: 1
  };
  const docenteResult = await testAPI('Crear Docente', '/api/usuarios/docentes', 'POST', docenteData);
  if (docenteResult.success) createdIds.docente = docenteResult.data?.data?.idUsuario;

  // Crear Auxiliar
  const auxiliarData = {
    nombre: 'Test',
    apellido: 'Auxiliar',
    dni: '99999903',
    email: 'test.auxiliar@test.com',
    password: 'test123',
    telefono: '999888775',
    idIe: 1
  };
  const auxiliarResult = await testAPI('Crear Auxiliar', '/api/usuarios/auxiliares', 'POST', auxiliarData);
  if (auxiliarResult.success) createdIds.auxiliar = auxiliarResult.data?.data?.idUsuario;

  // Crear Apoderado
  const apoderadoData = {
    nombre: 'Test',
    apellido: 'Apoderado',
    dni: '99999904',
    email: 'test.apoderado@test.com',
    password: 'test123',
    telefono: '999888774',
    direccion: 'Av. Test 456',
    parentesco: 'Padre',
    idIe: 1
  };
  const apoderadoResult = await testAPI('Crear Apoderado', '/api/usuarios/apoderados', 'POST', apoderadoData);
  if (apoderadoResult.success) createdIds.apoderado = apoderadoResult.data?.data?.idUsuario;

  // Listar usuarios
  await testAPI('Listar Administrativos', '/api/usuarios/administrativos');
  await testAPI('Listar Docentes', '/api/usuarios/docentes');
  await testAPI('Listar Auxiliares', '/api/usuarios/auxiliares');
  await testAPI('Listar Apoderados', '/api/usuarios/apoderados');

  // ============================================================
  // 2. APIs DE ESTUDIANTES
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('🎓 APIs DE ESTUDIANTES');
  console.log('='.repeat(70));

  const estudianteData = {
    nombre: 'Test',
    apellido: 'Estudiante',
    dni: '99999905',
    fechaNacimiento: '2015-05-15',
    direccion: 'Jr. Test 789',
    idGrado: 1,
    idSeccion: 1,
    idApoderado: createdIds.apoderado || 1
  };
  const estudianteResult = await testAPI('Crear Estudiante', '/api/estudiantes', 'POST', estudianteData);
  if (estudianteResult.success) createdIds.estudiante = estudianteResult.data?.data?.idEstudiante;

  await testAPI('Listar Estudiantes', '/api/estudiantes');
  await testAPI('Buscar Estudiante por DNI', '/api/estudiantes/buscar?dni=99999905');

  // ============================================================
  // 3. APIs DE CLASES/HORARIOS
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('📚 APIs DE CLASES Y HORARIOS');
  console.log('='.repeat(70));

  const claseData = {
    idDocente: createdIds.docente || 1,
    idGrado: 1,
    idSeccion: 1,
    diaSemana: 'LUNES',
    horaInicio: '08:00',
    horaFin: '09:30',
    materia: 'Matemáticas Test',
    aula: 'Aula Test'
  };
  const claseResult = await testAPI('Crear Clase/Horario', '/api/clases', 'POST', claseData);
  if (claseResult.success) createdIds.clase = claseResult.data?.data?.idClase;

  await testAPI('Listar Clases', '/api/clases');
  await testAPI('Horarios del Docente', '/api/docentes/horarios');

  // ============================================================
  // 4. APIs DE TOLERANCIA
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('⏰ APIs DE TOLERANCIA');
  console.log('='.repeat(70));

  // Tolerancia Global (Auxiliar)
  await testAPI('Obtener Tolerancia Global', '/api/auxiliar/tolerancia/global');
  
  const toleranciaGlobalData = {
    toleranciaMinutos: 15,
    horaInicio: '07:30',
    horaFin: '08:00'
  };
  await testAPI('Actualizar Tolerancia Global', '/api/auxiliar/tolerancia/global', 'PUT', toleranciaGlobalData);

  // Tolerancia por Aula (Auxiliar)
  await testAPI('Listar Aulas para Tolerancia', '/api/auxiliar/tolerancia/aulas');
  
  const toleranciaAulaData = {
    idGrado: 1,
    idSeccion: 1,
    toleranciaMinutos: 10,
    horaInicio: '07:45',
    horaFin: '08:15'
  };
  await testAPI('Configurar Tolerancia por Aula', '/api/auxiliar/tolerancia/seleccionadas', 'POST', toleranciaAulaData);

  // Tolerancia Individual (Docente)
  if (createdIds.clase) {
    const toleranciaDocenteData = {
      idClase: createdIds.clase,
      toleranciaMinutos: 5
    };
    await testAPI('Configurar Tolerancia Docente', '/api/auxiliar/tolerancia/individual', 'POST', toleranciaDocenteData);
  }

  // ============================================================
  // 5. APIs DE ASISTENCIA Y FLUJO PORTERÍA → DOCENTE
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('✅ APIs DE ASISTENCIA Y FLUJO PORTERÍA → DOCENTE');
  console.log('='.repeat(70));

  // Obtener estudiantes para asistencia
  await testAPI('Estudiantes para Asistencia', '/api/auxiliar/asistencia/estudiantes?grado=1&seccion=A');

  // NUEVO: Registrar ingreso en portería (QR)
  const ingresoPorteriaData = {
    codigoQR: 'EST0001',
    dni: null
  };
  await testAPI('🚪 Registrar Ingreso Portería (QR)', '/api/porteria/ingreso', 'POST', ingresoPorteriaData);

  // NUEVO: Obtener ingresos del día
  await testAPI('🚪 Listar Ingresos del Día', '/api/porteria/ingreso?fecha=' + new Date().toISOString().split('T')[0]);

  // NUEVO: Obtener asistencia precargada para docente
  await testAPI('📋 Asistencia Precargada (Docente)', '/api/docentes/asistencia/precargada?grado=1°&seccion=A');

  // NUEVO: Validar asistencia (Docente confirma presencia)
  const validarAsistenciaData = {
    idClase: null,
    fecha: new Date().toISOString().split('T')[0],
    asistencias: [
      { idEstudiante: 1, estado: 'PRESENTE', observaciones: 'Validado en aula' },
      { idEstudiante: 2, estado: 'TARDANZA', observaciones: 'Llegó 5 min tarde' }
    ]
  };
  await testAPI('✅ Validar Asistencia (Docente)', '/api/docentes/asistencia/validar', 'POST', validarAsistenciaData);

  // Registrar entrada (Auxiliar - método anterior)
  const entradaData = {
    idEstudiante: 1,
    horaEntrada: new Date().toISOString()
  };
  await testAPI('Registrar Entrada (Auxiliar)', '/api/auxiliar/asistencia/entrada', 'POST', entradaData);

  // Guardar asistencia completa
  const asistenciaData = {
    fecha: new Date().toISOString().split('T')[0],
    idGrado: 1,
    idSeccion: 1,
    asistencias: [
      { idEstudiante: 1, estado: 'PRESENTE', observaciones: 'Test' }
    ]
  };
  await testAPI('Guardar Asistencia', '/api/auxiliar/asistencia/guardar', 'POST', asistenciaData);

  // Escaneo QR
  const qrData = {
    codigoQR: 'EST0001',
    tipo: 'entrada'
  };
  await testAPI('Escanear QR Asistencia', '/api/auxiliar/asistencia/qr-scan', 'POST', qrData);

  // ============================================================
  // 6. APIs DE RETIROS
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('🚪 APIs DE RETIROS');
  console.log('='.repeat(70));

  // Crear retiro (Auxiliar)
  const retiroData = {
    idEstudiante: createdIds.estudiante || 1,
    motivo: 'Cita médica de prueba',
    tipoRetiro: 'TEMPRANO',
    horaRetiro: new Date().toISOString(),
    apoderadoQueRetira: 'Test Apoderado',
    observaciones: 'Retiro de prueba'
  };
  const retiroResult = await testAPI('Crear Retiro (Auxiliar)', '/api/auxiliar/retiros', 'POST', retiroData);
  if (retiroResult.success) createdIds.retiro = retiroResult.data?.data?.idRetiro;

  await testAPI('Listar Retiros (Auxiliar)', '/api/auxiliar/retiros');

  // Retiro desde panel apoderado
  const retiroApoderadoData = {
    idEstudiante: createdIds.estudiante || 1,
    motivo: 'Emergencia familiar',
    fechaRetiro: new Date().toISOString().split('T')[0],
    horaRetiro: '11:00'
  };
  await testAPI('Solicitar Retiro (Apoderado)', '/api/apoderados/retiros', 'POST', retiroApoderadoData);
  await testAPI('Listar Retiros (Apoderado)', '/api/apoderados/retiros');

  // Actualizar estado de retiro
  if (createdIds.retiro) {
    const actualizarRetiroData = { estado: 'AUTORIZADO' };
    await testAPI('Actualizar Retiro', `/api/auxiliar/retiros/${createdIds.retiro}`, 'PUT', actualizarRetiroData);
  }

  // ============================================================
  // 7. APIs DE JUSTIFICACIONES
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('📄 APIs DE JUSTIFICACIONES');
  console.log('='.repeat(70));

  const justificacionData = {
    idEstudiante: createdIds.estudiante || 1,
    fecha: new Date().toISOString().split('T')[0],
    motivo: 'Enfermedad - Prueba',
    tipoJustificacion: 'MEDICA',
    documentoAdjunto: null
  };
  const justResult = await testAPI('Crear Justificación', '/api/justificaciones', 'POST', justificacionData);
  if (justResult.success) createdIds.justificacion = justResult.data?.data?.idJustificacion;

  await testAPI('Listar Justificaciones', '/api/justificaciones');

  if (createdIds.justificacion) {
    await testAPI('Aprobar Justificación', `/api/justificaciones/${createdIds.justificacion}/aprobar`, 'PUT', { estado: 'APROBADO' });
  }

  // ============================================================
  // 8. APIs DE CAMBIO DE HORA
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('🕐 APIs DE CAMBIO DE HORA INGRESO/SALIDA');
  console.log('='.repeat(70));

  // Cambiar hora de ingreso/salida global
  const horariosData = {
    horaIngreso: '07:30',
    horaSalida: '13:30',
    horaIngresoTarde: '13:00',
    horaSalidaTarde: '18:00'
  };
  await testAPI('Configurar Horarios Institución', '/api/configuracion/horarios', 'PUT', horariosData);
  await testAPI('Obtener Horarios Institución', '/api/configuracion/horarios');

  // ============================================================
  // 9. APIs DE REPORTES
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 APIs DE REPORTES');
  console.log('='.repeat(70));

  await testAPI('Reporte Mensual Docente', '/api/docentes/reportes?tipo=mensual');
  await testAPI('Reporte Auxiliar', '/api/auxiliar/reportes/generar?fechaInicio=2024-01-01&fechaFin=2024-12-31&tipoReporte=mensual');

  // ============================================================
  // 10. APIs AUXILIARES
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('🔧 APIs AUXILIARES');
  console.log('='.repeat(70));

  await testAPI('Grados', '/api/grados?ieId=1');
  await testAPI('Secciones', '/api/secciones?ieId=1');
  await testAPI('Dashboard Docente', '/api/docentes/dashboard');
  await testAPI('Dashboard Admin', '/api/admin/dashboard');

  // ============================================================
  // RESUMEN
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('✅ PRUEBAS COMPLETADAS');
  console.log('='.repeat(70));
  console.log('IDs creados durante las pruebas:', createdIds);
}

runTests().catch(console.error);
