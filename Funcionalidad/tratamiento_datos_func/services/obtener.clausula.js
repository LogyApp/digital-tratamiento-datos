// services/obtener-clausula.js
import { Storage } from '@google-cloud/storage';

let storage;
const bucketName = 'clausulas-logyser';

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.K_SERVICE;

if (isDevelopment) {
    console.log('🏠 Modo local: usando gcs-key.json');
    storage = new Storage({
        keyFilename: './gcs-key.json'
    });
} else {
    console.log('☁️ Modo nube: usando credenciales del entorno');
    storage = new Storage();
}

/**
 * Obtiene una cláusula del bucket
 * @param {string} version - Versión de la cláusula (v1.0, v2.0, etc.)
 * @returns {Promise<string>} - Contenido del archivo
 */
export async function obtenerClausula(version = 'v1.0') {
    try {
        const fileName = `clausula-tratamiento-datos-${version}.txt`;

        console.log(`📖 Leyendo ${fileName} del bucket ${bucketName}`);

        // Referencia al archivo en el bucket
        const file = storage.bucket(bucketName).file(fileName);

        // Verificar si existe
        const [exists] = await file.exists();
        if (!exists) {
            throw new Error(`El archivo ${fileName} no existe en el bucket ${bucketName}`);
        }

        // Descargar el contenido
        const [contents] = await file.download();

        return contents.toString('utf8');

    } catch (error) {
        console.error('❌ Error al obtener la cláusula:', error);
        throw error;
    }
}

/**
 * Lista todas las versiones disponibles
 * @returns {Promise<Array>} - Lista de archivos disponibles
 */
export async function listarVersiones() {
    try {
        const [files] = await storage.bucket(bucketName).getFiles({
            prefix: 'clausula-tratamiento-datos-'
        });

        return files.map(file => {
            // Extraer versión del nombre del archivo
            const versionMatch = file.name.match(/clausula-tratamiento-datos-(v[\d.]+)\.txt/);
            return {
                nombre: file.name,
                version: versionMatch ? versionMatch[1] : 'desconocida',
                created: file.metadata.timeCreated,
                updated: file.metadata.updated,
                url: `https://storage.googleapis.com/${bucketName}/${file.name}`
            };
        }).sort((a, b) => {
            // Ordenar por versión descendente (v2.0 > v1.0)
            const vA = parseFloat(a.version.replace('v', ''));
            const vB = parseFloat(b.version.replace('v', ''));
            return vB - vA;
        });

    } catch (error) {
        console.error('❌ Error al listar versiones:', error);
        throw error;
    }
}

/**
 * Guarda una nueva versión de la cláusula
 * @param {string} contenido - Contenido del archivo
 * @param {string} version - Versión (v1.0, v2.0, etc.)
 * @param {Object} metadata - Metadatos adicionales (opcional)
 */
export async function guardarClausula(contenido, version, metadata = {}) {
    try {
        const fileName = `clausula-tratamiento-datos-${version}.txt`;
        const file = storage.bucket(bucketName).file(fileName);

        console.log(`💾 Guardando ${fileName} en bucket ${bucketName}`);

        await file.save(contenido, {
            contentType: 'text/plain',
            metadata: {
                version: version,
                fecha_subida: new Date().toISOString(),
                entorno: isDevelopment ? 'local' : 'cloud',
                ...metadata
            }
        });

        // Hacer público (útil para compartir, pero no necesario para tu API)
        await file.makePublic();

        console.log(`✅ Archivo guardado exitosamente`);

        return {
            success: true,
            message: 'Cláusula guardada exitosamente',
            url: `https://storage.googleapis.com/${bucketName}/${fileName}`,
            fileName: fileName,
            version: version
        };

    } catch (error) {
        console.error('❌ Error al guardar cláusula:', error);
        throw error;
    }
}

/**
 * Verifica la conexión al bucket
 */
export async function verificarConexion() {
    try {
        console.log(`🔍 Verificando conexión a bucket: ${bucketName}`);
        const [buckets] = await storage.getBuckets();
        const bucketExiste = buckets.some(b => b.name === bucketName);

        if (bucketExiste) {
            console.log(`✅ Conexión exitosa. Bucket ${bucketName} encontrado.`);
        } else {
            console.log(`⚠️  El bucket ${bucketName} no existe en este proyecto`);
        }

        const archivos = await listarVersiones();
        console.log(`📁 Archivos encontrados:`, archivos.map(a => a.nombre));

        return {
            success: true,
            bucketExiste,
            archivos: archivos.length
        };

    } catch (error) {
        console.error('❌ Error de conexión:', error);
        throw error;
    }
}

// Para ejecutar verificación directa (similar a require.main === module)
if (import.meta.url === `file://${process.argv[1]}`) {
    verificarConexion();
}