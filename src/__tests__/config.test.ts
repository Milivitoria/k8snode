import { describe, it, expect } from '@jest/globals';
import { findUserByUsername, verifyPassword, hashPassword } from '../config';

describe('Config', () => {
  describe('findUserByUsername', () => {
    it('should find an existing user', () => {
      const user = findUserByUsername('admin');
      expect(user).toBeDefined();
      expect(user?.username).toBe('admin');
      expect(user?.id).toBe('1');
    });

    it('should return undefined for non-existent user', () => {
      const user = findUserByUsername('nonexistent');
      expect(user).toBeUndefined();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hashedPassword = await hashPassword('testpassword');
      const isValid = await verifyPassword('testpassword', hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hashedPassword = await hashPassword('testpassword');
      const isValid = await verifyPassword('wrongpassword', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash gracefully', async () => {
      const isValid = await verifyPassword('password', 'invalid-hash');
      expect(isValid).toBe(false);
    });
  });
});