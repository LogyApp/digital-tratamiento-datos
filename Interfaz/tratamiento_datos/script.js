const hoy = new Date();
const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

dia.textContent = hoy.getDate();
mes.textContent = meses[hoy.getMonth()];
anio.textContent = hoy.getFullYear();

let usuarios = {};
let firmaRealizada = false;

const btnGuardar = document.getElementById('btnGuardar');

const API_BASE_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', async () => {
    await obtenerUsuarios();
    verificarEstadoBoton();
});

documento.addEventListener("change", async () => {
    const identificacion = documento.value.trim();

    if (identificacion) {
        if (usuarios[identificacion]) {
            const usuario = usuarios[identificacion];
            nombre.value = usuario.nombre_completo || '';
            lugarExp.value = usuario.lugar_expedicion || '';
            firma.style.pointerEvents = "auto";
            verificarEstadoBoton();
        } else {
            await buscarEmpleadoPorIdentificacion(identificacion);
        }
    } else {
        nombre.value = "";
        lugarExp.value = "";
        firma.style.pointerEvents = "none";
        firmaRealizada = false;
        verificarEstadoBoton();
    }
});

let dibujando = false;
const ctx = firma.getContext("2d");

function iniciarDibujo(x, y) {
    dibujando = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function dibujar(x, y) {
    if (!dibujando) return;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (!firmaRealizada) {
        firmaRealizada = true;
        verificarEstadoBoton();
    }
}

function terminarDibujo() {
    dibujando = false;
    ctx.beginPath();
}

// Eventos del mouse
firma.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const rect = firma.getBoundingClientRect();
    iniciarDibujo(e.clientX - rect.left, e.clientY - rect.top);
});

firma.addEventListener("mouseup", terminarDibujo);
firma.addEventListener("mouseleave", terminarDibujo);

firma.addEventListener("mousemove", e => {
    e.preventDefault();
    const rect = firma.getBoundingClientRect();
    dibujar(e.clientX - rect.left, e.clientY - rect.top);
});

// Eventos táctiles
firma.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = firma.getBoundingClientRect();
    iniciarDibujo(touch.clientX - rect.left, touch.clientY - rect.top);
});

firma.addEventListener("touchend", (e) => {
    e.preventDefault();
    terminarDibujo();
});

firma.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = firma.getBoundingClientRect();
    dibujar(touch.clientX - rect.left, touch.clientY - rect.top);
});

// Función para limpiar la firma
function limpiarFirma() {
    ctx.clearRect(0, 0, firma.width, firma.height);
    firmaRealizada = false;
    verificarEstadoBoton();
}

// Verificar estado del botón
function verificarEstadoBoton() {
    const identificacionValida = documento.value.trim() !== '' && nombre.value !== '';
    const municipioValido = municipio.value.trim() !== '';

    if (firmaRealizada && identificacionValida && municipioValido) {
        btnGuardar.disabled = false;
    } else {
        btnGuardar.disabled = true;
    }
}

// Evento para el campo municipio
municipio.addEventListener("input", verificarEstadoBoton);

// Evento para el botón guardar
btnGuardar.addEventListener("click", async () => {
    if (btnGuardar.disabled) return;

    // Deshabilitar botón mientras se procesa
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'GUARDANDO...';

    try {
        const datosFormulario = {
            identificacion: documento.value.trim(),
            nombre_completo: nombre.value.trim(),
            lugar_expedicion: lugarExp.value.trim() || null, // Enviar null si está vacío
            ciudad_firma: municipio.value.trim(), // Cambiado de 'municipio' a 'ciudad_firma' como espera el backend
            fecha_firma: new Date().toISOString(),
            firmaBase64: firma.toDataURL('image/png') // El backend espera 'firmaBase64'
        };

        console.log('📤 Enviando datos al servidor...', datosFormulario);

        const response = await fetch(`${API_BASE_URL}/guardar-autorizacion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosFormulario)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message || 'Error en la respuesta del servidor');
        }

        if (resultado.success) {
            console.log('✅ Respuesta del servidor:', resultado);

            // Mostrar mensaje de éxito
            alert('✅ ¡Autorización guardada exitosamente!');

            // Mostrar las URLs generadas en consola
            console.log('📎 URL de la firma:', resultado.data.firmaUrl);
            console.log('📄 URL del documento PDF:', resultado.data.pdfUrl);

            // Preguntar si quiere ver el PDF
            if (confirm('¿Deseas ver el documento PDF generado?')) {
                window.open(resultado.data.pdfUrl, '_blank');
            }

            // Limpiar el formulario
            documento.value = '';
            nombre.value = '';
            lugarExp.value = '';
            municipio.value = '';
            limpiarFirma();

        } else {
            throw new Error(resultado.message || 'Error al guardar');
        }

    } catch (error) {
        console.error('❌ Error al guardar:', error);
        alert('❌ Error al guardar la autorización: ' + error.message);
    } finally {
        btnGuardar.textContent = 'GUARDAR AUTORIZACIÓN';
        verificarEstadoBoton();
    }
});

async function obtenerUsuarios() {
    try {
        console.log('📡 Cargando usuarios...');
        const res = await fetch(`${API_BASE_URL}/empleados`);

        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }

        const response = await res.json();

        if (response.success && Array.isArray(response.data)) {
            // IMPORTANTE: El backend devuelve 'identification' (con 'i') no 'identificacion' (con 'c')
            usuarios = response.data.reduce((acc, empleado) => {
                acc[empleado.identification] = empleado; // Usar 'identification' como viene del backend
                return acc;
            }, {});
            console.log('✅ Usuarios cargados:', Object.keys(usuarios).length);
        }

    } catch (error) {
        console.error('❌ Error al obtener usuarios:', error);
    }
}

async function buscarEmpleadoPorIdentificacion(identificacion) {
    try {
        console.log(`🔍 Buscando empleado: ${identificacion}`);
        const res = await fetch(`${API_BASE_URL}/empleados/${identificacion}`);

        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }

        const response = await res.json();

        if (response.success && response.data) {
            const empleado = response.data;
            nombre.value = empleado.nombre_completo || '';
            lugarExp.value = empleado.lugar_expedicion || '';
            usuarios[identificacion] = empleado;
            firma.style.pointerEvents = "auto";
            console.log('✅ Empleado encontrado:', empleado);
        } else {
            console.log('⚠️ Empleado no encontrado');
            nombre.value = "";
            lugarExp.value = "";
            firma.style.pointerEvents = "none";
            firmaRealizada = false;
        }

        verificarEstadoBoton();

    } catch (error) {
        console.error('❌ Error al buscar empleado:', error);
        nombre.value = "";
        lugarExp.value = "";
        firma.style.pointerEvents = "none";
        firmaRealizada = false;
        verificarEstadoBoton();
    }
}

// Función adicional para ver el estado de salud del servidor
async function checkServerHealth() {
    try {
        const res = await fetch(`${API_BASE_URL}/health`);
        const data = await res.json();
        console.log('🏥 Estado del servidor:', data);
        return data.success;
    } catch (error) {
        console.error('❌ Servidor no disponible:', error);
        return false;
    }
}

// Verificar conexión al iniciar
checkServerHealth().then(isAlive => {
    if (!isAlive) {
        console.warn('⚠️ El servidor no está respondiendo. Verifica que el backend esté corriendo en http://localhost:8080');
    }
});