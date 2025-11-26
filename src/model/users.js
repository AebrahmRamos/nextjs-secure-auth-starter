import mongoose, {Schema} from 'mongoose';
import bcrypt from "bcrypt";

const SALT_WORK_FACTOR = 10;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 6,
        maxlength: 20,
        validate: {
            validator: function(v) {
                if (this.oauthProvider) {
                    return /^[a-zA-Z0-9._-]+$/.test(v);
                }
                return /^[a-zA-Z0-9_]+$/.test(v);
            },
            message: 'Username can only contain letters, numbers, and underscores (or dots/dashes for OAuth users).'
        },
    },
    password: {
        type: String,
        required: function() {
            return !this.oauthProvider;
        },
        select: false,
        validate: {
            validator: function(v) {
                if (this.oauthProvider) return true;
                
                if (!v || v.length < 12) return false;
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@#?!%*&\-_.+=~`]{12,}$/.test(v);
            },
            message: 'Password must be at least 12 characters long and contain at least one lowercase letter, one uppercase letter, and one digit.'
        },
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            }
        },
    },
    role: {
        type: String,
        enum: ['admin', 'moderator', 'user'],
        required: true,
        trim: true,
        default: 'user',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    lockoutUntil: {
        type: Date,
        default: null,
    },
    loginAttempts: {
        type: Number,
        default: 0,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    previousLogin: {
        type: Date,
        default: null,
    },
    passwordHistory: [{
        password: String,
        createdAt: { type: Date, default: Date.now }
    }],
    passwordChangedAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    oauthProvider: {
        type: String,
        enum: ['google', null],
        default: null,
    },
    oauthId: {
        type: String,
        default: null,
    },
    failedAttempts: { 
        type: Number,
        default: 0 
    },
    lastFailedAttempt: { 
        type: Date 
    },
    lockUntil: { 
        type: Date 
    },
    securityQuestions: [{
        question: {
            type: String,
            enum: [
                "What is a specific childhood memory that stands out to you?",
                "What was the name of your first childhood friend?",
                "What is your oldest sibling's middle name?",
                "What street did you live on when you were 10 years old?",
                "What was your childhood nickname that only family used?"
            ]
        },
        answer: {
            type: String,
            select: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
});

/**
 * Middleware function to hash the user's password before saving it to the database.
 * Skips password hashing for OAuth users or if password is not modified.
 *
 * @param {Function} next Callback function to proceed to the next middleware.
 */
userSchema.pre("save", async function (next) {
    const user = this;
    this.updatedAt = Date.now();
    
    if (!user.isModified("password") || user.oauthProvider)
        return next();

    try {
        const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
        next();
    } catch(err){
        console.error(err);
        return next(err);
    }
});

userSchema.pre("save", async function (next) {
    if (this.isModified("securityQuestions")) {
        console.log('Security questions middleware triggered');
        console.log('Questions count:', this.securityQuestions.length);
        for (let i = 0; i < this.securityQuestions.length; i++) {
            const question = this.securityQuestions[i];
            console.log(`Question ${i}:`, question.question);
            console.log(`Answer ${i} exists:`, !!question.answer);
            if (question.answer && !question.answer.startsWith('$2b$')) {
                console.log(`Hashing answer ${i}`);
                const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
                question.answer = await bcrypt.hash(question.answer.toLowerCase().trim(), salt);
                console.log(`Answer ${i} hashed:`, question.answer.startsWith('$2b$'));
            }
        }
    }
    next();
});

/**
 * Method to compare a candidate password with the user's hashed password.
 *
 * @param {String} candidatePassword The password to compare.
 * @returns {Promise<Boolean>} Returns a promise that resolves to true if the passwords match or false otherwise.
 */
userSchema.method("comparePassword", function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
});

const MAX_LOGIN_ATTEMPTS = 5;
const MAX_LOCK_MINUTES = 30;

/**
 * Virtual to check if account is locked
 */
userSchema.virtual('isAccountLocked').get(function() {
    return !!(this.lockoutUntil && this.lockoutUntil > Date.now());
});

/**
 * Method to handle login attempts and lockout.
 * Increments login attempts and locks account after reaching maximum attempts.
 *
 * @returns {Promise} Promise that resolves to update operation result
 */
userSchema.method("incLoginAttempts", async function () {
  const now = Date.now();
  const User = this.constructor;
  
  let updateData = {};

  // If lock has expired, reset attempts
  if (this.lockoutUntil && this.lockoutUntil < now) {
    updateData.loginAttempts = 1;
    updateData.$unset = { lockoutUntil: 1 };
    updateData.isLocked = false;
  } else {
    updateData.$inc = { loginAttempts: 1 };
  }

  // Check if we need to lock after incrementing
  const currentAttempts = this.loginAttempts + 1;
  if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockMinutes = Math.min(MAX_LOCK_MINUTES, Math.pow(2, currentAttempts - MAX_LOGIN_ATTEMPTS));
    updateData.lockoutUntil = new Date(now + lockMinutes * 60 * 1000);
    updateData.isLocked = true;
  }

  // Update directly without triggering validation
  await User.updateOne({ _id: this._id }, updateData);
  
  // Update local instance for consistency
  if (updateData.$inc) {
    this.loginAttempts += 1;
  } else if (updateData.loginAttempts !== undefined) {
    this.loginAttempts = updateData.loginAttempts;
  }
  if (updateData.lockoutUntil) this.lockoutUntil = updateData.lockoutUntil;
  if (updateData.isLocked !== undefined) this.isLocked = updateData.isLocked;
});

/**
 * Method to reset login attempts on successful login.
 * Clears lockout status and updates login timestamps.
 *
 * @returns {Promise} Promise that resolves to update operation result
 */
userSchema.method("resetLoginAttempts", function() {
    return this.updateOne({
        $unset: {
            loginAttempts: 1,
            lockoutUntil: 1
        },
        $set: {
            isLocked: false,
            previousLogin: this.lastLogin,
            lastLogin: new Date()
        }
    });
});

/**
 * Method to check if password can be changed (must be at least 1 day old).
 *
 * @returns {Boolean} True if password can be changed, false otherwise
 */
userSchema.method("canChangePassword", function() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.passwordChangedAt <= oneDayAgo;
});

/**
 * Method to check if password has been used before.
 * Compares new password against password history to prevent reuse.
 *
 * @param {String} newPassword The new password to check
 * @returns {Promise<Boolean>} True if password was used before, false otherwise
 */
userSchema.method("isPasswordReused", async function(newPassword) {
    // First check against current password
    if (this.password) {
        const isCurrentMatch = await bcrypt.compare(newPassword, this.password);
        if (isCurrentMatch) return true;
    }
    
    // Then check against password history
    if (!this.passwordHistory || this.passwordHistory.length === 0) {
        return false;
    }
    
    const recentPasswords = this.passwordHistory.slice(-5);
    for (const historyEntry of recentPasswords) {
        const isMatch = await bcrypt.compare(newPassword, historyEntry.password);
        if (isMatch) return true;
    }
    return false;
});

userSchema.virtual("publicProfile").get(function () {
  return {
    username: this.username,
    role: this.role,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  };
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;