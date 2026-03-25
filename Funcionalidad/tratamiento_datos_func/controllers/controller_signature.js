import employeeService from '../services/service_obtener_usuarios.js';
import storageService from '../services/service_cloud_storage.js';
import htmlToPdfService from '../services/service_html_to_pdf.js';

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

            // PASO 1: Subir la firma → bucket [firmas-images]
            console.log('1️⃣ Subiendo firma a firmas-images...');
            const firmaBuffer = Buffer.from(firmaBase64.split(',')[1], 'base64');
            const firmaUrl = await storageService.uploadSignature(identificacion, firmaBuffer);
            console.log('✅ Firma URL:', firmaUrl);

            // PASO 2: Generar PDF
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

            // PASO 3: Subir PDF → bucket [hojas_vida_logyser]
            console.log('3️⃣ Subiendo PDF a hojas_vida_logyser...');
            const pdfUrl = await storageService.uploadDocument(identificacion, pdfBuffer);
            console.log('✅ PDF URL:', pdfUrl);

            // PASO 4: Verificar si el empleado existe en BD
            console.log('4️⃣ Verificando empleado en BD...');
            const empleadoExistente = await employeeService.getEmployeeByIdentificacion(identificacion);

            if (empleadoExistente) {
                console.log('🔄 Actualizando empleado existente...');
                await employeeService.updateEmployeeSignatureUrl(identificacion, firmaUrl);
                await employeeService.updateEmployeeDocumentUrl(identificacion, pdfUrl);

                if (!empleadoExistente.lugar_expedicion && lugar_expedicion) {
                    console.log('📍 Actualizando ubicación del empleado...');
                    await employeeService.updateEmployeeLocation(identificacion, {
                        lugar_expedicion,
                        ciudad_firma
                    });
                }
            } else {
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

            // Verificación final
            const verificar = await employeeService.getEmployeeByIdentificacion(identificacion);
            console.log('✅ REGISTRO FINAL EN BD:', {
                lugar_expedicion: verificar?.lugar_expedicion,
                ciudad_firma: verificar?.ciudad_firma,
                // Muestra el bucket correcto en el log para confirmar
                firma_url: verificar?.firma_url ? verificar.firma_url.substring(0, 60) + '...' : null,
                url_td: verificar?.url_td ? verificar.url_td.substring(0, 60) + '...' : null
            });

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

            // Se consultan ambos buckets por separado
            const [firma, documento] = await Promise.allSettled([
                storageService.fileExists(identification, `firma_${identification}.png`),
                storageService.fileExists(identification, `autorizacion_${identification}.pdf`)
            ]);

            res.json({
                success: true,
                data: {
                    firma: {
                        bucket: 'firmas-images',
                        exists: firma.status === 'fulfilled' ? firma.value : false,
                        path: `${identification}/firma_${identification}.png`
                    },
                    documento: {
                        bucket: 'hojas_vida_logyser',
                        exists: documento.status === 'fulfilled' ? documento.value : false,
                        path: `${identification}/autorizacion_${identification}.pdf`
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error en getUserFiles:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async healthCheck(req, res) {
        try {
            const services = {
                database: false,
                storage_firmas: false,
                storage_documentos: false,
                pdfGenerator: false
            };

            try {
                await employeeService.getEmployeeByIdentificacion('test');
                services.database = true;
            } catch (e) {
                console.error('BD no disponible:', e.message);
            }

            // Verifica ambos buckets de forma independiente
            try {
                await storageService.fileExists('test', `firma_test.png`);
                services.storage_firmas = true;
            } catch (e) {
                console.error('Bucket firmas-images no disponible:', e.message);
            }

            try {
                await storageService.fileExists('test', `autorizacion_test.pdf`);
                services.storage_documentos = true;
            } catch (e) {
                console.error('Bucket hojas_vida_logyser no disponible:', e.message);
            }

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