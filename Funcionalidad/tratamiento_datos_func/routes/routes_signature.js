import express from 'express';
import signatureController from '../controllers/controller_signature.js';

const router = express.Router();

router.post('/guardar-autorizacion', signatureController.saveSignature);
router.get('/archivos/:identification', signatureController.getUserFiles);

export default router;