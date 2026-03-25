import { bucketHojasVida, bucketFirmas } from '../../../config/storage.js';

class StorageService {

    async uploadFile(bucket, fileBuffer, destinationPath, contentType) {
        try {
            const file = bucket.file(destinationPath);

            await file.save(fileBuffer, {
                metadata: { contentType },
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

    async uploadSignature(identification, signatureBuffer) {
        const destinationPath = `${identification}/firma_${identification}.png`;
        return await this.uploadFile(
            bucketFirmas,
            signatureBuffer,
            destinationPath,
            'image/png'
        );
    }

    async uploadDocument(identification, pdfBuffer) {
        const destinationPath = `${identification}/autorizacion_${identification}.pdf`;
        return await this.uploadFile(
            bucketHojasVida,
            pdfBuffer,
            destinationPath,
            'application/pdf'
        );
    }

    async getSignedUrl(bucket, filePath, expiresInMinutes = 60) {
        try {
            const file = bucket.file(filePath);
            const [url] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + expiresInMinutes * 60 * 1000,
            });
            return url;
        } catch (error) {
            console.error('❌ Error al generar URL firmada:', error);
            throw error;
        }
    }

    async getSignedUrlDocument(identification, expiresInMinutes = 60) {
        const filePath = `${identification}/autorizacion_${identification}.pdf`;
        return await this.getSignedUrl(bucketHojasVida, filePath, expiresInMinutes);
    }

    async getSignedUrlSignature(identification, expiresInMinutes = 60) {
        const filePath = `${identification}/firma_${identification}.png`;
        return await this.getSignedUrl(bucketFirmas, filePath, expiresInMinutes);
    }

    async documentExists(identification) {
        try {
            const file = bucketHojasVida.file(`${identification}/autorizacion_${identification}.pdf`);
            const [exists] = await file.exists();
            return exists;
        } catch {
            return false;
        }
    }

    async signatureExists(identification) {
        try {
            const file = bucketFirmas.file(`${identification}/firma_${identification}.png`);
            const [exists] = await file.exists();
            return exists;
        } catch {
            return false;
        }
    }
}

export default new StorageService();