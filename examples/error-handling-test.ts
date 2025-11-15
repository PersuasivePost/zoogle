/**
 * Example: Testing Error Handling in Zoogle
 * 
 * This file demonstrates how to test the various error scenarios
 * in Zoogle's authentication flow.
 */

import googleAuth, { 
  ZoogleConfigError, 
  ZoogleOAuthError, 
  ZoogleDatabaseError, 
  ZoogleAuthError 
} from '../dist';

// ============================================
// Phase 1: Configuration Error Examples
// ============================================

console.log('\n🧪 Testing Phase 1: Configuration Errors\n');

// Test 1: Missing Client ID
try {
  googleAuth.configure({
    google: {
      clientId: '', // ❌ Empty
      clientSecret: 'test-secret',
      callbackURL: 'http://localhost:3000/auth/callback',
    },
    jwt: {
      secret: 'this-is-a-long-secret-key-minimum-32-characters-long',
    },
    findOrCreateUser: async (profile) => ({
      id: 1,
      email: profile.email,
    }),
  });
} catch (error) {
  if (error instanceof ZoogleConfigError) {
    console.log('✅ Caught ZoogleConfigError');
    console.log('   Field:', error.field);
    console.log('   Message:', error.message);
    console.log('   Has hint:', error.hint.length > 0 ? 'Yes' : 'No');
  }
}

// Test 2: Weak JWT Secret
try {
  googleAuth.configure({
    google: {
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      callbackURL: 'http://localhost:3000/auth/callback',
    },
    jwt: {
      secret: 'short', // ❌ Too short
    },
    findOrCreateUser: async (profile) => ({
      id: 1,
      email: profile.email,
    }),
  });
} catch (error) {
  if (error instanceof ZoogleConfigError) {
    console.log('✅ Caught weak JWT secret error');
    console.log('   Field:', error.field);
  }
}

// Test 3: Missing findOrCreateUser
try {
  googleAuth.configure({
    google: {
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      callbackURL: 'http://localhost:3000/auth/callback',
    },
    jwt: {
      secret: 'this-is-a-long-secret-key-minimum-32-characters-long',
    },
    // @ts-ignore - Intentionally omitting for test
    findOrCreateUser: undefined, // ❌ Missing
  });
} catch (error) {
  if (error instanceof ZoogleConfigError) {
    console.log('✅ Caught missing findOrCreateUser error');
    console.log('   Field:', error.field);
  }
}

// Test 4: findOrCreateUser is not a function
try {
  googleAuth.configure({
    google: {
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      callbackURL: 'http://localhost:3000/auth/callback',
    },
    jwt: {
      secret: 'this-is-a-long-secret-key-minimum-32-characters-long',
    },
    // @ts-ignore - Intentionally wrong type for test
    findOrCreateUser: 'not a function', // ❌ Wrong type
  });
} catch (error) {
  if (error instanceof ZoogleConfigError) {
    console.log('✅ Caught invalid findOrCreateUser type error');
    console.log('   Message:', error.message);
  }
}

// ============================================
// Success: Valid Configuration
// ============================================

console.log('\n🧪 Testing Valid Configuration\n');

try {
  googleAuth.configure({
    google: {
      clientId: 'valid-client-id',
      clientSecret: 'valid-client-secret',
      callbackURL: 'http://localhost:3000/auth/callback',
    },
    jwt: {
      secret: 'this-is-a-long-secret-key-minimum-32-characters-long',
      expiresIn: '7d',
    },
    findOrCreateUser: async (profile) => ({
      id: 1,
      email: profile.email,
    }),
  });
  console.log('✅ Configuration successful!');
} catch (error) {
  console.log('❌ Configuration failed unexpectedly');
}

// ============================================
// Testing Error Class Properties
// ============================================

console.log('\n🧪 Testing Error Class Properties\n');

// Create a sample config error
const configError = new ZoogleConfigError(
  'test.field',
  'Test error message',
  'This is a helpful hint'
);

console.log('ZoogleConfigError properties:');
console.log('  - name:', configError.name);
console.log('  - field:', configError.field);
console.log('  - message:', configError.message);
console.log('  - hint:', configError.hint);
console.log('  - instanceof ZoogleConfigError:', configError instanceof ZoogleConfigError);
console.log('  - instanceof Error:', configError instanceof Error);

// Create a sample OAuth error
const oauthError = new ZoogleOAuthError(
  'Test OAuth error',
  400,
  'invalid_grant'
);

console.log('\nZoogleOAuthError properties:');
console.log('  - name:', oauthError.name);
console.log('  - statusCode:', oauthError.statusCode);
console.log('  - googleError:', oauthError.googleError);
console.log('  - instanceof ZoogleOAuthError:', oauthError instanceof ZoogleOAuthError);

// Create a sample Database error
const originalError = new Error('Duplicate key error');
const dbError = new ZoogleDatabaseError(
  'Database operation failed',
  originalError
);

console.log('\nZoogleDatabaseError properties:');
console.log('  - name:', dbError.name);
console.log('  - originalError.message:', dbError.originalError.message);
console.log('  - instanceof ZoogleDatabaseError:', dbError instanceof ZoogleDatabaseError);

// Create a sample Auth error
const authError = new ZoogleAuthError('token_expired', 'Token has expired');

console.log('\nZoogleAuthError properties:');
console.log('  - name:', authError.name);
console.log('  - errorCode:', authError.errorCode);
console.log('  - message:', authError.message);
console.log('  - instanceof ZoogleAuthError:', authError instanceof ZoogleAuthError);

console.log('\n✅ All error handling tests completed!\n');

export {};
