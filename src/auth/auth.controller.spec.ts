// src\auth\auth.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';

// Simulamos el DTO de login directamente en el test
type LoginDto = {
  email: string;
  password: string;
};

// Simulamos un objeto de usuario como el que se usaría en el JSON
const mockUser = (email: string, password: string, role: string) => ({
  id: 1,
  firstName: 'Juan',
  lastName: 'Pérez',
  email,
  password,
  role,
});

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  // Creamos un mock parcial de la respuesta de Express
  const mockResponse: Partial<Response> = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('debería iniciar sesión correctamente y establecer la cookie JWT', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      const user = mockUser(loginDto.email, await bcrypt.hash(loginDto.password, 10), 'admin');
      const token = 'fake.jwt.token';

      (authService.validateUser as jest.Mock).mockResolvedValue(user);
      (authService.login as jest.Mock).mockResolvedValue({ access_token: token });

      await authController.login(loginDto, mockResponse as Response);

      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(mockResponse.cookie).toHaveBeenCalledWith('jwt', token, {
        httpOnly: true,
        sameSite: 'lax',
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Inicio de sesión exitoso' });
    });

    it('debería lanzar un error si las credenciales son inválidas', async () => {
      const loginDto: LoginDto = {
        email: 'wrong@example.com',
        password: 'wrongPass!',
      };

      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(authController.login(loginDto, mockResponse as Response)).rejects.toThrow('Credenciales inválidas');
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('debería limpiar la cookie y responder con mensaje de logout', () => {
      authController.logout(mockResponse as Response);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('jwt');
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Sesión cerrada correctamente' });
    });
  });
});
