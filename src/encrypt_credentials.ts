import * as fs from 'fs/promises';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config();

function encryptText(data: string, encryptionKey: string): string {
  const initializationVector = crypto.randomBytes(16);
  const hashedEncryptionKey = crypto
    .createHash('sha256')
    .update(encryptionKey)
    .digest('hex')
    .substring(0, 32);
  const cipher = crypto.createCipheriv('aes256', hashedEncryptionKey, initializationVector);
  const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
  return `${initializationVector.toString('hex')}:${encryptedData.toString('hex')}`;
}

async function encryptFile() {
  const encryptionKey = process.env.CREDENTIAL_KEY;
  if (!encryptionKey) {
    console.error('CREDENTIAL_KEY environment variable is not set');
    process.exit(1);
  }
  try {
    const plainContent = await fs.readFile('reddit_credentials.csv', 'utf8');
    const encryptedContent = encryptText(plainContent, encryptionKey);
    await fs.writeFile('reddit_credentials.csv', encryptedContent);
    console.log('File encrypted successfully.');
  } catch (error) {
    console.error('Error encrypting file:', error);
  }
}

encryptFile();
