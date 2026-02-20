import PDFDocument from 'pdfkit';
import moment from 'moment';
import 'moment/locale/es.js';

moment.locale('es');

class PdfService {
    async generateAuthorizationPDF(data) {  // ← ¡CON ESPACIO!
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    bufferPages: true
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    console.log(`📄 PDF generado: ${pdfBuffer.length} bytes`);
                    resolve(pdfBuffer);
                });

                this.generateHeader(doc);
                this.generateContent(doc, data);
                this.generateSignatureSection(doc, data);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }


    generateHeader(doc) {
        // Encabezado con formato mejorado
        doc.fontSize(9)
            .font('Helvetica')
            .text('TH-R-008', 50, 50)
            .text('Versión 2', 50, 65)
            .text('Página 1 de 1', 50, 80);

        // Título principal
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .text('POLÍTICA PARA LA AUTORIZACIÓN, TRATAMIENTO DE', 0, 100, {
                align: 'center'
            })
            .text('DATOS PERSONALES Y AVISO DE PRIVACIDAD', 0, 120, {
                align: 'center'
            });

        doc.moveDown(2);
    }

    generateContent(doc, data) {
        // Subtítulo
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES', {
                align: 'center',
                underline: true
            });

        doc.moveDown(1.5);

        // Contenido con formato mejorado
        const content = [
            'Con la firma de este documento manifiesto que he sido informado por APOYO LOGÍSTICO Y OPERATIVO S.A.S. de lo siguiente:',
            '',
            '1. La Compañía actúa como responsable del tratamiento de datos personales del titular de acuerdo con lo establecido en la ley 1581 de 2012 de habeas data, y que conjunta o separadamente podrá recolectar, usar y tratar mis datos personales conforme a la Política de Tratamiento de Datos de la Compañía que se encuentra disponible en la base de datos del área de Talento Humano.',
            '',
            '2. Es de carácter facultativo el responder las preguntas sobre Datos Sensibles o sobre niñas, niños y adolescentes. Mis derechos como titular de los datos son los previstos en la Constitución y la ley, especialmente los siguientes:',
            '',
            '3. Derecho a conocer, actualizar y rectificar mis datos personales frente a los responsables o encargados del Tratamiento, así como el derecho a revocar el consentimiento otorgado para el tratamiento de datos personales.',
            '',
            '4. Derecho a solicitar prueba de la autorización otorgada al responsable del Tratamiento salvo cuando expresamente se exceptúe como requisito para el Tratamiento;',
            '',
            '5. Derecho a ser informado por el responsable del Tratamiento o el Encargado del Tratamiento, previa solicitud, respecto del uso que les ha dado a mis datos personales;',
            '',
            '6. Derecho a revocar la autorización y/o solicitar la supresión del dato cuando en el Tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.',
            '',
            '7. Derecho a acceder en forma gratuita a mis datos personales que hayan sido objeto de Tratamiento, en los términos establecidos en la Ley 1581 de 2.012 y las demás normas que la modifiquen, adicionen o complementen.'
        ];

        doc.fontSize(10)
            .font('Helvetica');

        content.forEach(line => {
            if (line === '') {
                doc.moveDown(0.5);
            } else {
                doc.text(line, {
                    align: 'justify',
                    lineGap: 2,
                    indent: line.startsWith('Con') ? 0 : 20
                });
                doc.moveDown(0.3);
            }
        });

        doc.moveDown();

        doc.font('Helvetica-Bold')
            .fontSize(11)
            .text('B. Aceptación de la Política de Tratamiento de Datos Personales');

        doc.moveDown(0.5);

        doc.font('Helvetica')
            .fontSize(10)
            .text('El trabajador, al firmar este documento, declara que ha leído y comprendido en su totalidad la Política de Tratamiento de Datos Personales de APOYO LOGÍSTICO Y OPERATIVO S.A.S (en adelante LOG&SER), la cual ha sido proporcionada para su revisión. El trabajador acepta y consiente el tratamiento de sus datos personales de acuerdo con los términos y condiciones establecidos en dicha política.', {
                align: 'justify',
                lineGap: 2
            });

        doc.moveDown();
    }

    generateSignatureSection(doc, data) {
        const fecha = moment(data.fecha_firma).format('DD [de] MMMM [de] YYYY');
        const ciudad = data.ciudad_firma || 'No especificada';

        // Línea de lugar y fecha
        doc.font('Helvetica')
            .fontSize(10)
            .text(`Se firma en el municipio de ${ciudad}, ${fecha}.`, {
                align: 'left'
            });

        doc.moveDown(2);

        // Sección de firma
        const signatureY = doc.y;

        // Línea para firma
        doc.lineWidth(1)
            .moveTo(50, signatureY)
            .lineTo(200, signatureY)
            .stroke();

        doc.fontSize(9)
            .text('Firma', 50, signatureY + 5);

        // Insertar imagen de firma si existe
        if (data.firmaBase64) {
            try {
                const firmaBuffer = Buffer.from(data.firmaBase64.split(',')[1], 'base64');
                doc.image(firmaBuffer, 50, signatureY - 30, {
                    width: 150,
                    height: 30,
                    align: 'center',
                    valign: 'center'
                });
            } catch (error) {
                console.error('Error al insertar firma:', error);
            }
        }

        // Sección de datos personales
        const infoX = 220;

        // Línea para datos
        doc.lineWidth(1)
            .moveTo(infoX, signatureY)
            .lineTo(500, signatureY)
            .stroke();

        doc.font('Helvetica')
            .fontSize(9)
            .text('Nombres y apellidos:', infoX, signatureY + 5);

        doc.font('Helvetica-Bold')
            .fontSize(10)
            .text(data.nombre_completo || '', infoX, signatureY + 20);

        doc.font('Helvetica')
            .fontSize(9)
            .text('Identificación:', infoX, signatureY + 40);

        doc.font('Helvetica-Bold')
            .fontSize(10)
            .text(data.identificacion || '', infoX + 100, signatureY + 40);

        doc.font('Helvetica')
            .fontSize(9)
            .text('Lugar de expedición:', infoX, signatureY + 60);

        doc.font('Helvetica-Bold')
            .fontSize(10)
            .text(data.lugar_expedicion || 'No registrado', infoX + 100, signatureY + 60);
    }
}

export default new PdfService();