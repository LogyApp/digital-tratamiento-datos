import employeeService from '../services/service_obtener_usuarios.js';

class EmployeeController {

    async getAllEmployees(req, res) {
        try {
            const employees = await employeeService.getAllEmployees();
            res.json({
                success: true,
                data: employees
            });
        } catch (error) {
            console.error('Error en getAllEmployees:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getEmployeeByIdentification(req, res) {
        try {
            const { identification } = req.params;
            const employee = await employeeService.getEmployeeByIdentificacion(identification);

            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }

            res.json({
                success: true,
                data: employee
            });
        } catch (error) {
            console.error('Error en getEmployeeByIdentification:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getEmployeeById(req, res) {
        try {
            const { id } = req.params;
            const employee = await employeeService.getEmployeeById(id);

            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado por ID'
                });
            }

            res.json({
                success: true,
                data: employee
            });
        } catch (error) {
            console.error('Error en getEmployeeById:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getSignatureEmpleado(req, res) {
        try {
            const { identificacion } = req.params;

            if (!identificacion) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una identificación'
                });
            }

            const response = await employeeService.getSignatureEmpleado(identificacion);

            if (!response.success) {
                return res.status(404).json({
                    success: false,
                    message: response.error
                });
            }

            return res.json({
                success: true,
                data: response.data
            });

        } catch (e) {
            console.error('❌ Error en getSignatureEmpleado:', e);
            return res.status(500).json({
                success: false,
                message: e.message
            });
        }
    }

    async getEmployeeSignatureById(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere un ID'
                });
            }

            const response = await employeeService.getEmployeeSignatureById(id);

            if (!response.success) {
                return res.status(404).json({
                    success: false,
                    message: response.error
                });
            }

            return res.json({
                success: true,
                data: response.data
            });

        } catch (e) {
            console.error('❌ Error en getEmployeeSignatureById:', e);
            return res.status(500).json({
                success: false,
                message: e.message
            });
        }
    }
    async checkEmployeeExists(req, res) {
        try {
            const { identificacion } = req.params;
            const exists = await employeeService.employeeExists(identificacion);

            res.json({
                success: true,
                data: { exists }
            });
        } catch (error) {
            console.error('Error en checkEmployeeExists:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getFirmaUrl(req, res) {
        try {
            const { identificacion } = req.params;
            const firmaUrl = await employeeService.getFirmaUrlByIdentificacion(identificacion);

            if (!firmaUrl) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró firma para esta identificación'
                });
            }

            res.json({
                success: true,
                data: { firma_url: firmaUrl }
            });
        } catch (error) {
            console.error('Error en getFirmaUrl:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateSignatureUrl(req, res) {
        try {
            const { identificacion } = req.params;
            const { firmaUrl } = req.body;

            if (!firmaUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere la URL de la firma'
                });
            }

            const updated = await employeeService.updateEmployeeSignatureUrl(identificacion, firmaUrl);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo actualizar la firma'
                });
            }

            res.json({
                success: true,
                message: 'URL de firma actualizada exitosamente'
            });
        } catch (error) {
            console.error('Error en updateSignatureUrl:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateDocumentUrl(req, res) {
        try {
            const { identificacion } = req.params;
            const { urlTd } = req.body;

            if (!urlTd) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere la URL del documento'
                });
            }

            const updated = await employeeService.updateEmployeeDocumentUrl(identificacion, urlTd);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo actualizar el documento'
                });
            }

            res.json({
                success: true,
                message: 'URL de documento actualizada exitosamente'
            });
        } catch (error) {
            console.error('Error en updateDocumentUrl:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createSignatureRecord(req, res) {
        try {
            const data = req.body;

            if (!data.identificacion || !data.nombre_completo || !data.ciudad_firma) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan datos requeridos: identificacion, nombre_completo, ciudad_firma'
                });
            }

            const id = await employeeService.createSignatureRecord(data);

            res.json({
                success: true,
                message: 'Registro creado exitosamente',
                data: { id }
            });
        } catch (error) {
            console.error('Error en createSignatureRecord:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateLocation(req, res) {
        try {
            const { identificacion } = req.params;
            const data = req.body;

            if (!data.lugar_expedicion || !data.ciudad_firma) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere lugar_expedicion y ciudad_firma'
                });
            }

            const updated = await employeeService.updateEmployeeLocation(identificacion, data);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo actualizar la ubicación'
                });
            }

            res.json({
                success: true,
                message: 'Ubicación actualizada exitosamente'
            });
        } catch (error) {
            console.error('Error en updateLocation:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new EmployeeController();