import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = new Storage({
    keyFilename: path.join(__dirname, '../gcs-key.json')
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

export default bucket;