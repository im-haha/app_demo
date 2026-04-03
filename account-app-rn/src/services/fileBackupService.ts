import dayjs from 'dayjs';
import DocumentPicker, {isCancel, types} from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {AppDataExportPayload} from '@/services/localAppService';

export interface BackupFileInfo {
  fileName: string;
  filePath: string;
}

export interface PickedBackupPayload {
  payload: AppDataExportPayload;
  fileName: string;
  filePath: string;
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

function isValidBackupPayload(payload: any): payload is AppDataExportPayload {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      typeof payload.schemaVersion === 'number' &&
      typeof payload.userId === 'number' &&
      (payload.accounts === undefined || Array.isArray(payload.accounts)) &&
      Array.isArray(payload.categories) &&
      Array.isArray(payload.bills) &&
      Array.isArray(payload.budgets),
  );
}

export async function writeBackupPayloadToFile(
  payload: AppDataExportPayload,
  options?: {prefix?: string},
): Promise<BackupFileInfo> {
  const timestamp = formatTimestampForName(payload.exportedAt);
  const prefix = options?.prefix ?? 'account-app-backup';
  const fileName = `${prefix}_${timestamp}.json`;
  const dirPath = `${RNFS.CachesDirectoryPath}/backup`;
  const filePath = `${dirPath}/${fileName}`;

  await RNFS.mkdir(dirPath);
  await RNFS.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');

  return {
    fileName,
    filePath,
  };
}

export async function exportBackupByShare(
  payload: AppDataExportPayload,
): Promise<BackupFileInfo> {
  const fileInfo = await writeBackupPayloadToFile(payload);

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

export async function pickBackupPayloadFromFile(): Promise<PickedBackupPayload | null> {
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

    if (!isValidBackupPayload(parsed)) {
      throw new Error('备份文件格式不正确，缺少必要字段');
    }

    return {
      payload: parsed,
      fileName: file.name ?? 'backup.json',
      filePath: normalizedPath,
    };
  } catch (error: any) {
    if (isCancel(error)) {
      return null;
    }
    throw error;
  }
}
