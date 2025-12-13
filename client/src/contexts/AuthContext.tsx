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
    try {
      const response = await authApi.login({ id, password });
      console.log('🔍 Login response:', response);
      
      // 응답 구조: {success: true, accessToken: '...', refreshToken: '...', userId: '...'}
      // 또는 {success: true, data: {accessToken: '...', refreshToken: '...', user: {...}}}
      if (response.success) {
        const accessToken = (response as any).accessToken || response.data?.accessToken;
        const refreshToken = (response as any).refreshToken || response.data?.refreshToken;
        
        console.log('🔍 Tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
        
        if (accessToken && refreshToken) {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          // 사용자 정보 설정
          if ((response as any).userId) {
            setUser({ id: (response as any).userId });
          } else if (response.data?.user) {
            setUser(response.data.user);
          } else {
            // 사용자 정보 가져오기 시도 (실패해도 계속 진행)
            try {
              const userInfo = await authApi.getMe();
              setUser(userInfo);
            } catch (meError) {
              console.warn('⚠️ getMe 실패, userId로 설정:', meError);
              // userId가 있으면 사용, 없으면 빈 객체라도 설정
              if ((response as any).userId) {
                setUser({ id: (response as any).userId });
              }
            }
          }
        } else {
          console.error('❌ 토큰이 없습니다:', response);
          throw new Error('토큰을 받지 못했습니다.');
        }
      } else {
        const errorMsg = (response as any).error?.message || response.error?.message || '로그인에 실패했습니다.';
        console.error('❌ Login failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      // axios 에러인 경우 response.data에서 메시지 추출
      if (error.response?.data) {
        const responseData = error.response.data;
        let errorMessage = '로그인에 실패했습니다.';
        if (responseData.error) {
          if (typeof responseData.error === 'string') {
            errorMessage = responseData.error;
          } else if (responseData.error.message) {
            errorMessage = responseData.error.message;
          }
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
        throw new Error(errorMessage);
      }
      // 이미 Error 객체인 경우 그대로 전달
      throw error;
    }
  };

  const register = async (id: string, password: string) => {
    try {
      const response = await authApi.register({ id, password });
      console.log('🔍 Register response:', response);
      
      if (response.success) {
        // 회원가입 후 자동 로그인
        // register 응답에는 보통 토큰이 없으므로 login 호출
        try {
          await login(id, password);
        } catch (loginError) {
          console.error('❌ Register 후 login 실패:', loginError);
          // login 실패 시에도 회원가입은 성공했으므로 에러를 던지지 않음
          // 대신 회원가입 성공 메시지와 함께 로그인 페이지로 안내하는 것이 좋지만,
          // 현재 구조상 에러를 던져야 Register.tsx에서 처리할 수 있음
          throw new Error(loginError instanceof Error ? loginError.message : '회원가입은 완료되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.');
        }
      } else {
        const errorMsg = (response as any).error?.message || response.error?.message || '회원가입에 실패했습니다.';
        console.error('❌ Register failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Register error:', error);
      // axios 에러인 경우 response.data에서 메시지 추출
      if (error.response?.data) {
        const responseData = error.response.data;
        let errorMessage = '회원가입에 실패했습니다.';
        if (responseData.error) {
          if (typeof responseData.error === 'string') {
            errorMessage = responseData.error;
          } else if (responseData.error.message) {
            errorMessage = responseData.error.message;
          }
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
        throw new Error(errorMessage);
      }
      // 이미 Error 객체인 경우 그대로 전달
      throw error;
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

