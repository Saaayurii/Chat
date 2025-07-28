import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          fullName: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('зарегистрирован');
        });
    });

    it('should return 409 for duplicate email', () => {
      // Сначала регистрируем пользователя
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          username: 'duplicate1',
          fullName: 'Duplicate User',
        })
        .expect(201)
        .then(() => {
          // Затем пытаемся зарегистрировать с тем же email
          return request(app.getHttpServer())
            .post('/auth/register')
            .send({
              email: 'duplicate@example.com',
              password: 'password123',
              username: 'duplicate2',
              fullName: 'Another User',
            })
            .expect(409);
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // слишком короткий пароль
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Регистрируем пользователя для тестов входа
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          username: 'loginuser',
          fullName: 'Login User',
        });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('login@example.com');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('Rate limiting', () => {
    it('should enforce rate limit on login attempts', async () => {
      const loginAttempts = [];
      
      // Делаем 6 попыток входа (лимит 5)
      for (let i = 0; i < 6; i++) {
        loginAttempts.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: 'ratelimit@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const results = await Promise.all(loginAttempts);
      
      // Первые 5 попыток должны возвращать 401
      results.slice(0, 5).forEach(res => {
        expect(res.status).toBe(401);
      });
      
      // 6-я попытка должна быть заблокирована (429)
      expect(results[5].status).toBe(429);
    });
  });

  describe('Authentication middleware', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Регистрируем и логинимся для получения токена
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'auth@example.com',
          password: 'password123',
          username: 'authuser',
          fullName: 'Auth User',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'auth@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should access protected route with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject access without token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should reject access with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});