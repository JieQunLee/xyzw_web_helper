const STORAGE_PREFIX = "xyzw";

export const AUTH_STORAGE_KEYS = {
  token: `${STORAGE_PREFIX}:auth:token`,
  user: `${STORAGE_PREFIX}:auth:user`,
  activeAccountId: `${STORAGE_PREFIX}:auth:activeAccountId`,
  registeredUsers: `${STORAGE_PREFIX}:auth:registeredUsers`,
};

const normalizeAccountId = (accountId) => {
  if (!accountId) return null;
  return String(accountId).trim() || null;
};

export const getActiveAccountId = () => {
  const accountId = localStorage.getItem(AUTH_STORAGE_KEYS.activeAccountId);
  return normalizeAccountId(accountId);
};

export const setActiveAccountId = (accountId) => {
  const normalized = normalizeAccountId(accountId);
  if (normalized) {
    localStorage.setItem(AUTH_STORAGE_KEYS.activeAccountId, normalized);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEYS.activeAccountId);
  }
};

export const getRegisteredUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.registeredUsers) || "[]");
  } catch (error) {
    console.warn("解析注册用户列表失败:", error);
    return [];
  }
};

export const setRegisteredUsers = (users) => {
  localStorage.setItem(
    AUTH_STORAGE_KEYS.registeredUsers,
    JSON.stringify(Array.isArray(users) ? users : []),
  );
};

export const buildAccountStorageKey = (suffix, accountId = getActiveAccountId()) => {
  const normalized = normalizeAccountId(accountId);
  if (!normalized) return null;
  return `${STORAGE_PREFIX}:account:${normalized}:${suffix}`;
};

export const buildIndexedDbTokenKey = (tokenKey, accountId = getActiveAccountId()) => {
  const normalized = normalizeAccountId(accountId);
  if (!normalized) return String(tokenKey);
  return `${STORAGE_PREFIX}:idb:${normalized}:${tokenKey}`;
};

export const isIndexedDbTokenKeyForAccount = (
  dbKey,
  accountId = getActiveAccountId(),
) => {
  const normalized = normalizeAccountId(accountId);
  if (!normalized) return false;
  return String(dbKey).startsWith(`${STORAGE_PREFIX}:idb:${normalized}:`);
};

export const buildCrossTabConnectionKey = (
  tokenId,
  accountId = getActiveAccountId(),
) => {
  const normalized = normalizeAccountId(accountId) || "anonymous";
  return `ws_connection_${normalized}_${tokenId}`;
};
