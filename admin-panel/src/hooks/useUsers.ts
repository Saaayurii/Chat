import { useApi } from './useApi';
import { usersAPI, profileAPI } from '@/core/api';
import type { User, PaginatedResponse, CreateUserData, UpdateUserData, UpdateProfileData } from '@/types';

export var useUsers = () => {
  var getUsersApi = useApi<PaginatedResponse<User>>();
  var getUserApi = useApi<User>();
  var createUserApi = useApi<User>();
  var updateUserApi = useApi<User>();
  var deleteUserApi = useApi<any>();
  var blockUserApi = useApi<any>();

  var getUsers = (params?: any) => 
    getUsersApi[3](usersAPI.getUsers(params));

  var getUserById = (id: string) => 
    getUserApi[3](usersAPI.getUserById(id));

  var createUser = (data: CreateUserData) => 
    createUserApi[3](usersAPI.createUser(data));

  var updateUser = (id: string, data: UpdateUserData) => 
    updateUserApi[3](usersAPI.updateUser(id, data));

  var deleteUser = (id: string, reason: string) => 
    deleteUserApi[3](usersAPI.deleteUser(id, reason));

  var toggleUserBlock = (id: string) => 
    blockUserApi[3](usersAPI.toggleUserBlock(id));

  return {
    getUsers: {
      0: getUsersApi[0],
      1: getUsersApi[1],
      2: getUsersApi[2],
      3: getUsers,
      4: getUsersApi[4]
    },
    getUser: {
      0: getUserApi[0],
      1: getUserApi[1],
      2: getUserApi[2],
      3: getUserById,
      4: getUserApi[4]
    },
    createUser: {
      0: createUserApi[0],
      1: createUserApi[1],
      2: createUserApi[2],
      3: createUser,
      4: createUserApi[4]
    },
    updateUser: {
      0: updateUserApi[0],
      1: updateUserApi[1],
      2: updateUserApi[2],
      3: updateUser,
      4: updateUserApi[4]
    },
    deleteUser: {
      0: deleteUserApi[0],
      1: deleteUserApi[1],
      2: deleteUserApi[2],
      3: deleteUser,
      4: deleteUserApi[4]
    },
    toggleBlock: {
      0: blockUserApi[0],
      1: blockUserApi[1],
      2: blockUserApi[2],
      3: toggleUserBlock,
      4: blockUserApi[4]
    }
  };
};

export var useProfile = () => {
  var updateProfileApi = useApi<any>();
  var uploadAvatarApi = useApi<any>();

  var updateProfile = (data: UpdateProfileData) => 
    updateProfileApi[3](profileAPI.updateProfile(data));

  var uploadAvatar = (file: File) => 
    uploadAvatarApi[3](profileAPI.uploadAvatar(file));

  return {
    updateProfile: {
      0: updateProfileApi[0],
      1: updateProfileApi[1],
      2: updateProfileApi[2],
      3: updateProfile,
      4: updateProfileApi[4]
    },
    uploadAvatar: {
      0: uploadAvatarApi[0],
      1: uploadAvatarApi[1],
      2: uploadAvatarApi[2],
      3: uploadAvatar,
      4: uploadAvatarApi[4]
    }
  };
};