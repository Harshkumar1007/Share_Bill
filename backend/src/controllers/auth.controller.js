// Auth Controller

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Placeholder response
    res.status(201).json({
      success: true,
      message: 'User registered successfully (Boilerplate)',
      data: {
        id: 'user-uuid-placeholder',
        name,
        email,
        token: 'jwt-token-placeholder'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Placeholder response
    res.status(200).json({
      success: true,
      message: 'User logged in successfully (Boilerplate)',
      data: {
        id: 'user-uuid-placeholder',
        name: 'Mock User',
        email,
        token: 'jwt-token-placeholder'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    res.status(200).json({
      success: true,
      data: req.user || {
        id: 'user-uuid-placeholder',
        name: 'Mock User',
        email: 'user@example.com'
      }
    });
  } catch (error) {
    next(error);
  }
};
