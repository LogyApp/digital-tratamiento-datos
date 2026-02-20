import express from 'express';
import employeeController from '../controllers/controller_obtener_usuarios.js';

const router = express.Router();

router.get('/empleados', employeeController.getAllEmployees);
router.get('/empleados/:identification', employeeController.getEmployeeByIdentification);

export default router;