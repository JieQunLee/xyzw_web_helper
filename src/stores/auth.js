import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useLocalTokenStore } from "./localTokenManager";
import { useTokenStore } from "./tokenStore";
import {
  AUTH_STORAGE_KEYS,
  getRegisteredUsers,
  setRegisteredUsers,
  setActiveAccountId,
} from "./accountNamespace";

export const useAuthStore = defineStore("auth", () => {
  // 状态
  const user = ref(null);
  const token = ref(localStorage.getItem(AUTH_STORAGE_KEYS.token) || null);
  const isLoading = ref(false);
  const isInitialized = ref(false);

  const localTokenStore = useLocalTokenStore();
  const tokenStore = useTokenStore();

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userInfo = computed(() => user.value);

  // 登录 - 移除API调用，使用本地认证
  const login = async (credentials) => {
    try {
      isLoading.value = true;
      const identity = (credentials.username || "").trim();
      const password = credentials.password || "";
      const users = getRegisteredUsers();
      const matchedUser = users.find(
        (item) =>
          (item.username === identity || item.email === identity) &&
          item.password === password,
      );

      if (!matchedUser) {
        return { success: false, message: "用户名/邮箱或密码错误" };
      }

      const sessionToken =
        "local_token_" +
        matchedUser.id +
        "_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substr(2, 9);

      token.value = sessionToken;
      user.value = {
        id: matchedUser.id,
        username: matchedUser.username,
        email: matchedUser.email,
        avatar: matchedUser.avatar || "/icons/xiaoyugan.png",
        createdAt: matchedUser.createdAt,
      };

      localStorage.setItem(AUTH_STORAGE_KEYS.token, token.value);
      localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user.value));
      setActiveAccountId(user.value.id);

      localTokenStore.setUserToken(sessionToken);
      tokenStore.initTokenStore();
      await tokenStore.switchAccountNamespace(user.value.id);

      return { success: true };
    } catch (error) {
      console.error("登录错误:", error);
      return { success: false, message: "本地认证失败" };
    } finally {
      isLoading.value = false;
    }
  };

  // 注册 - 移除API调用，使用本地注册
  const register = async (userInfo) => {
    try {
      isLoading.value = true;

      // 检查用户名是否已存在（简单的本地检查）
      const existingUsers = getRegisteredUsers();
      const userExists = existingUsers.some((u) => u.username === userInfo.username);

      if (userExists) {
        return { success: false, message: "用户名已存在" };
      }

      // 保存新用户信息到本地
      const newUser = {
        username: userInfo.username,
        email: userInfo.email || "",
        password: userInfo.password,
        id: "user_" + Date.now(),
        avatar: "/icons/xiaoyugan.png",
        createdAt: new Date().toISOString(),
      };

      existingUsers.push(newUser);
      setRegisteredUsers(existingUsers);

      return { success: true, message: "注册成功，请登录" };
    } catch (error) {
      console.error("注册错误:", error);
      return { success: false, message: "本地注册失败" };
    } finally {
      isLoading.value = false;
    }
  };

  // 登出
  const logout = () => {
    user.value = null;
    token.value = null;

    // 清除本地存储
    localStorage.removeItem(AUTH_STORAGE_KEYS.token);
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
    localStorage.removeItem("gameRoles");
    setActiveAccountId(null);

    // 清除token管理器中的数据
    localTokenStore.clearUserToken();
    tokenStore.switchAccountNamespace(null);
  };

  // 获取用户信息 - 移除API调用，使用本地数据
  const fetchUserInfo = async () => {
    try {
      if (!token.value) return false;

      // 从本地存储获取用户信息
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEYS.user);
      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser);
          return true;
        } catch (error) {
          console.error("解析用户信息失败:", error);
          logout();
          return false;
        }
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
      logout();
      return false;
    }
  };

  // 初始化认证状态 - 移除API验证，使用本地验证
  const initAuth = async () => {
    if (isInitialized.value) return;

    const savedUser = localStorage.getItem(AUTH_STORAGE_KEYS.user);
    if (!token.value || !savedUser) {
      isInitialized.value = true;
      return;
    }

    try {
      user.value = JSON.parse(savedUser);
      setActiveAccountId(user.value?.id || null);
      localTokenStore.initTokenManager();
      tokenStore.initTokenStore();
      await tokenStore.switchAccountNamespace(user.value?.id || null);
    } catch (error) {
      console.error("初始化认证失败:", error);
      logout();
    }

    isInitialized.value = true;
  };

  return {
    // 状态
    user,
    token,
    isLoading,

    // 计算属性
    isAuthenticated,
    userInfo,

    // 方法
    login,
    register,
    logout,
    fetchUserInfo,
    initAuth,
  };
});
