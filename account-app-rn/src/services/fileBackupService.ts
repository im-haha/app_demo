import dayjs from 'dayjs';
import CryptoJS from 'crypto-js';
import DocumentPicker, {isCancel, types} from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {AppDataExportPayload} from '@/services/localAppService';

const SUPPORTED_BACKUP_SCHEMA_VERSIONS = new Set([3, 4]);
const ENCRYPTED_BACKUP_FORMAT = 'ACCOUNT_APP_ENCRYPTED_BACKUP_V1';
const ENCRYPTION_ITERATIONS = 180000;

export interface BackupFileInfo {
  fileName: string;
  filePath: string;
}

export interface PickedBackupPayload {
  payload: AppDataExportPayload;
  fileName: string;
  filePath: string;
}

interface EncryptedBackupEnvelope {
  format: typeof ENCRYPTED_BACKUP_FORMAT;
  algorithm: 'AES-256-CBC+HMAC-SHA256';
  iterations: number;
  schemaVersion: number;
  exportedAt: string;
  userId: number;
  encryptedAt: string;
  saltHex: string;
  ivHex: string;
  ciphertextBase64: string;
  macHex: string;
}

function normalizeFilePath(pathOrUri: string): string {
  return pathOrUri.startsWith('file://')
    ? pathOrUri.replace('file://', '')
    : pathOrUri;
}

function formatTimestampForName(dateText?: string): string {
  const date = dateText ? dayjs(dateText) : dayjs();
  return (date.isValid() ? date : dayjs()).format('YYYYMMDD_HHmmss');
}

function isValidBackupPayload(payload: unknown): payload is AppDataExportPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const parsed = payload as Partial<AppDataExportPayload>;

  if (!Number.isFinite(parsed.schemaVersion)) {
    return false;
  }
  if (!SUPPORTED_BACKUP_SCHEMA_VERSIONS.has(Number(parsed.schemaVersion))) {
    return false;
  }
  if (!(typeof parsed.exportedAt === 'string' && dayjs(parsed.exportedAt).isValid())) {
    return false;
  }
  if (!(Number.isFinite(parsed.userId) && Number(parsed.userId) > 0)) {
    return false;
  }

  return Boolean(
    Array.isArray(parsed.accounts) &&
      Array.isArray(parsed.categories) &&
      Array.isArray(parsed.bills) &&
      Array.isArray(parsed.budgets),
  );
}

function isEncryptedBackupEnvelope(payload: unknown): payload is EncryptedBackupEnvelope {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const parsed = payload as Partial<EncryptedBackupEnvelope>;

  return (
    parsed.format === ENCRYPTED_BACKUP_FORMAT &&
    parsed.algorithm === 'AES-256-CBC+HMAC-SHA256' &&
    Number.isFinite(parsed.iterations) &&
    Number(parsed.iterations) > 0 &&
    typeof parsed.saltHex === 'string' &&
    parsed.saltHex.length > 0 &&
    typeof parsed.ivHex === 'string' &&
    parsed.ivHex.length > 0 &&
    typeof parsed.ciphertextBase64 === 'string' &&
    parsed.ciphertextBase64.length > 0 &&
    typeof parsed.macHex === 'string' &&
    parsed.macHex.length > 0 &&
    typeof parsed.exportedAt === 'string' &&
    dayjs(parsed.exportedAt).isValid() &&
    Number.isFinite(parsed.userId) &&
    Number(parsed.userId) > 0
  );
}

function deriveKeys(secret: string, saltHex: string, iterations: number): {
  encryptionKey: CryptoJS.lib.WordArray;
  macKey: CryptoJS.lib.WordArray;
} {
  const derived = CryptoJS.PBKDF2(secret, CryptoJS.enc.Hex.parse(saltHex), {
    keySize: 512 / 32,
    iterations,
    hasher: CryptoJS.algo.SHA256,
  });
  const derivedHex = derived.toString(CryptoJS.enc.Hex);

  return {
    encryptionKey: CryptoJS.enc.Hex.parse(derivedHex.slice(0, 64)),
    macKey: CryptoJS.enc.Hex.parse(derivedHex.slice(64, 128)),
  };
}

function secureEquals(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function encryptBackupPayload(
  payload: AppDataExportPayload,
  encryptionSecret: string,
): EncryptedBackupEnvelope {
  const salt = CryptoJS.lib.WordArray.random(16);
  const iv = CryptoJS.lib.WordArray.random(16);
  const saltHex = salt.toString(CryptoJS.enc.Hex);
  const ivHex = iv.toString(CryptoJS.enc.Hex);
  const {encryptionKey, macKey} = deriveKeys(
    encryptionSecret,
    saltHex,
    ENCRYPTION_ITERATIONS,
  );
  const plaintext = JSON.stringify(payload);
  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(plaintext),
    encryptionKey,
    {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );
  const ciphertextBase64 = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
  const macHex = CryptoJS.HmacSHA256(
    `${payload.userId}:${payload.exportedAt}:${ciphertextBase64}`,
    macKey,
  ).toString(CryptoJS.enc.Hex);

  return {
    format: ENCRYPTED_BACKUP_FORMAT,
    algorithm: 'AES-256-CBC+HMAC-SHA256',
    iterations: ENCRYPTION_ITERATIONS,
    schemaVersion: payload.schemaVersion,
    exportedAt: payload.exportedAt,
    userId: payload.userId,
    encryptedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    saltHex,
    ivHex,
    ciphertextBase64,
    macHex,
  };
}

function decryptBackupPayload(
  encryptedPayload: EncryptedBackupEnvelope,
  encryptionSecret: string,
): AppDataExportPayload {
  const {encryptionKey, macKey} = deriveKeys(
    encryptionSecret,
    encryptedPayload.saltHex,
    encryptedPayload.iterations,
  );
  const expectedMac = CryptoJS.HmacSHA256(
    `${encryptedPayload.userId}:${encryptedPayload.exportedAt}:${encryptedPayload.ciphertextBase64}`,
    macKey,
  ).toString(CryptoJS.enc.Hex);
  if (!secureEquals(expectedMac, encryptedPayload.macHex)) {
    throw new Error('备份文件校验失败，口令错误或文件已损坏');
  }

  const decrypted = CryptoJS.AES.decrypt(
    CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedPayload.ciphertextBase64),
    }),
    encryptionKey,
    {
      iv: CryptoJS.enc.Hex.parse(encryptedPayload.ivHex),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );
  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
  if (!plaintext) {
    throw new Error('备份解密失败，请确认当前账本凭证是否一致');
  }

  const parsed = JSON.parse(plaintext);
  if (!isValidBackupPayload(parsed)) {
    throw new Error('解密成功但备份数据结构无效');
  }
  return parsed;
}

export async function writeBackupPayloadToFile(
  payload: AppDataExportPayload,
  options: {prefix?: string; encryptionSecret: string},
): Promise<BackupFileInfo> {
  const timestamp = formatTimestampForName(payload.exportedAt);
  const prefix = options?.prefix ?? 'account-app-backup';
  const fileName = `${prefix}_${timestamp}.json`;
  const dirPath = `${RNFS.CachesDirectoryPath}/backup`;
  const filePath = `${dirPath}/${fileName}`;
  const encryptedPayload = encryptBackupPayload(payload, options.encryptionSecret);

  await RNFS.mkdir(dirPath);
  await RNFS.writeFile(filePath, JSON.stringify(encryptedPayload, null, 2), 'utf8');

  return {
    fileName,
    filePath,
  };
}

export async function exportBackupByShare(
  payload: AppDataExportPayload,
  options: {encryptionSecret: string},
): Promise<BackupFileInfo> {
  const fileInfo = await writeBackupPayloadToFile(payload, options);

  await Share.open({
    title: '导出账本备份',
    url: `file://${fileInfo.filePath}`,
    type: 'application/json',
    filename: fileInfo.fileName,
    failOnCancel: false,
    saveToFiles: true,
  });

  return fileInfo;
}

export async function pickBackupPayloadFromFile(options: {
  encryptionSecret: string;
}): Promise<PickedBackupPayload | null> {
  try {
    const file = await DocumentPicker.pickSingle({
      type: [types.plainText, 'application/json'],
      copyTo: 'cachesDirectory',
      presentationStyle: 'fullScreen',
    });
    const readablePath = file.fileCopyUri ?? file.uri;
    if (!readablePath) {
      throw new Error('无法读取所选文件路径');
    }
    const normalizedPath = normalizeFilePath(readablePath);
    const content = await RNFS.readFile(normalizedPath, 'utf8');
    const parsed = JSON.parse(content);

    const payload = isEncryptedBackupEnvelope(parsed)
      ? decryptBackupPayload(parsed, options.encryptionSecret)
      : parsed;

    if (!isValidBackupPayload(payload)) {
      throw new Error('备份文件格式不正确，缺少必要字段');
    }

    return {
      payload,
      fileName: file.name ?? 'backup.json',
      filePath: normalizedPath,
    };
  } catch (error: unknown) {
    if (isCancel(error)) {
      return null;
    }
    throw error;
  }
}
