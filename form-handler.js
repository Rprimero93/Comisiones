// form-handler.js - Versión Optimizada

// ============================================
// CONFIGURACIÓN Y DATOS GLOBALES
// ============================================

let datosSharePoint = {
  usuarios: []
};

// ============================================
// ELEMENTOS DEL DOM
// ============================================

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const formRegistroComision = document.getElementById('form-registro-comision');
const formCreacionUsuario = document.getElementById('form-creacion-usuario');
const allInputs = document.querySelectorAll('input, select, textarea');

// ============================================
// MANEJO DE TABS
// ============================================

function inicializarTabs() {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remover clase active de todos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activar tab seleccionado
      button.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

// ============================================
// VALIDACIÓN DE CAMPOS
// ============================================

function validarCampo(campo) {
  const valor = campo.value.trim();
  const esRequerido = campo.hasAttribute('required');
  
  campo.classList.remove('valid', 'invalid');
  
  if (esRequerido && valor === '') {
    campo.classList.add('invalid');
    return false;
  }
  
  if (valor !== '') {
    // Validación para cédula (solo números)
    if (campo.id.includes('cedula')) {
      if (!/^\d+$/.test(valor)) {
        campo.classList.add('invalid');
        return false;
      }
    }
    
    // Validación para nombre (solo letras y espacios)
    if (campo.id.includes('nombre') && campo.tagName === 'INPUT') {
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
        campo.classList.add('invalid');
        return false;
      }
    }
    
    // Validación para valores monetarios
    if (campo.id.includes('valor')) {
      const numeroLimpio = obtenerValorNumerico(valor);
      if (numeroLimpio && !/^\d+$/.test(numeroLimpio)) {
        campo.classList.add('invalid');
        return false;
      }
    }
    
    // Validación para URLs
    if (campo.id.includes('link')) {
      if (valor !== '' && !isValidURL(valor)) {
        campo.classList.add('invalid');
        return false;
      }
    }
    
    campo.classList.add('valid');
    return true;
  }
  
  return true;
}

function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function validarFormulario(form) {
  let esValido = true;
  const campos = form.querySelectorAll('input[required], select[required], textarea[required]');
  
  campos.forEach(campo => {
    if (!validarCampo(campo)) {
      esValido = false;
    }
  });
  
  return esValido;
}

// ============================================
// EVENT LISTENERS PARA VALIDACIÓN
// ============================================

function inicializarValidacion() {
  allInputs.forEach(input => {
    input.addEventListener('blur', () => validarCampo(input));
    input.addEventListener('focus', () => input.classList.remove('invalid'));
  });
}

// ============================================
// BLOQUEAR NÚMEROS EN CAMPOS DE NOMBRE
// ============================================

function inicializarCamposNombre() {
  const campoNombreUsuario = document.getElementById('nombre-usuario');
  if (campoNombreUsuario) {
    campoNombreUsuario.addEventListener('input', function() {
      this.value = this.value.replace(/[0-9]/g, '');
    });
  }
}

// ============================================
// FORMATO DE VALORES MONETARIOS
// ============================================

function formatearValorMonetario(valor) {
  const numeroLimpio = valor.replace(/\D/g, '');
  
  if (numeroLimpio === '') return '';
  
  const numero = parseInt(numeroLimpio);
  const formateado = numero.toLocaleString('es-CO');
  
  return `$ ${formateado}`;
}

function obtenerValorNumerico(valorFormateado) {
  return valorFormateado.replace(/\$|\s|\./g, '');
}

function manejarInputMonetario(event) {
  const input = event.target;
  const cursorPos = input.selectionStart;
  const valorAnterior = input.value;
  const longitudAnterior = valorAnterior.length;
  
  const valorFormateado = formatearValorMonetario(input.value);
  input.value = valorFormateado;
  
  const longitudNueva = valorFormateado.length;
  const diferencia = longitudNueva - longitudAnterior;
  const nuevaPosicion = cursorPos + diferencia;
  
  input.setSelectionRange(nuevaPosicion, nuevaPosicion);
}

function permitirSoloNumeros(event) {
  const tecla = event.key;
  const permitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
  
  if (permitidas.includes(tecla)) return;
  
  if (!/^\d$/.test(tecla)) {
    event.preventDefault();
  }
}

function inicializarCamposMonetarios() {
  const camposMonetarios = ['valor-total', 'valor-tiquete'];
  
  camposMonetarios.forEach(campoId => {
    const campo = document.getElementById(campoId);
    
    if (campo) {
      campo.addEventListener('input', manejarInputMonetario);
      campo.addEventListener('keydown', permitirSoloNumeros);
      
      campo.addEventListener('paste', function(e) {
        e.preventDefault();
        const textoPegado = (e.clipboardData || window.clipboardData).getData('text');
        const numeroLimpio = textoPegado.replace(/\D/g, '');
        this.value = formatearValorMonetario(numeroLimpio);
      });
    }
  });
}

// ============================================
// FORMATO DE FECHAS
// ============================================

function formatearFecha(fecha) {
  if (!fecha) return '';
  
  const partes = fecha.split('-');
  if (partes.length === 3) {
    // Convertir de YYYY-MM-DD a DD/MM/YYYY
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  
  return fecha;
}

// ============================================
// AUTOCOMPLETADO NOMBRE <-> CÉDULA
// ============================================

function inicializarAutocompletado() {
  const nombreComision = document.getElementById('nombre-comision');
  const cedulaComision = document.getElementById('cedula-comision');
  
  if (nombreComision) {
    nombreComision.addEventListener('change', function() {
      const nombreSeleccionado = this.value;
      
      if (nombreSeleccionado && datosSharePoint.usuarios.length > 0) {
        const usuario = datosSharePoint.usuarios.find(u => u.nombre === nombreSeleccionado);
        
        if (usuario) {
          cedulaComision.value = usuario.cedula;
          cedulaComision.classList.add('valid');
          cedulaComision.classList.remove('invalid');
        }
      } else {
        cedulaComision.value = '';
        cedulaComision.classList.remove('valid', 'invalid');
      }
    });
  }
  
  if (cedulaComision) {
    cedulaComision.addEventListener('input', function() {
      const cedulaIngresada = this.value.trim();
      
      if (cedulaIngresada && datosSharePoint.usuarios.length > 0) {
        const usuario = datosSharePoint.usuarios.find(u => u.cedula === cedulaIngresada);
        
        if (usuario) {
          nombreComision.value = usuario.nombre;
          nombreComision.classList.add('valid');
          nombreComision.classList.remove('invalid');
          
          this.classList.add('valid');
          this.classList.remove('invalid');
        }
      }
    });
    
    cedulaComision.addEventListener('blur', function() {
      const cedulaIngresada = this.value.trim();
      
      if (cedulaIngresada && datosSharePoint.usuarios.length > 0) {
        const usuario = datosSharePoint.usuarios.find(u => u.cedula === cedulaIngresada);
        
        if (!usuario) {
          nombreComision.value = '';
          nombreComision.classList.remove('valid', 'invalid');
        }
      }
    });
  }
}

// ============================================
// CARGAR DATOS DESDE SHAREPOINT
// ============================================

async function cargarNombresDesdeSharePoint() {
  try {
    const selectNombre = document.getElementById('nombre-comision');
    
    // Esta función se conectará con powerautomate-flow.js
    console.log('Esperando carga de nombres desde SharePoint...');
    
    // Verificar si hay función de carga en PowerAutomate
    if (typeof window.PowerAutomateViaticos !== 'undefined' && 
        typeof window.PowerAutomateViaticos.cargarUsuarios === 'function') {
      const usuarios = await window.PowerAutomateViaticos.cargarUsuarios();
      
      if (usuarios && usuarios.length > 0) {
        datosSharePoint.usuarios = usuarios;
        actualizarSelectNombres(usuarios);
      }
    }
    
  } catch (error) {
    console.error('Error al cargar nombres:', error);
    mostrarToast('Error de Carga', 'No se pudieron cargar los usuarios desde SharePoint', 'error');
  }
}

function actualizarSelectNombres(usuarios) {
  const selectNombre = document.getElementById('nombre-comision');
  
  if (selectNombre) {
    // Limpiar opciones existentes excepto la primera
    selectNombre.innerHTML = '<option value="">Seleccione un nombre</option>';
    
    // Agregar nuevas opciones
    usuarios.forEach(usuario => {
      const option = document.createElement('option');
      option.value = usuario.nombre;
      option.textContent = usuario.nombre;
      selectNombre.appendChild(option);
    });
  }
}

// ============================================
// MENSAJES Y NOTIFICACIONES
// ============================================

function mostrarMensaje(texto, tipo) {
  let mensajeExistente = document.querySelector('.mensaje');
  
  if (!mensajeExistente) {
    mensajeExistente = document.createElement('div');
    mensajeExistente.className = 'mensaje';
    
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.insertBefore(mensajeExistente, activeTab.firstChild);
  }
  
  mensajeExistente.textContent = texto;
  mensajeExistente.className = `mensaje ${tipo}`;
  mensajeExistente.style.display = 'block';
  
  setTimeout(() => {
    mensajeExistente.style.display = 'none';
  }, 5000);
}

function mostrarToast(titulo, mensaje, tipo = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${tipo}`;
  
  toast.innerHTML = `
    <div class="toast-icon">${tipo === 'success' ? '✓' : '✗'}</div>
    <div class="toast-content">
      <div class="toast-title">${titulo}</div>
      <div class="toast-message">${mensaje}</div>
    </div>
    <button class="toast-close" aria-label="Cerrar">×</button>
    <div class="toast-progress"></div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  const cerrarToast = () => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  };
  
  toast.querySelector('.toast-close').addEventListener('click', cerrarToast);
  
  setTimeout(cerrarToast, 5000);
}

function mostrarLoading(mostrar) {
  let loading = document.querySelector('.loading');
  
  if (!loading) {
    loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="spinner"></div><p>Procesando...</p>';
    
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.appendChild(loading);
  }
  
  if (mostrar) {
    loading.classList.add('active');
  } else {
    loading.classList.remove('active');
  }
}

// ============================================
// MANEJO DE FORMULARIOS
// ============================================

function limpiarValidacionesVisuales() {
  allInputs.forEach(input => {
    input.classList.remove('valid', 'invalid');
  });
}

async function manejarSubmitComision(event) {
  event.preventDefault();
  
  if (!validarFormulario(formRegistroComision)) {
    mostrarToast('Validación Fallida', 'Complete todos los campos obligatorios correctamente', 'error');
    return;
  }
  
  const datosComision = {
    nombre: document.getElementById('nombre-comision').value,
    cedula: document.getElementById('cedula-comision').value,
    lugarComision: document.getElementById('lugar-comision').value,
    fechaIda: formatearFecha(document.getElementById('fecha-ida').value),
    fechaRegreso: formatearFecha(document.getElementById('fecha-regreso').value),
    fechaLegalizacion: formatearFecha(document.getElementById('fecha-legalizacion').value),
    objetoComision: document.getElementById('objeto-comision').value,
    numeroCDP: document.getElementById('numero-cdp').value,
    numeroRP: document.getElementById('numero-rp').value,
    numeroObligacion: document.getElementById('numero-obligacion').value,
    rubro: document.getElementById('rubro').value,
    valorTotal: obtenerValorNumerico(document.getElementById('valor-total').value),
    legalizado: document.getElementById('legalizado').value,
    linkSoportes: document.getElementById('link-soportes').value,
    medioTransporte: document.getElementById('medio-transporte').value,
    valorTiquete: obtenerValorNumerico(document.getElementById('valor-tiquete').value)
  };
  
  console.log('Datos de comisión a enviar:', datosComision);
  
  const btnSubmit = formRegistroComision.querySelector('.btn-submit');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Enviando...';
  
  try {
    if (typeof window.PowerAutomateViaticos === 'undefined') {
      throw new Error('Módulo Power Automate no cargado');
    }
    
    await window.PowerAutomateViaticos.enviarComision(datosComision);
    
    mostrarToast('¡Registro Exitoso!', 'La comisión se guardó correctamente en SharePoint', 'success');
    
    setTimeout(() => {
      formRegistroComision.reset();
      limpiarValidacionesVisuales();
    }, 2000);
    
  } catch (error) {
    console.error('Error al enviar comisión:', error);
    
    const mensajeError = error.message || 'Error al registrar la comisión';
    mostrarToast('Error en el Registro', mensajeError, 'error');
    
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Registrar Comisión';
  }
}

async function manejarSubmitUsuario(event) {
  event.preventDefault();
  
  if (!validarFormulario(formCreacionUsuario)) {
    mostrarToast('Validación Fallida', 'Complete todos los campos obligatorios correctamente', 'error');
    return;
  }
  
  const datosUsuario = {
    nombre: document.getElementById('nombre-usuario').value,
    cedula: document.getElementById('cedula-usuario').value
  };
  
  console.log('Datos de usuario a enviar:', datosUsuario);
  
  const btnSubmit = formCreacionUsuario.querySelector('.btn-submit');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Creando...';
  
  try {
    if (typeof window.PowerAutomateViaticos === 'undefined') {
      throw new Error('Módulo Power Automate no cargado');
    }
    
    await window.PowerAutomateViaticos.crearUsuario(datosUsuario);
    
    mostrarToast('¡Usuario Creado!', 'El usuario se registró correctamente en SharePoint', 'success');
    
    setTimeout(() => {
      formCreacionUsuario.reset();
      limpiarValidacionesVisuales();
    }, 2000);
    
    // Recargar lista de nombres
    await cargarNombresDesdeSharePoint();
    
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    const mensajeError = error.message || 'Error al crear el usuario';
    mostrarToast('Error en la Creación', mensajeError, 'error');
    
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Crear Usuario';
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

function inicializar() {
  console.log('✓ Inicializando formulario de viáticos...');
  
  inicializarTabs();
  inicializarValidacion();
  inicializarCamposNombre();
  inicializarCamposMonetarios();
  inicializarAutocompletado();
  
  if (formRegistroComision) {
    formRegistroComision.addEventListener('submit', manejarSubmitComision);
  }
  
  if (formCreacionUsuario) {
    formCreacionUsuario.addEventListener('submit', manejarSubmitUsuario);
  }
  
  cargarNombresDesdeSharePoint();
  
  console.log('✓ Formulario inicializado correctamente');
  
  if (typeof window.PowerAutomateViaticos !== 'undefined') {
    const modoPrueba = window.PowerAutomateViaticos.esModoPrueba();
    console.log(`✓ Power Automate: ${modoPrueba ? 'MODO PRUEBA' : 'MODO PRODUCCIÓN'}`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}