import express from 'express';
import employeeController from '../controllers/controller_obtener_usuarios.js';

const router = express.Router();

router.get('/empleados', employeeController.getAllEmployees);
router.get('/empleados/:identification', employeeController.getEmployeeByIdentification);
router.get('/empleados/id/:id', employeeController.getEmployeeById);
router.get('/exists/:identificacion', employeeController.checkEmployeeExists);
router.get('/signature/:id', employeeController.getEmployeeSignatureById);
router.get('/signature/identificacion/:identificacion', employeeController.getSignatureEmpleado);
router.get('/signature/firma-url/:identificacion', employeeController.getFirmaUrl);
router.put('/signature/:identificacion', employeeController.updateSignatureUrl);
router.put('/document/:identificacion', employeeController.updateDocumentUrl);
router.put('/location/:identificacion', employeeController.updateLocation);
router.post('/signature', employeeController.createSignatureRecord);

export default router;