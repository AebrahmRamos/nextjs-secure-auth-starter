# Account Lockout Testing Script

## Prerequisites
1. Ensure the application is running
2. Have access to the database to verify lockout states
3. Use a test user account (create one if needed)
4. Note the login endpoint: `/api/auth/login`

## Test Cases

### Test 1: Basic Lockout Trigger
**Objective:** Verify account locks after 5 failed attempts

1. **Setup:**
   - Use test credentials: username `testuser`, correct password `TestPassword123`
   - Ensure account is not locked initially

2. **Steps:**
   ```bash
   # Attempt 1-4: Failed logins (should not lock)
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "wrongpassword"}'
   
   # Expected: 401 status, no lockout message
   # Repeat 3 more times (total 4 failed attempts)
   
   # Attempt 5: Should trigger lockout
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "wrongpassword"}'
   
   # Expected: 401 status, account should now be locked
   ```

3. **Verification:**
   - Check database: `loginAttempts` should be 5, `isLocked` should be true
   - `lockoutUntil` should be set to 30 minutes from now

### Test 2: Lockout Prevention
**Objective:** Verify locked account rejects login attempts

1. **Steps:**
   ```bash
   # Try logging in with correct credentials while locked
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "TestPassword123"}'
   
   # Expected: 423 status with message:
   # "Account is temporarily locked due to multiple failed login attempts. Please try again later."
   ```

2. **Verification:**
   - Should return status 423 (Locked)
   - Security log should record "Account locked" event

### Test 3: Lockout Expiration
**Objective:** Verify account unlocks after timeout

1. **Method A - Wait (for production testing):**
   - Wait 30 minutes
   - Attempt login with correct credentials
   - Should succeed

2. **Method B - Manual unlock (for testing):**
   ```javascript
   // In MongoDB shell or admin interface
   db.users.updateOne(
     {username: "testuser"}, 
     {
       $unset: {lockoutUntil: 1},
       $set: {isLocked: false, loginAttempts: 0}
     }
   )
   ```

3. **Steps:**
   ```bash
   # After unlock, try correct credentials
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "TestPassword123"}'
   
   # Expected: 200 status, successful login
   ```

### Test 4: Reset on Successful Login
**Objective:** Verify login attempts reset after successful login

1. **Setup:**
   - Make 3 failed attempts (don't trigger lockout)
   - Verify `loginAttempts` is 3 in database

2. **Steps:**
   ```bash
   # Successful login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "TestPassword123"}'
   
   # Expected: 200 status, successful login
   ```

3. **Verification:**
   - Check database: `loginAttempts` should be reset to 0
   - `isLocked` should be false
   - `lockoutUntil` should be unset

### Test 5: Edge Cases

#### Test 5a: Non-existent User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "nonexistent", "password": "anypassword"}'

# Expected: 401 status, no lockout (user doesn't exist)
```

#### Test 5b: Empty Credentials
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "", "password": ""}'

# Expected: 400 status, "Missing credentials"
```

#### Test 5c: Inactive Account
```bash
# First, set account as inactive in database
# Then attempt login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "TestPassword123"}'

# Expected: 403 status, "Account is inactive"
```

## Database Verification Queries

### Check User Lockout Status
```javascript
db.users.findOne(
  {username: "testuser"}, 
  {
    username: 1, 
    loginAttempts: 1, 
    isLocked: 1, 
    lockoutUntil: 1,
    lastFailedAttempt: 1
  }
)
```

### Check Security Logs
```javascript
db.securitylogs.find(
  {username: "testuser", eventType: "LOGIN_FAILURE"},
  {eventType: 1, timestamp: 1, details: 1}
).sort({timestamp: -1}).limit(10)
```

## Expected Results Summary

| Test Case | Failed Attempts | Expected Status | Expected Response | Account State |
|-----------|----------------|----------------|-------------------|---------------|
| 1-4 failures | 1-4 | 401 | "Invalid username and/or password" | Not locked |
| 5th failure | 5 | 401 | "Invalid username and/or password" | Locked |
| Login while locked | N/A | 423 | "Account is temporarily locked..." | Locked |
| Login after unlock | N/A | 200 | "Login successful!" | Unlocked, reset |

## Troubleshooting

If tests fail:

1. **Check database connection** - Ensure MongoDB is running
2. **Verify field names** - Ensure `lockoutUntil` (not `lockUntil`) is used consistently
3. **Check virtual property** - `isAccountLocked` should reference `lockoutUntil`
4. **Examine logs** - Check console output and security logs
5. **Verify constants** - `MAX_LOGIN_ATTEMPTS = 5`, `MAX_LOCK_MINUTES = 30`

## Cleanup After Testing

```javascript
// Reset test user
db.users.updateOne(
  {username: "testuser"}, 
  {
    $unset: {lockoutUntil: 1, lastFailedAttempt: 1},
    $set: {isLocked: false, loginAttempts: 0}
  }
)

// Clean up security logs (optional)
db.securitylogs.deleteMany({username: "testuser"})
```