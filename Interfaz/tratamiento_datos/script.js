// ============================================
// CONFIGURACIÓN INICIAL
// ============================================
const hoy = new Date();
const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const dia = document.getElementById('dia');
const mes = document.getElementById('mes');
const anio = document.getElementById('anio');

dia.textContent = hoy.getDate();
mes.textContent = meses[hoy.getMonth()];
anio.textContent = hoy.getFullYear();

let usuarios = {};
let firmaRealizada = false;
let firmaCargada = false;

const btnGuardar = document.getElementById('btnGuardar');
const firmaCanvas = document.getElementById('firma');
const ctx = firmaCanvas.getContext("2d");

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080/api'
    : 'https://digital-tratamiento-datos-594761951101.europe-west1.run.app/api';

console.log('🌐 API Base URL:', API_BASE_URL);

// CARGAR CLÁUSULA DESDE EL BUCKET - CON FORMATO
// ============================================
async function cargarClausula() {
    const contenedor = document.getElementById('contenido-clausula');
    if (!contenedor) return;

    try {
        console.log('📖 Cargando cláusula desde el bucket...');
        const response = await fetch(`${API_BASE_URL}/clausula/ultima`);
        const data = await response.json();

        if (data.success) {
            localStorage.setItem('versionClausula', data.version);

            // Procesar el texto con formato mejorado
            const texto = data.contenido;

            // 1. Dividir por líneas
            const lineas = texto.split('\n');

            let html = '';
            let enListaNumerada = false;

            lineas.forEach(linea => {
                const trimmed = linea.trim();
                if (!trimmed) {
                    // Línea vacía = separador
                    if (enListaNumerada) {
                        enListaNumerada = false;
                    }
                    return;
                }

                // Detectar si es un título (todo en mayúsculas o con "B.")
                if (trimmed.match(/^[A-Z\s]+$/) || trimmed.match(/^[A-Z]\.\s/)) {
                    html += `<h4 class="clausula-titulo">${trimmed}</h4>`;
                }
                // Detectar puntos numerados (1., 2., etc)
                else if (trimmed.match(/^\d+\./)) {
                    html += `<p class="clausula-numerada">${trimmed}</p>`;
                    enListaNumerada = true;
                }
                // Detectar viñetas o guiones
                else if (trimmed.match(/^[•\-]/)) {
                    html += `<p class="clausula-vineta">${trimmed}</p>`;
                }
                // Texto normal
                else {
                    // Si estamos en medio de una lista numerada, mantener indentación
                    const clase = enListaNumerada ? 'clausula-continuacion' : 'clausula-parrafo';
                    html += `<p class="${clase}">${trimmed}</p>`;
                }
            });

            contenedor.innerHTML = html;
            console.log(`✅ Cláusula versión ${data.version} cargada`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        contenedor.innerHTML = `<p class="error">Error al cargar la cláusula</p>`;
    }
}

function limpiarFirma() {
    ctx.clearRect(0, 0, firmaCanvas.width, firmaCanvas.height);
    firmaRealizada = false;
    firmaCargada = false;
    verificarEstadoBoton();

    if (window.currentBlobUrl) {
        URL.revokeObjectURL(window.currentBlobUrl);
        window.currentBlobUrl = null;
    }
}

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

// ============================================
// EVENTOS DE FIRMA
// ============================================
let dibujando = false;

function iniciarDibujo(x, y) {
    dibujando = true;

    if (firmaCargada) {
        console.log('🖊️ Usuario empieza a dibujar - limpiando firma anterior');
        ctx.clearRect(0, 0, firmaCanvas.width, firmaCanvas.height);
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

firmaCanvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const rect = firmaCanvas.getBoundingClientRect();
    iniciarDibujo(e.clientX - rect.left, e.clientY - rect.top);
});

firmaCanvas.addEventListener("mouseup", terminarDibujo);
firmaCanvas.addEventListener("mouseleave", terminarDibujo);

firmaCanvas.addEventListener("mousemove", e => {
    e.preventDefault();
    const rect = firmaCanvas.getBoundingClientRect();
    dibujar(e.clientX - rect.left, e.clientY - rect.top);
});

firmaCanvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = firmaCanvas.getBoundingClientRect();
    iniciarDibujo(touch.clientX - rect.left, touch.clientY - rect.top);
});

firmaCanvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    terminarDibujo();
});

firmaCanvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = firmaCanvas.getBoundingClientRect();
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

// ============================================
// EVENTOS DE FORMULARIO
// ============================================
const documento = document.getElementById('documento');
const nombre = document.getElementById('nombre');
const lugarExp = document.getElementById('lugarExp');
const municipio = document.getElementById('municipio');

document.addEventListener('DOMContentLoaded', async () => {
    await cargarClausula(); // NUEVO: Cargar la cláusula al iniciar
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
                await cargarFirmaDesdeDatos(usuario.firma_url);
            } else {
                console.log('ℹ️ No hay firma guardada');
                limpiarFirma();
            }

            firmaCanvas.style.pointerEvents = "auto";
            verificarEstadoBoton();
        } else {
            await buscarEmpleadoPorIdentificacion(identificacion);
        }
    } else {
        nombre.value = "";
        lugarExp.value = "";
        municipio.value = "";
        limpiarFirma();
        firmaCanvas.style.pointerEvents = "none";
        firmaRealizada = false;
        verificarEstadoBoton();
    }
});

municipio.addEventListener("input", verificarEstadoBoton);

// ============================================
// GUARDAR AUTORIZACIÓN
// ============================================
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
            firmaBase64: firmaCanvas.toDataURL('image/png'),
            version_clausula: localStorage.getItem('versionClausula') || 'v1.0' // NUEVO: Versión de la cláusula
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
            console.log('📎 URL de la firma:', resultado.data?.firmaUrl);
            console.log('📄 URL del documento PDF:', resultado.data?.pdfUrl);

            if (resultado.data?.pdfUrl && confirm('¿Deseas ver el documento PDF generado?')) {
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

// ============================================
// FUNCIONES DE USUARIOS
// ============================================
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
                await cargarFirmaDesdeDatos(empleado.firma_url);
            } else {
                console.log('ℹ️ No hay firma guardada');
                limpiarFirma();
            }

            firmaCanvas.style.pointerEvents = "auto";
            console.log('✅ Empleado cargado correctamente');
        } else {
            console.log('⚠️ Empleado no encontrado');
            nombre.value = "";
            lugarExp.value = "";
            municipio.value = "";
            limpiarFirma();
            firmaCanvas.style.pointerEvents = "none";
            alert('⚠️ El número de identificación no está registrado en el sistema');
        }

        verificarEstadoBoton();

    } catch (error) {
        console.error('❌ Error al buscar empleado:', error);
        nombre.value = "";
        lugarExp.value = "";
        municipio.value = "";
        limpiarFirma();
        firmaCanvas.style.pointerEvents = "none";
        verificarEstadoBoton();
        alert('❌ Error al buscar el empleado: ' + error.message);
    }
}

// ============================================
// HEALTH CHECK
// ============================================
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