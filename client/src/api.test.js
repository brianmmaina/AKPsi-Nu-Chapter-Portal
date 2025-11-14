import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mocks using vi.hoisted (required for vi.mock factory)
const {
  mockPost,
  mockGet,
  mockPut,
  mockRequestInterceptor,
  mockResponseInterceptor,
} = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
  mockPut: vi.fn(),
  mockRequestInterceptor: vi.fn(),
  mockResponseInterceptor: vi.fn(),
}));

// Mock axios BEFORE importing api
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        post: mockPost,
        get: mockGet,
        put: mockPut,
        interceptors: {
          request: {
            use: mockRequestInterceptor,
          },
          response: {
            use: mockResponseInterceptor,
          },
        },
      })),
    },
  };
});

// Now import after mocking
import { auth, families, brothers } from './api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth', () => {
    it('should call login endpoint with password', async () => {
      mockPost.mockResolvedValue({ data: { success: true } });
      
      await auth.login('testpassword');
      
      expect(mockPost).toHaveBeenCalledWith('/auth', { password: 'testpassword' });
    });

    it('should handle login failure', async () => {
      mockPost.mockRejectedValue({
        response: { status: 401, data: { error: 'Invalid password' } },
      });
      
      await expect(auth.login('wrongpassword')).rejects.toThrow();
    });
  });

  describe('families', () => {
    it('should fetch all families', async () => {
      const mockFamilies = [{ id: 1, name: 'WOLFPACK', theme: 'wolfpack' }];
      mockGet.mockResolvedValue({ data: mockFamilies });
      
      const result = await families.getAll();
      
      expect(mockGet).toHaveBeenCalledWith('/families');
      expect(result.data).toEqual(mockFamilies);
    });

    it('should fetch family tree', async () => {
      const mockTree = { brothers: [], relationships: [] };
      mockGet.mockResolvedValue({ data: mockTree });
      
      const result = await families.getTree(1);
      
      expect(mockGet).toHaveBeenCalledWith('/families/1/tree');
      expect(result.data).toEqual(mockTree);
    });
  });

  describe('brothers', () => {
    it('should create a new brother', async () => {
      const brotherData = { name: 'John Doe', family_id: 1 };
      mockPost.mockResolvedValue({ data: { id: 1, success: true } });
      
      await brothers.create(brotherData);
      
      expect(mockPost).toHaveBeenCalledWith('/brothers', {
        ...brotherData,
      });
    });

    it('should update a brother', async () => {
      const updateData = { name: 'John Updated' };
      mockPut.mockResolvedValue({ data: { success: true } });
      
      await brothers.update(1, updateData);
      
      expect(mockPut).toHaveBeenCalledWith('/brothers/1', {
        ...updateData,
      });
    });
  });
});
