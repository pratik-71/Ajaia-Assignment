import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';

// Mock crypto.randomUUID
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-1234'
  }
});

describe('Database Fallback (LocalStorage)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates and retrieves a document', async () => {
    const ownerId = 'user-1';
    
    // Create doc
    const newDoc = await db.createDocument({
      title: 'Test Doc',
      content: '<p>Hello</p>',
      owner_uuid: ownerId
    });

    expect(newDoc.document_uuid).toBe('test-uuid-1234');
    expect(newDoc.title).toBe('Test Doc');

    // Retrieve doc
    const { owned } = await db.getDocuments(ownerId);
    expect(owned.length).toBe(1);
    expect(owned[0].document_uuid).toBe('test-uuid-1234');
  });

  it('shares a document successfully', async () => {
    const ownerId = 'user-1';
    const targetUserId = 'target-user';
    
    // Create doc
    const newDoc = await db.createDocument({
      title: 'Shared Doc',
      content: '<p>Secret</p>',
      owner_uuid: ownerId
    });

    // Share doc
    await db.shareDocument(newDoc.document_uuid, targetUserId);

    // Retrieve shared doc as target user
    const { shared } = await db.getDocuments(targetUserId);
    expect(shared.length).toBe(1);
    expect(shared[0].title).toBe('Shared Doc');
  });
});
