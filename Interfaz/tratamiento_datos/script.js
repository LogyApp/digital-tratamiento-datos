// script.js

const hoy = new Date();
const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

dia.textContent = hoy.getDate();
mes.textContent = meses[hoy.getMonth()];
anio.textContent = hoy.getFullYear();

let usuarios = {};
let firmaRealizada = false;
let firmaCargada = false; // Se inicializa aquí para que esté disponible globalmente

const btnGuardar = document.getElementById('btnGuardar');
const firmaCanvas = document.getElementById('firma');
const ctx = firma.getContext("2d");

const API_BASE_URL = 'https://digital-tratamiento-datos-594761951101.europe-west1.run.app/api';
// const API_BASE_URL = 'http://localhost:8080/api';


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

            municipio.value = usuario.ciudad_firma || '';

            if (usuario.ciudad_firma) {
                console.log('🏙️ Ciudad precargada:', usuario.ciudad_firma);
            }

            if (usuario.firma_url) {
                console.log('✅ Firma encontrada:', usuario.firma_url);
                cargarFirmaDesdeDatos(usuario.firma_url);
            } else {
                console.log('ℹ️ No hay firma guardada');
                limpiarFirma();
            }

            firma.style.pointerEvents = "auto";
            verificarEstadoBoton();
        } else {
            await buscarEmpleadoPorIdentificacion(identificacion);
        }
    } else {
        nombre.value = "";
        lugarExp.value = "";
        municipio.value = "";
        limpiarFirma();
        firma.style.pointerEvents = "none";
        firmaRealizada = false;
        verificarEstadoBoton();
    }
});

async function cargarFirmaDesdeDatos(firmaUrl) {
    if (!firmaUrl) {
        limpiarFirma();
        return;
    }

    console.log('🖼️ Cargando imagen desde:', firmaUrl);
    const ctx = firmaCanvas.getContext('2d');

    try {
        const response = await fetch(firmaUrl, {
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Origin': window.location.origin
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const img = new Image();

        const timeout = setTimeout(() => {
            console.error('⏰ Timeout cargando imagen');
            URL.revokeObjectURL(blobUrl);
            limpiarFirma();
        }, 5000);

        img.onload = function () {
            clearTimeout(timeout);
            console.log('✅ Imagen cargada exitosamente');
            ctx.clearRect(0, 0, firmaCanvas.width, firmaCanvas.height);
            ctx.drawImage(img, 0, 0, firmaCanvas.width, firmaCanvas.height);
            URL.revokeObjectURL(blobUrl);

            firmaCargada = true;
            firmaRealizada = true;
            verificarEstadoBoton();
        };

        img.onerror = function (err) {
            clearTimeout(timeout);
            console.error('❌ Error cargando imagen:', err);
            URL.revokeObjectURL(blobUrl);
            limpiarFirma();
        };

        img.src = blobUrl;

    } catch (error) {
        console.error('❌ Error en fetch CORS:', error);

        // Fallback directo
        const img = new Image();
        const timestamp = new Date().getTime();

        img.crossOrigin = 'anonymous';
        img.setAttribute('crossorigin', 'anonymous');

        const timeout = setTimeout(() => {
            console.error('⏰ Timeout en fallback');
            limpiarFirma();
        }, 5000);

        img.onload = function () {
            clearTimeout(timeout);
            console.log('✅ Imagen cargada con fallback');
            ctx.clearRect(0, 0, firmaCanvas.width, firmaCanvas.height);
            ctx.drawImage(img, 0, 0, firmaCanvas.width, firmaCanvas.height);

            firmaCargada = true;
            firmaRealizada = true;
            verificarEstadoBoton();
        };

        img.onerror = function (err) {
            clearTimeout(timeout);
            console.error('❌ Error en fallback:', err);
            limpiarFirma();
        };

        img.src = firmaUrl.includes('?') ? `${firmaUrl}&t=${timestamp}` : `${firmaUrl}?t=${timestamp}`;
    }
}

function limpiarFirma() {
    const ctx = firmaCanvas.getContext('2d');
    ctx.clearRect(0, 0, firmaCanvas.width, firmaCanvas.height);
    firmaRealizada = false;
    firmaCargada = false;
    verificarEstadoBoton();

    if (window.currentBlobUrl) {
        URL.revokeObjectURL(window.currentBlobUrl);
        window.currentBlobUrl = null;
    }
}

let dibujando = false;

function iniciarDibujo(x, y) {
    dibujando = true;

    if (firmaCargada) {
        console.log('🖊️ Usuario empieza a dibujar - limpiando firma anterior');
        ctx.clearRect(0, 0, firma.width, firma.height);
        firmaCargada = false;
        firmaRealizada = true;
        verificarEstadoBoton();
    }

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

    if (!firmaRealizada && !firmaCargada) {
        firmaRealizada = true;
        verificarEstadoBoton();
    }
}

function terminarDibujo() {
    dibujando = false;
    ctx.beginPath();
}

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

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

function verificarEstadoBoton() {
    const identificacionValida = documento.value.trim() !== '' && nombre.value !== '';
    const municipioValido = municipio.value.trim() !== '';

    if (firmaRealizada && identificacionValida && municipioValido) {
        btnGuardar.disabled = false;
    } else {
        btnGuardar.disabled = true;
    }
}

municipio.addEventListener("input", verificarEstadoBoton);

btnGuardar.addEventListener("click", async () => {
    if (btnGuardar.disabled) return;

    btnGuardar.disabled = true;
    btnGuardar.textContent = 'GUARDANDO...';

    try {
        const datosFormulario = {
            identificacion: documento.value.trim(),
            nombre_completo: nombre.value.trim(),
            lugar_expedicion: lugarExp.value.trim() || null,
            ciudad_firma: municipio.value.trim(),
            fecha_firma: new Date().toISOString(),
            firmaBase64: firma.toDataURL('image/png')
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
            alert('✅ ¡Autorización guardada exitosamente!');
            console.log('📎 URL de la firma:', resultado.data.firmaUrl);
            console.log('📄 URL del documento PDF:', resultado.data.pdfUrl);

            if (confirm('¿Deseas ver el documento PDF generado?')) {
                window.open(resultado.data.pdfUrl, '_blank');
            }

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
            usuarios = response.data.reduce((acc, empleado) => {
                acc[empleado.identificacion] = empleado;
                return acc;
            }, {});
            console.log('✅ Usuarios cargados:', Object.keys(usuarios).length);

            if (response.data.length > 0) {
                console.log('📋 Ejemplo - usuario:', response.data[0].identificacion);
                console.log('📋 firma_url:', response.data[0].firma_url);
            }
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
            console.log('📋 Empleado encontrado:', empleado);

            nombre.value = empleado.nombre_completo || '';
            lugarExp.value = empleado.lugar_expedicion || '';

            municipio.value = empleado.ciudad_firma || '';

            if (empleado.ciudad_firma) {
                console.log('🏙️ Ciudad precargada:', empleado.ciudad_firma);
            }

            usuarios[identificacion] = empleado;

            if (empleado.firma_url) {
                console.log('✅ Firma encontrada:', empleado.firma_url);
                cargarFirmaDesdeDatos(empleado.firma_url);
            } else {
                console.log('ℹ️ No hay firma guardada');
                limpiarFirma();
            }

            firma.style.pointerEvents = "auto";
            console.log('✅ Empleado cargado correctamente');
        } else {
            console.log('⚠️ Empleado no encontrado');
            nombre.value = "";
            lugarExp.value = "";
            municipio.value = "";
            limpiarFirma();
            firma.style.pointerEvents = "none";
            alert('⚠️ El número de identificación no está registrado en el sistema');
        }

        verificarEstadoBoton();

    } catch (error) {
        console.error('❌ Error al buscar empleado:', error);
        nombre.value = "";
        lugarExp.value = "";
        municipio.value = "";
        limpiarFirma();
        firma.style.pointerEvents = "none";
        verificarEstadoBoton();
        alert('❌ Error al buscar el empleado: ' + error.message);
    }
}

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

checkServerHealth().then(isAlive => {
    if (!isAlive) {
        console.warn('⚠️ El servidor no está respondiendo.');
    }
});