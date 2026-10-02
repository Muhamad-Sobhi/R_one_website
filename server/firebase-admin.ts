import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type ServiceAccount = {
  project_id?: string;
  client_email: string;
  private_key: string;
};

function loadServiceAccount(): ServiceAccount | null {
  const directJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (directJson) {
    return JSON.parse(directJson) as ServiceAccount;
  }

  const configuredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const candidates = new Set<string>();
  if (configuredPath) candidates.add(resolve(process.cwd(), configuredPath));

  let currentDir = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    candidates.add(resolve(currentDir, 'service-account.json'));
    candidates.add(resolve(currentDir, 'Dashboard/service-account.json'));
    candidates.add(resolve(currentDir, '../Dashboard/service-account.json'));
    currentDir = dirname(currentDir);
  }

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const raw = readFileSync(candidate, 'utf8');
    return JSON.parse(raw) as ServiceAccount;
  }

  return null;
}

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'r-one-1450f';
  const credentials = loadServiceAccount();

  if (credentials) {
    return initializeApp({
      credential: cert({
        projectId: credentials.project_id || projectId,
        clientEmail: credentials.client_email,
        privateKey: credentials.private_key.replace(/\\n/g, '\n'),
      }),
      projectId,
    });
  }

  return initializeApp({ credential: applicationDefault(), projectId });
}

export const adminDb = getFirestore(getAdminApp());