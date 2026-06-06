import fs from 'fs';
import os from 'os';
import path from 'path';

import type {
  RadioGlobalState,
  RadioLocalState,
  RadioOrgState,
} from '../../../domain.objects/RadioPermissions';

const GLOBAL_STORAGE_PATH =
  '.rhachet/storage/repo=bhuild/role=dispatcher/.meter';
const LOCAL_STATE_FILE = '.meter/radio.uses.jsonc';
const GLOBAL_STATE_FILE = 'radio.uses.global.jsonc';
const ORG_STATE_FILE = 'radio.uses.org.jsonc';

/**
 * parse jsonc content — strip line comments then parse as json
 */
const parseJsonc = (content: string): unknown => {
  // remove single-line comments (// ...)
  const stripped = content
    .split('\n')
    .map((line) => {
      // find // that's not inside a string
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        if (!inString && char === '/' && line[i + 1] === '/') {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join('\n');

  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
};

/**
 * .what = read all radio usage permission state files
 * .why = communicator for permission check — reads local, global, and org states
 */
export const getAllRadioUsagePermissions = async (
  input: {
    cwd: string;
  },
  context: {
    homeDir?: string;
  } = {},
): Promise<{
  global: RadioGlobalState | null;
  org: RadioOrgState | null;
  local: RadioLocalState | null;
}> => {
  const homeDir = context.homeDir ?? os.homedir();

  // read local state
  const localPath = path.join(input.cwd, LOCAL_STATE_FILE);
  const local = readLocalState(localPath);

  // read global state
  const globalStoragePath = path.join(homeDir, GLOBAL_STORAGE_PATH);
  const globalPath = path.join(globalStoragePath, GLOBAL_STATE_FILE);
  const global = readGlobalState(globalPath);

  // read org state
  const orgPath = path.join(globalStoragePath, ORG_STATE_FILE);
  const org = readOrgState(orgPath);

  return { global, org, local };
};

/**
 * read and parse local state file
 */
const readLocalState = (filePath: string): RadioLocalState | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseJsonc(content) as { state?: 'allowed' | 'blocked' };

  if (!parsed || typeof parsed.state !== 'string') {
    return null;
  }

  return { state: parsed.state };
};

/**
 * read and parse global state file
 */
const readGlobalState = (filePath: string): RadioGlobalState | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseJsonc(content) as { blocked?: boolean };

  if (!parsed || typeof parsed.blocked !== 'boolean') {
    return null;
  }

  return { blocked: parsed.blocked };
};

/**
 * read and parse org state file
 */
const readOrgState = (filePath: string): RadioOrgState | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseJsonc(content) as {
    orgs?: Record<string, 'allowed' | 'blocked'>;
  };

  if (!parsed || typeof parsed.orgs !== 'object') {
    return null;
  }

  return { orgs: parsed.orgs };
};
