import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import empleados from './Funcionalidad/tratamiento_datos_func/routes/routes_obtener_usuarios.js';
import signature from './Funcionalidad/tratamiento_datos_func/routes/routes_signature.js';
import {
    obtenerClausula,
    listarVersiones,
    guardarClausula,
    verificarConexion
} from './Funcionalidad/tratamiento_datos_func/services/obtener.clausula.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'Interfaz/tratamiento_datos')));

app.get('/api/clausula/ultima', async (req, res) => {
    try {
        const versiones = await listarVersiones();

        if (versiones.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No hay versiones disponibles'
            });
        }

        const ultima = versiones[0];
        const contenido = await obtenerClausula(ultima.version);

        res.json({
            success: true,
            version: ultima.version,
            contenido: contenido,
            metadata: ultima,
            entorno: process.env.NODE_ENV || 'production'
        });

    } catch (error) {
        console.error('Error en /api/clausula/ultima:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/clausula/:version', async (req, res) => {
    try {
        const version = req.params.version;
        const contenido = await obtenerClausula(version);

        res.json({
            success: true,
            version: version,
            contenido: contenido,
            entorno: process.env.NODE_ENV || 'production'
        });
    } catch (error) {
        console.error(`Error en /api/clausula/${req.params.version}:`, error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/clausula/versiones', async (req, res) => {
    try {
        const versiones = await listarVersiones();
        res.json({
            success: true,
            versiones: versiones
        });
    } catch (error) {
        console.error('Error en /api/clausula/versiones:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/clausula/guardar', async (req, res) => {
    try {
        const { contenido, version, metadata } = req.body;

        if (!contenido || !version) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere contenido y versión'
            });
        }

        const resultado = await guardarClausula(contenido, version, metadata);
        res.json(resultado);

    } catch (error) {
        console.error('Error en /api/clausula/guardar:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date(),
        entorno: process.env.NODE_ENV || 'production'
    });
});

app.use('/api', empleados);
app.use('/api', signature);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Interfaz/tratamiento_datos/index.html'));
});

if (process.env.NODE_ENV === 'development') {
    verificarConexion().catch(console.error);
}

app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'Ruta API no encontrada',
            path: req.path
        });
    }

    res.sendFile(path.join(__dirname, 'Interfaz/tratamiento_datos/index.html'));
});

app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'production'}`);
    console.log(`Bucket: clausulas-logyser`);
    console.log(`Endpoints:`);
    console.log(`   - GET  /api/health`);
    console.log(`   - GET  /api/clausula/ultima`);
    console.log(`   - GET  /api/clausula/:version`);
    console.log(`   - GET  /api/clausula/versiones`);
    console.log(`   - POST /api/clausula/guardar`);
});