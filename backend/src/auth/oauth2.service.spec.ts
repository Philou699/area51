import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { OAuth2Service } from './oauth2.service';
import { UsersService } from '../users/users.service';

describe('OAuth2Service', () => {
  let service: OAuth2Service;
  let usersService: jest.Mocked<UsersService>;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    createProviderAccount: jest.fn(),
    upsertProviderAccount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuth2Service,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<OAuth2Service>(OAuth2Service);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyGoogleToken', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      const invalidToken = 'invalid-token';

      await expect(service.verifyGoogleToken(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('loginWithGoogle', () => {
    const mockGoogleProfile = {
      sub: '123456789',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      passwordHash: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      // Mock the verifyGoogleToken method
      jest.spyOn(service, 'verifyGoogleToken').mockResolvedValue(mockGoogleProfile);
    });

    it('should create new user and provider account for new Google user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      usersService.createProviderAccount.mockResolvedValue({
        id: 1,
        userId: 1,
        provider: 'google',
        providerUserId: '123456789',
        accessToken: 'google-token',
        refreshToken: null,
        expiresAt: null,
        createdAt: new Date(),
      });

      const result = await service.loginWithGoogle('google-token');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: '',
      });
      expect(usersService.createProviderAccount).toHaveBeenCalledWith({
        userId: 1,
        provider: 'google',
        providerUserId: '123456789',
        accessToken: 'google-token',
        refreshToken: null,
        expiresAt: null,
      });

      expect(result).toBe(mockUser);
    });

    it('should update provider account for existing user', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.upsertProviderAccount.mockResolvedValue({
        id: 1,
        userId: 1,
        provider: 'google',
        providerUserId: '123456789',
        accessToken: 'google-token',
        refreshToken: null,
        expiresAt: null,
        createdAt: new Date(),
      });

      const result = await service.loginWithGoogle('google-token');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersService.create).not.toHaveBeenCalled();
      expect(usersService.upsertProviderAccount).toHaveBeenCalledWith({
        userId: 1,
        provider: 'google',
        providerUserId: '123456789',
        accessToken: 'google-token',
        refreshToken: null,
        expiresAt: null,
      });

      expect(result).toBe(mockUser);
    });
  });
});
