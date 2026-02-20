import employeeService from '../services/service_obtener_usuarios.js';
import storageService from '../services/service_cloud_storage.js';
import htmlToPdfService from '../services/service_html_to_pdf.js'; // Cambiado de pdfService a htmlToPdfService

class SignatureController {
    async saveSignature(req, res) {
        try {
            const {
                identificacion,
                nombre_completo,
                lugar_expedicion,
                ciudad_firma,
                firmaBase64,
                fecha_firma
            } = req.body;

            // VALIDACIÓN ESTRICTA
            if (!identificacion || !nombre_completo || !ciudad_firma || !firmaBase64) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan datos requeridos',
                    required: ['identificacion', 'nombre_completo', 'ciudad_firma', 'firmaBase64']
                });
            }

            console.log('📦 DATOS RECIBIDOS:', {
                identificacion,
                nombre_completo,
                lugar_expedicion: lugar_expedicion || '(vacío)',
                ciudad_firma,
                fecha_firma: fecha_firma || new Date().toISOString()
            });

            // PASO 1: Subir la firma
            console.log('1️⃣ Subiendo firma...');
            const firmaBuffer = Buffer.from(firmaBase64.split(',')[1], 'base64');
            const firmaUrl = await storageService.uploadSignature(identificacion, firmaBuffer);
            console.log('✅ Firma URL:', firmaUrl);

            // PASO 2: Generar PDF usando HTML + CSS (manteniendo el diseño exacto)
            console.log('2️⃣ Generando PDF desde plantilla HTML...');
            const pdfBuffer = await htmlToPdfService.generatePDF({
                identificacion,
                nombre_completo,
                lugar_expedicion: lugar_expedicion || 'No registrado',
                ciudad_firma,
                fecha_firma: fecha_firma || new Date(),
                firmaBase64
            });
            console.log(`✅ PDF generado: ${pdfBuffer.length} bytes`);

            // PASO 3: Subir PDF
            console.log('3️⃣ Subiendo PDF a GCS...');
            const pdfUrl = await storageService.uploadDocument(identificacion, pdfBuffer);
            console.log('✅ PDF URL:', pdfUrl);

            // PASO 4: VERIFICAR si el empleado existe
            console.log('4️⃣ Verificando empleado en BD...');
            const empleadoExistente = await employeeService.getEmployeeByidentificacion(identificacion);

            if (empleadoExistente) {
                // ACTUALIZAR URLs
                console.log('🔄 Actualizando empleado existente...');
                await employeeService.updateEmployeeSignatureUrl(identificacion, firmaUrl);
                await employeeService.updateEmployeeDocumentUrl(identificacion, pdfUrl);

                // ACTUALIZAR lugar_expedicion y ciudad_firma si están vacíos
                if (!empleadoExistente.lugar_expedicion && lugar_expedicion) {
                    console.log('📍 Actualizando ubicación del empleado...');
                    await employeeService.updateEmployeeLocation(identificacion, {
                        lugar_expedicion,
                        ciudad_firma
                    });
                }
            } else {
                // CREAR NUEVO registro con TODO
                console.log('🆕 Creando nuevo registro en BD...');
                const nuevoId = await employeeService.createSignatureRecord({
                    identificacion,
                    nombre_completo,
                    lugar_expedicion: lugar_expedicion || null,
                    ciudad_firma,
                    firma_url: firmaUrl,
                    url_td: pdfUrl,
                    fecha_firma: fecha_firma || new Date()
                });
                console.log('✅ Nuevo registro creado con ID:', nuevoId);
            }

            // VERIFICAR que se guardó correctamente
            const verificar = await employeeService.getEmployeeByidentificacion(identificacion);
            console.log('✅ REGISTRO FINAL EN BD:', {
                lugar_expedicion: verificar?.lugar_expedicion,
                ciudad_firma: verificar?.ciudad_firma,
                firma_url: verificar?.firma_url ? verificar.firma_url.substring(0, 50) + '...' : null,
                url_td: verificar?.url_td ? verificar.url_td.substring(0, 50) + '...' : null
            });

            // Respuesta exitosa
            res.json({
                success: true,
                message: 'Autorización guardada exitosamente',
                data: {
                    firmaUrl,
                    pdfUrl,
                    identificacion,
                    nombre_completo,
                    ciudad_firma,
                    lugar_expedicion: lugar_expedicion || 'No registrado'
                }
            });

        } catch (error) {
            console.error('❌ Error en saveSignature:', error);
            res.status(500).json({
                success: false,
                message: `Error al guardar la autorización: ${error.message}`,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async getUserFiles(req, res) {
        try {
            const { identification } = req.params;

            if (!identification) {
                return res.status(400).json({
                    success: false,
                    message: 'Identificación requerida'
                });
            }

            console.log(`📂 Obteniendo archivos para: ${identification}`);
            const files = await storageService.listUserFiles(identification);

            // Generar URLs firmadas si el bucket no es público
            // const filesWithUrls = await Promise.all(files.map(async (file) => {
            //     const signedUrl = await storageService.getSignedUrl(
            //         `doc_digital_seleccion/${identification}/${file.name}`,
            //         60
            //     );
            //     return { ...file, url: signedUrl };
            // }));

            res.json({
                success: true,
                data: files // o filesWithUrls si usas URLs firmadas
            });

        } catch (error) {
            console.error('❌ Error en getUserFiles:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Método adicional para verificar el estado del servicio
    async healthCheck(req, res) {
        try {
            const services = {
                database: false,
                storage: false,
                pdfGenerator: false
            };

            // Verificar BD
            try {
                const testQuery = await employeeService.getEmployeeByidentificacion('test');
                services.database = true;
            } catch (e) {
                console.error('BD no disponible:', e.message);
            }

            // Verificar Storage
            try {
                const testFile = await storageService.fileExists('test', 'test.txt');
                services.storage = true;
            } catch (e) {
                console.error('Storage no disponible:', e.message);
            }

            // Verificar generador PDF
            try {
                const testPdf = await htmlToPdfService.generatePDF({
                    identificacion: 'TEST',
                    nombre_completo: 'TEST',
                    ciudad_firma: 'TEST',
                    firmaBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                });
                services.pdfGenerator = testPdf.length > 0;
            } catch (e) {
                console.error('PDF Generator no disponible:', e.message);
            }

            res.json({
                success: true,
                timestamp: new Date(),
                services,
                allOperational: Object.values(services).every(v => v === true)
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new SignatureController();