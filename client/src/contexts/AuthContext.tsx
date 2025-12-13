import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/services';
import type { UserInfo } from '../api/types';

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (id: string, password: string) => Promise<void>;
  register: (id: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 토큰 확인 및 사용자 정보 가져오기
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userInfo = await authApi.getMe();
          setUser(userInfo);
        } catch (error) {
          // 토큰이 만료되었거나 유효하지 않음
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (id: string, password: string) => {
    const response = await authApi.login({ id, password });
    // 응답 구조: {success: true, accessToken: '...', refreshToken: '...', userId: '...'}
    // 또는 {success: true, data: {accessToken: '...', refreshToken: '...', user: {...}}}
    if (response.success) {
      const accessToken = (response as any).accessToken || response.data?.accessToken;
      const refreshToken = (response as any).refreshToken || response.data?.refreshToken;
      
      if (accessToken && refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // 사용자 정보 설정
        if ((response as any).userId) {
          setUser({ id: (response as any).userId });
        } else if (response.data?.user) {
          setUser(response.data.user);
        } else {
          // 사용자 정보 가져오기
          const userInfo = await authApi.getMe();
          setUser(userInfo);
        }
      } else {
        throw new Error('토큰을 받지 못했습니다.');
      }
    } else {
      throw new Error(response.error?.message || '로그인에 실패했습니다.');
    }
  };

  const register = async (id: string, password: string) => {
    const response = await authApi.register({ id, password });
    if (response.success) {
      // 회원가입 후 자동 로그인
      // register 응답에도 토큰이 있을 수 있으므로 확인
      const accessToken = (response as any).accessToken || response.data?.accessToken;
      const refreshToken = (response as any).refreshToken || response.data?.refreshToken;
      
      if (accessToken && refreshToken) {
        // 토큰이 있으면 직접 설정하고 사용자 정보 가져오기
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        if ((response as any).userId) {
          setUser({ id: (response as any).userId });
        } else if (response.data?.user) {
          setUser(response.data.user);
        } else {
          const userInfo = await authApi.getMe();
          setUser(userInfo);
        }
      } else {
        // 토큰이 없으면 login 호출
        await login(id, password);
      }
    } else {
      throw new Error(response.error?.message || '회원가입에 실패했습니다.');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userInfo = await authApi.getMe();
      setUser(userInfo);
    } catch (error) {
      console.error('사용자 정보 갱신 오류:', error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

