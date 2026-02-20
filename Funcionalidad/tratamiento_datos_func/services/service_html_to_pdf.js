import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HtmlToPdfService {
    async generatePDF(data) {
        let browser = null;
        try {
            // ✅ RUTA CORREGIDA - Apuntando a la carpeta Interfaz
            const templatePath = path.join(__dirname, '../../../Interfaz/tratamiento_datos/templates/autorizacion.html');
            const cssPath = path.join(__dirname, '../../../Interfaz/tratamiento_datos/templates/style.css');

            console.log('📁 Leyendo template desde:', templatePath);
            console.log('📁 Leyendo CSS desde:', cssPath);

            // Verificar que los archivos existen
            if (!fs.existsSync(templatePath)) {
                throw new Error(`No existe el archivo: ${templatePath}`);
            }
            if (!fs.existsSync(cssPath)) {
                throw new Error(`No existe el archivo: ${cssPath}`);
            }

            // 1. Leer la plantilla HTML
            let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

            // 2. Leer el CSS
            const cssContent = fs.readFileSync(cssPath, 'utf8');

            // 3. Formatear fecha correctamente
            const fecha = new Date(data.fecha_firma);
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const dia = fecha.getDate();
            const mes = meses[fecha.getMonth()];
            const anio = fecha.getFullYear();

            // 4. Reemplazar variables en el HTML
            htmlTemplate = htmlTemplate
                .replace('{{identificacion}}', data.identificacion || '')
                .replace('{{nombre_completo}}', data.nombre_completo || '')
                .replace('{{lugar_expedicion}}', data.lugar_expedicion || '')
                .replace('{{ciudad_firma}}', data.ciudad_firma || '')
                .replace('{{dia}}', dia.toString())
                .replace('{{mes}}', mes)
                .replace('{{anio}}', anio.toString())
                .replace('{{fecha_completa}}', `${dia} de ${mes} de ${anio}`);

            // 5. Insertar la firma como imagen
            if (data.firmaBase64) {
                htmlTemplate = htmlTemplate.replace(
                    '{{firma_img}}',
                    `<img src="${data.firmaBase64}" style="max-width:180px; max-height:80px; display:block; margin:0 auto;">`
                );
            } else {
                htmlTemplate = htmlTemplate.replace('{{firma_img}}', '');
            }

            // 6. Lanzar puppeteer
            console.log('🚀 Lanzando Puppeteer...');
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // 7. Cargar el HTML con estilos
            const fullHtml = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <style>${cssContent}</style>
                </head>
                <body>
                    ${htmlTemplate}
                </body>
                </html>
            `;

            await page.setContent(fullHtml, {
                waitUntil: 'networkidle0'
            });

            // 8. Generar PDF
            console.log('📄 Generando PDF...');
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '40px',
                    bottom: '40px',
                    left: '40px',
                    right: '40px'
                },
                preferCSSPageSize: true
            });

            console.log(`✅ PDF generado: ${pdfBuffer.length} bytes`);

            return pdfBuffer;

        } catch (error) {
            console.error('❌ Error generando PDF:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
                console.log('🔄 Navegador cerrado');
            }
        }
    }
}

export default new HtmlToPdfService();