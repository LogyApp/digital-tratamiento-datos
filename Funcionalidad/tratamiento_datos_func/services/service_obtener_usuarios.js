import pool from '../../../settings/database_connection.js';
import { v4 as uuidv4 } from 'uuid';

class EmployeeService {
    async getAllEmployees() {
        try {
            const [rows] = await pool.query(
                'SELECT id, identificacion, nombre_completo, lugar_expedicion FROM Digital_TD'
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener empleados: ${error.message}`);
        }
    }

    async getEmployeeByidentificacion(identificacion) {
        try {
            const [rows] = await pool.query(
                'SELECT id, identificacion, nombre_completo, lugar_expedicion FROM Digital_TD WHERE identificacion = ?',
                [identificacion]
            );
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error al buscar empleado: ${error.message}`);
        }
    }

    async updateEmployeeSignatureUrl(identificacion, firmaUrl) {
        try {
            const [result] = await pool.query(
                'UPDATE Digital_TD SET firma_url = ? WHERE identificacion = ?',
                [firmaUrl, identificacion]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar firma_url: ${error.message}`);
        }
    }

    async updateEmployeeDocumentUrl(identificacion, urlTd) {
        try {
            const [result] = await pool.query(
                'UPDATE Digital_TD SET url_td = ? WHERE identificacion = ?',
                [urlTd, identificacion]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar url_td: ${error.message}`);
        }
    }

    async createSignatureRecord(data) {
        try {
            const id = uuidv4().substring(0, 8);
            const [result] = await pool.query(
                `INSERT INTO Digital_TD 
             (id, identificacion, nombre_completo, lugar_expedicion, ciudad_firma, firma_url, url_td, fecha_firma) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    data.identificacion,
                    data.nombre_completo,
                    data.lugar_expedicion || null,
                    data.ciudad_firma,
                    data.firma_url,
                    data.url_td,
                    data.fecha_firma || new Date()
                ]
            );
            return id;
        } catch (error) {
            console.error('Error SQL:', error);
            throw new Error(`Error al crear registro: ${error.message}`);
        }
    }

    async updateEmployeeLocation(identificacion, data) {
        try {
            const [result] = await pool.query(
                `UPDATE Digital_TD 
             SET lugar_expedicion = ?, ciudad_firma = ? 
             WHERE identificacion = ?`,
                [data.lugar_expedicion, data.ciudad_firma, identificacion]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar ubicación: ${error.message}`);
        }
    }
}

export default new EmployeeService();