// src\auth\auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('debería generar un token JWT si las credenciales son correctas', async () => {
      const email = 'test@example.com';
      const password = 'ValidPass123!';
      const user = {
        id: 1,
        email,
        password: await bcrypt.hash(password, 10), // contraseñas encriptadas
        role: 'admin',
      };

      // Simulamos la función findByEmail del servicio de usuarios
      jest.spyOn(authService['usersService'], 'findByEmail').mockResolvedValue(user);

      const result = await authService.login(email, password);

      // Verificamos que el método sign de jwtService se haya llamado correctamente
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email, role: user.role });
      expect(result).toEqual({ token: expect.any(String) });
    });

    it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
      jest.spyOn(authService['usersService'], 'findByEmail').mockResolvedValue(null);
      await expect(authService.login('notfound@example.com', 'anyPassword')).rejects.toThrow(UnauthorizedException);
    });

    it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const email = 'test@example.com';
      const password = 'ValidPass123!';
      const user = {
        id: 1,
        email,
        password: await bcrypt.hash('wrongPassword', 10), // contraseñas incorrectas
        role: 'user',
      };

      jest.spyOn(authService['usersService'], 'findByEmail').mockResolvedValue(user);

      await expect(authService.login(email, password)).rejects.toThrow(UnauthorizedException);
    });
  });
});
