// powerautomate-flow.js - Versión Optimizada

// ============================================
// CONFIGURACIÓN DE POWER AUTOMATE
// ============================================

const POWER_AUTOMATE_CONFIG = {
  // URL del flujo para crear comisión en SharePoint
  urlCrearComision: 'https://defaultb24f0388e61b43e0b9e7baa5b0d512.1e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ee9feb90cf854eb5b99d1169640ac4e7/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=1Bm5ZyoFPCzwR7_TL8fBwMPVjafFW1qbOHPKKagxB6c',
  
  // URL del flujo para crear usuario en SharePoint
  urlCrearUsuario: 'https://defaultb24f0388e61b43e0b9e7baa5b0d512.1e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1306befbfb0f442992d051fad7e26f69/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=nhTslnG0g8EV6auNZVKX95qOCF61FQAVU-1ImQpHpr4',
  
  // URL del flujo para obtener lista de usuarios desde SharePoint
  urlObtenerUsuarios: 'https://defaultb24f0388e61b43e0b9e7baa5b0d512.1e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7257242e8ae54b8f97196d3db6f046d3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Q2b8W7HyVRDRUBOxnwXdLGk55MDnuAGEQuqbutSkReM',
  
  timeout: 30000
};

// Modo de prueba - cambiar a true para simular sin Power Automate
const MODO_PRUEBA = false;

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Realiza petición HTTP a Power Automate
 */
async function realizarPeticion(url, datos = null, metodo = 'POST') {
  if (!url || url.includes('TU_URL')) {
    throw new Error('⚠️ URL de Power Automate no configurada');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), POWER_AUTOMATE_CONFIG.timeout);

  try {
    const opciones = {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    };

    if (datos && metodo !== 'GET') {
      opciones.body = JSON.stringify(datos);
    }

    console.log(`📤 Enviando petición ${metodo} a Power Automate...`);

    const response = await fetch(url, opciones);
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = text ? { message: text } : { success: true };
    }

    if (!response.ok) {
      // Error 409 - Duplicado
      if (response.status === 409) {
        throw new Error(responseData.message || 'La cédula ya se encuentra registrada');
      }
      
      // Error 400 - Validación
      if (response.status === 400) {
        throw new Error(responseData.message || 'Datos inválidos o incompletos');
      }
      
      // Otros errores HTTP
      const errorMsg = responseData.message || responseData.error || `Error HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    console.log('✅ Respuesta:', responseData);
    return responseData;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('⏱️ Tiempo de espera agotado');
    }
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('🌐 Error de conexión. Verifica CORS en Power Automate');
    }

    throw error;
  }
}

/**
 * Formatea datos antes de enviar
 */
function formatearDatos(datos, tipo) {
  const datosFormateados = {};

  for (const [key, value] of Object.entries(datos)) {
    if (value === '' || value === null || value === undefined) {
      datosFormateados[key] = '';
      continue;
    }

    // Campos numéricos
    if (key.toLowerCase().includes('valor') || key.toLowerCase().includes('cedula')) {
      datosFormateados[key] = typeof value === 'string' ? value.trim() : value;
    } else {
      datosFormateados[key] = String(value).trim();
    }
  }

  datosFormateados.FechaRegistro = new Date().toISOString();
  datosFormateados.Origen = 'Formulario Web - Viáticos';

  return datosFormateados;
}

/**
 * Valida respuesta de Power Automate
 */
function validarRespuesta(response) {
  if (!response) return false;
  
  return (
    response.success === true ||
    response.status === 'success' ||
    response.StatusCode === 200 ||
    response.message?.toLowerCase().includes('éxito') ||
    response.message?.toLowerCase().includes('success') ||
    response.message?.toLowerCase().includes('correctamente')
  );
}

/**
 * Carga usuarios desde SharePoint
 */
async function cargarUsuarios() {
  try {
    console.log('📥 Cargando usuarios desde SharePoint...');

    const respuesta = await realizarPeticion(
      POWER_AUTOMATE_CONFIG.urlObtenerUsuarios,
      null,
      'GET'
    );

    if (!respuesta || !Array.isArray(respuesta)) {
      console.warn('⚠️ No se recibieron usuarios válidos');
      return [];
    }

    console.log(`✅ ${respuesta.length} usuarios cargados`);
    return respuesta;

  } catch (error) {
    console.error('❌ Error al cargar usuarios:', error);
    throw new Error('No se pudieron cargar los usuarios desde SharePoint');
  }
}

/**
 * Envía comisión a SharePoint
 */
async function enviarComision(datosComision) {
  try {
    console.log('📤 Enviando comisión a SharePoint...');

    const payload = {
      Nombre: datosComision.nombre,
      Cedula: datosComision.cedula,
      LugarComision: datosComision.lugarComision,
      FechaIda: datosComision.fechaIda,
      FechaRegreso: datosComision.fechaRegreso,
      FechaLegalizacion: datosComision.fechaLegalizacion,
      ObjetoComision: datosComision.objetoComision,
      NumeroCDP: datosComision.numeroCDP || '',
      NumeroRP: datosComision.numeroRP || '',
      NumeroObligacionSIIF: datosComision.numeroObligacion || '',
      Rubro: datosComision.rubro || '',
      ValorTotal: datosComision.valorTotal,
      Legalizado: datosComision.legalizado || '',
      LinkSoportes: datosComision.linkSoportes || '',
      MedioTransporte: datosComision.medioTransporte,
      ValorTiquete: datosComision.valorTiquete || ''
    };

    const datosFormateados = formatearDatos(payload, 'comision');
    console.log('📋 Datos formateados:', datosFormateados);

    const respuesta = await realizarPeticion(
      POWER_AUTOMATE_CONFIG.urlCrearComision,
      datosFormateados
    );

    const exitoso = validarRespuesta(respuesta);

    if (!exitoso) {
      throw new Error('El servidor indicó un error en el procesamiento');
    }

    console.log('📊 Envío EXITOSO');

    return {
      success: true,
      message: 'Comisión guardada correctamente en SharePoint',
      data: respuesta
    };

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

/**
 * Crea usuario en SharePoint
 */
async function crearUsuario(datosUsuario) {
  try {
    console.log('📤 Creando usuario en SharePoint...');

    const payload = {
      Nombre: datosUsuario.nombre,
      Cedula: datosUsuario.cedula
    };

    const datosFormateados = formatearDatos(payload, 'usuario');
    console.log('📋 Datos formateados:', datosFormateados);

    const respuesta = await realizarPeticion(
      POWER_AUTOMATE_CONFIG.urlCrearUsuario,
      datosFormateados
    );

    const exitoso = validarRespuesta(respuesta);

    if (!exitoso) {
      throw new Error('El servidor indicó un error en el procesamiento');
    }

    console.log('📊 Usuario creado EXITOSAMENTE');

    return {
      success: true,
      message: 'Usuario creado correctamente en SharePoint',
      data: respuesta
    };

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ============================================
// MODO PRUEBA (SIMULACIÓN)
// ============================================

async function simularCargarUsuarios() {
  console.log('🧪 MODO PRUEBA: Simulando carga de usuarios');

  await new Promise(resolve => setTimeout(resolve, 800));

  const usuariosPrueba = [
    { nombre: 'Juan Pérez García', cedula: '1234567890' },
    { nombre: 'María González López', cedula: '9876543210' },
    { nombre: 'Carlos Rodríguez Martínez', cedula: '5555555555' },
    { nombre: 'Ana Martínez Silva', cedula: '1111111111' },
    { nombre: 'Pedro Sánchez Torres', cedula: '2222222222' }
  ];

  return usuariosPrueba;
}

async function simularEnviarComision(datosComision) {
  console.log('🧪 MODO PRUEBA: Simulando envío de comisión');
  console.log('Datos:', datosComision);

  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    success: true,
    message: 'Simulación exitosa - Comisión',
    data: {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    }
  };
}

async function simularCrearUsuario(datosUsuario) {
  console.log('🧪 MODO PRUEBA: Simulando creación de usuario');
  console.log('Datos:', datosUsuario);

  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simular error de duplicado aleatoriamente (10% de probabilidad)
  if (Math.random() < 0.1) {
    throw new Error('La cédula ya se encuentra registrada');
  }

  return {
    success: true,
    message: 'Simulación exitosa - Usuario',
    data: {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    }
  };
}

function esModoPrueba() {
  return MODO_PRUEBA;
}

// ============================================
// VALIDAR CONFIGURACIÓN
// ============================================

function validarConfiguracion() {
  const configuracionIncompleta = 
    POWER_AUTOMATE_CONFIG.urlCrearComision.includes('TU_URL') ||
    POWER_AUTOMATE_CONFIG.urlCrearUsuario.includes('TU_URL') ||
    POWER_AUTOMATE_CONFIG.urlObtenerUsuarios.includes('TU_URL');

  if (configuracionIncompleta) {
    console.warn('⚠️ ATENCIÓN: URLs de Power Automate no configuradas');
    console.warn('Actualiza powerautomate-flow.js con las URLs correctas');
    return false;
  }

  return true;
}

// ============================================
// EXPORTAR MÓDULO
// ============================================

window.PowerAutomateViaticos = {
  cargarUsuarios: MODO_PRUEBA ? simularCargarUsuarios : cargarUsuarios,
  enviarComision: MODO_PRUEBA ? simularEnviarComision : enviarComision,
  crearUsuario: MODO_PRUEBA ? simularCrearUsuario : crearUsuario,
  esModoPrueba
};

// ============================================
// INICIALIZACIÓN
// ============================================

console.log('✓ Power Automate Viáticos cargado');
console.log('📊 Modo:', MODO_PRUEBA ? 'PRUEBA (Simulación)' : 'PRODUCCIÓN');

if (!MODO_PRUEBA) {
  validarConfiguracion();
}