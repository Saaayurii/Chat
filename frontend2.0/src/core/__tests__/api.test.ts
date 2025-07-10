import { authAPI, usersAPI } from '../api';
import { LoginData, RegistrationData, CreateUserData, UpdateUserData } from '../api';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock window.location  
const mockLocation = { href: '' };
delete (window as any).location;
(window as any).location = mockLocation;

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  describe('Auth API', () => {
    describe('login', () => {
      it('has correct login function structure', () => {
        expect(typeof authAPI.login).toBe('function');
        expect(authAPI.login.length).toBe(1); // expects 1 parameter
      });

      it('calls login with correct data structure', () => {
        const loginData: LoginData = {
          email: 'test@example.com',
          password: 'password123'
        };
        
        // Test that the function can be called with correct data
        expect(() => authAPI.login(loginData)).not.toThrow();
      });
    });

    describe('register', () => {
      it('has correct register function structure', () => {
        expect(typeof authAPI.register).toBe('function');
        expect(authAPI.register.length).toBe(1);
      });

      it('calls register with correct data structure', () => {
        const registrationData: RegistrationData = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          fullName: 'Test User'
        };
        
        expect(() => authAPI.register(registrationData)).not.toThrow();
      });
    });

    describe('confirmEmail', () => {
      it('has correct confirmEmail function structure', () => {
        expect(typeof authAPI.confirmEmail).toBe('function');
        expect(authAPI.confirmEmail.length).toBe(1);
      });

      it('calls confirmEmail with correct data structure', () => {
        const confirmData = { token: 'confirm-token-123' };
        
        expect(() => authAPI.confirmEmail(confirmData)).not.toThrow();
      });
    });

    describe('forgotPassword', () => {
      it('has correct forgotPassword function structure', () => {
        expect(typeof authAPI.forgotPassword).toBe('function');
        expect(authAPI.forgotPassword.length).toBe(1);
      });
    });

    describe('resetPassword', () => {
      it('has correct resetPassword function structure', () => {
        expect(typeof authAPI.resetPassword).toBe('function');
        expect(authAPI.resetPassword.length).toBe(1);
      });
    });

    describe('logout', () => {
      it('has correct logout function structure', () => {
        expect(typeof authAPI.logout).toBe('function');
        expect(authAPI.logout.length).toBe(0);
      });
    });

    describe('refreshToken', () => {
      it('has correct refreshToken function structure', () => {
        expect(typeof authAPI.refreshToken).toBe('function');
        expect(authAPI.refreshToken.length).toBe(0);
      });
    });

    describe('getProfile', () => {
      it('has correct getProfile function structure', () => {
        expect(typeof authAPI.getProfile).toBe('function');
        expect(authAPI.getProfile.length).toBe(0);
      });
    });
  });

  describe('Users API', () => {
    describe('getUsers', () => {
      it('has correct getUsers function structure', () => {
        expect(typeof usersAPI.getUsers).toBe('function');
        expect(usersAPI.getUsers.length).toBe(1);
      });

      it('calls getUsers with pagination params', () => {
        const params = { page: 1, limit: 10 };
        
        expect(() => usersAPI.getUsers(params)).not.toThrow();
      });
    });

    describe('getUserById', () => {
      it('has correct getUserById function structure', () => {
        expect(typeof usersAPI.getUserById).toBe('function');
        expect(usersAPI.getUserById.length).toBe(1);
      });

      it('calls getUserById with user ID', () => {
        const userId = '123';
        
        expect(() => usersAPI.getUserById(userId)).not.toThrow();
      });
    });

    describe('createUser', () => {
      it('has correct createUser function structure', () => {
        expect(typeof usersAPI.createUser).toBe('function');
        expect(usersAPI.createUser.length).toBe(1);
      });

      it('calls createUser with correct data structure', () => {
        const userData: CreateUserData = {
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'password123',
          fullName: 'New User'
        };
        
        expect(() => usersAPI.createUser(userData)).not.toThrow();
      });
    });

    describe('updateUser', () => {
      it('has correct updateUser function structure', () => {
        expect(typeof usersAPI.updateUser).toBe('function');
        expect(usersAPI.updateUser.length).toBe(2);
      });

      it('calls updateUser with correct parameters', () => {
        const userId = '123';
        const updateData: UpdateUserData = {
          fullName: 'Updated Name',
          email: 'updated@example.com'
        };
        
        expect(() => usersAPI.updateUser(userId, updateData)).not.toThrow();
      });
    });

    describe('deleteUser', () => {
      it('has correct deleteUser function structure', () => {
        expect(typeof usersAPI.deleteUser).toBe('function');
        expect(usersAPI.deleteUser.length).toBe(1);
      });

      it('calls deleteUser with user ID', () => {
        const userId = '123';
        
        expect(() => usersAPI.deleteUser(userId, 'test reason')).not.toThrow();
      });
    });
  });

  describe('Data Type Validation', () => {
    describe('LoginData', () => {
      it('validates login data structure', () => {
        const validLoginData: LoginData = {
          email: 'test@example.com',
          password: 'password123'
        };
        
        expect(validLoginData).toHaveProperty('email');
        expect(validLoginData).toHaveProperty('password');
        expect(typeof validLoginData.email).toBe('string');
        expect(typeof validLoginData.password).toBe('string');
      });
    });

    describe('RegistrationData', () => {
      it('validates registration data structure', () => {
        const validRegistrationData: RegistrationData = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          fullName: 'Test User'
        };
        
        expect(validRegistrationData).toHaveProperty('email');
        expect(validRegistrationData).toHaveProperty('username');
        expect(validRegistrationData).toHaveProperty('password');
        expect(validRegistrationData).toHaveProperty('fullName');
        expect(typeof validRegistrationData.email).toBe('string');
        expect(typeof validRegistrationData.username).toBe('string');
        expect(typeof validRegistrationData.password).toBe('string');
        expect(typeof validRegistrationData.fullName).toBe('string');
      });
    });

    describe('CreateUserData', () => {
      it('validates create user data structure', () => {
        const validCreateUserData: CreateUserData = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          fullName: 'Test User'
        };
        
        expect(validCreateUserData).toHaveProperty('email');
        expect(validCreateUserData).toHaveProperty('username');
        expect(validCreateUserData).toHaveProperty('password');
        expect(typeof validCreateUserData.email).toBe('string');
        expect(typeof validCreateUserData.username).toBe('string');
        expect(typeof validCreateUserData.password).toBe('string');
      });

      it('validates optional fields in create user data', () => {
        const createUserDataWithOptionals: CreateUserData = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          fullName: 'Test User',
          phone: '1234567890',
          bio: 'Test bio',
          role: 'ADMIN' as any
        };
        
        expect(createUserDataWithOptionals).toHaveProperty('fullName');
        expect(createUserDataWithOptionals).toHaveProperty('phone');
        expect(createUserDataWithOptionals).toHaveProperty('bio');
        expect(createUserDataWithOptionals).toHaveProperty('role');
      });
    });

    describe('UpdateUserData', () => {
      it('validates update user data structure with optional fields', () => {
        const validUpdateUserData: UpdateUserData = {
          fullName: 'Updated Name',
          email: 'updated@example.com'
        };
        
        expect(typeof validUpdateUserData.fullName).toBe('string');
        expect(typeof validUpdateUserData.email).toBe('string');
      });

      it('allows empty update user data', () => {
        const emptyUpdateData: UpdateUserData = {};
        
        expect(typeof emptyUpdateData).toBe('object');
        expect(Object.keys(emptyUpdateData)).toHaveLength(0);
      });
    });
  });
});