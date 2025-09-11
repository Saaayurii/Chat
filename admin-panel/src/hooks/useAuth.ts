import { useApi } from './useApi';
import { authAPI } from '@/core/api';
import type { LoginData, RegistrationData, User } from '@/types';

export var useAuth = () => {
  var loginApi = useApi<{ access_token: string; refresh_token: string; user: User }>();
  var registerApi = useApi<any>();
  var profileApi = useApi<{ user: User }>();
  var logoutApi = useApi<any>();

  var login = (data: LoginData) => 
    loginApi[3](authAPI.login(data));

  var register = (data: RegistrationData) => 
    registerApi[3](authAPI.register(data));

  var getProfile = () => 
    profileApi[3](authAPI.getProfile());

  var logout = () => 
    logoutApi[3](authAPI.logout());

  return {
    login: {
      0: loginApi[0],
      1: loginApi[1], 
      2: loginApi[2],
      3: login,
      4: loginApi[4]
    },
    register: {
      0: registerApi[0],
      1: registerApi[1],
      2: registerApi[2], 
      3: register,
      4: registerApi[4]
    },
    profile: {
      0: profileApi[0],
      1: profileApi[1],
      2: profileApi[2],
      3: getProfile,
      4: profileApi[4]
    },
    logout: {
      0: logoutApi[0],
      1: logoutApi[1],
      2: logoutApi[2],
      3: logout,
      4: logoutApi[4]
    }
  };
};