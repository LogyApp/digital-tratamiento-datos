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
            const employee = await employeeService.getEmployeeByidentificacion(identification);

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
}

export default new EmployeeController();