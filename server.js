import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import empleados from './Funcionalidad/tratamiento_datos_func/routes/routes_obtener_usuarios.js';
import signature from './Funcionalidad/tratamiento_datos_func/routes/routes_signature.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = express();
const port = process.env.PORT || 8080;

// Middlewares
main.use(cors());
main.use(bodyParser.json({ limit: '50mb' }));
main.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
main.use(express.json());

// Servir archivos estáticos - esto ya maneja las rutas a archivos
main.use(express.static(path.join(__dirname, 'Interfaz/tratamiento_datos')));

// API Routes - ESPECÍFICAS
main.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date()
    });
});

// Montar las rutas API
main.use('/api', empleados);
main.use('/api', signature);

// Ruta específica para la raíz - sin comodines
main.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Interfaz/tratamiento_datos/index.html'));
});

// Middleware para rutas no encontradas - SIN PATRONES
main.use((req, res) => {
    // Si es una ruta que empieza con /api, responder con JSON 404
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'Ruta API no encontrada'
        });
    }

    // Para cualquier otra ruta, servir el index.html (SPA)
    // Esto permite que el frontend maneje sus propias rutas
    res.sendFile(path.join(__dirname, 'Interfaz/tratamiento_datos/index.html'));
});

main.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});