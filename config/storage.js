import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

// Solo cargar dotenv en desarrollo y si existe el archivo
if (process.env.NODE_ENV !== 'production') {
    try {
        dotenv.config();
        console.log('📝 Dotenv cargado para desarrollo');
    } catch (error) {
        console.log('No se pudo cargar .env, usando variables de entorno existentes');
    }
}

console.log('=== Configuración de Cloud Storage ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'configurado' : 'usando credenciales por defecto');

// Inicializar Storage
let storage;
try {
    storage = new Storage();
    console.log('✓ Storage inicializado correctamente');
} catch (error) {
    console.error('✗ Error inicializando Storage:', error);
    throw error;
}

// Obtener nombres de buckets
const bucketHojasVidaName = process.env.GCS_BUCKET_HOJAS_VIDA;
const bucketFirmasName = process.env.GCS_BUCKET_FIRMAS;

console.log('GCS_BUCKET_HOJAS_VIDA:', bucketHojasVidaName || 'no definido');
console.log('GCS_BUCKET_FIRMAS:', bucketFirmasName || 'no definido');

// Validar buckets
if (!bucketHojasVidaName) {
    console.error('ERROR: GCS_BUCKET_HOJAS_VIDA no está definida');
    console.error('Variables de entorno disponibles:', Object.keys(process.env).filter(k => k.includes('BUCKET')));
    throw new Error('GCS_BUCKET_HOJAS_VIDA es requerida');
}

if (!bucketFirmasName) {
    console.error('ERROR: GCS_BUCKET_FIRMAS no está definida');
    throw new Error('GCS_BUCKET_FIRMAS es requerida');
}

// Crear referencias a buckets
export const bucketHojasVida = storage.bucket(bucketHojasVidaName);
export const bucketFirmas = storage.bucket(bucketFirmasName);

console.log('✓ Buckets configurados correctamente');
console.log('=====================================');

export default storage;