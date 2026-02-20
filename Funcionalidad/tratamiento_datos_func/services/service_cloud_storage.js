import bucket from '../../../config/storage.js';

class StorageService {

    async uploadFile(fileBuffer, destinationPath, contentType) {
        try {
            const file = bucket.file(destinationPath);

            await file.save(fileBuffer, {
                metadata: {
                    contentType
                },
                resumable: false
            });

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;

            console.log(`✅ Archivo subido: ${publicUrl}`);
            return publicUrl;

        } catch (error) {
            console.error('❌ Error al subir a GCS:', error);
            throw new Error(`Error al subir archivo: ${error.message}`);
        }
    }

    async getSignedUrl(filePath, expiresInMinutes = 60) {
        try {
            const file = bucket.file(filePath);
            const [url] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + expiresInMinutes * 60 * 1000,
            });
            return url;
        } catch (error) {
            console.error('Error al generar URL firmada:', error);
            throw error;
        }
    }

    async uploadSignature(identification, signatureBuffer) {
        const fileName = `doc_digital_seleccion/${identification}/firma_${Date.now()}.png`;
        return await this.uploadFile(signatureBuffer, fileName, 'image/png');
    }

    async uploadDocument(identification, pdfBuffer) {
        const fileName = `doc_digital_seleccion/${identification}/autorizacion_${Date.now()}.pdf`;
        return await this.uploadFile(pdfBuffer, fileName, 'application/pdf');
    }

    async getSignedUrlForFile(identification, fileName, expiresInMinutes = 60) {
        const filePath = `doc_digital_seleccion/${identification}/${fileName}`;
        return await this.getSignedUrl(filePath, expiresInMinutes);
    }

    async fileExists(identification, fileName) {
        try {
            const file = bucket.file(`doc_digital_seleccion/${identification}/${fileName}`);
            const [exists] = await file.exists();
            return exists;
        } catch (error) {
            return false;
        }
    }
}

export default new StorageService();