const numeroFinal = 93;
const elementoContador = document.getElementById('contador');
const mensajeFinal = document.getElementById('mensajeFinal');
const duracionTotal = 3000; // 3 segundos

// Función de easing (desaceleración suave)
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function iniciarContador() {
    const tiempoInicio = Date.now();

    function actualizarContador() {
        const tiempoTranscurrido = Date.now() - tiempoInicio;
        const progreso = Math.min(tiempoTranscurrido / duracionTotal, 1);
        const suavizado = easeOutCubic(progreso);

        const numeroActual = Math.floor(suavizado * numeroFinal);
        elementoContador.textContent = numeroActual;

        if (progreso < 1) {
            requestAnimationFrame(actualizarContador);
        } else {
            elementoContador.textContent = numeroFinal;
            mensajeFinal.style.display = 'block';
        }
    }

    actualizarContador();
}

window.onload = iniciarContador;