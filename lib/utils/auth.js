import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from '@/lib/db/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const authenticateUser = async (req) => {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('Token extracted:', token ? 'Present' : 'Missing');
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('Token verification failed');
      return null;
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('User not found for token');
      return null;
    }
    
    console.log('User authenticated:', user.email, 'Role:', user.role);
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

export const checkPermission = (user, action, resource) => {
  const permissions = {
    admin: {
      leads: ['create', 'read', 'update', 'delete', 'assign'],
      targets: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete'],
      emails: ['send'],
      reports: ['read'],
      settings: ['read', 'update']
    },
    manager: {
      leads: ['create', 'read', 'update', 'assign'],
      targets: ['create', 'read', 'update'],
      users: ['create', 'read', 'update', 'delete'], // Only for agents
      emails: ['send'],
      reports: ['read']
    },
    agent: {
      leads: ['create', 'read', 'update'], // Only own leads
      targets: ['read'],
      emails: ['send']
    }
  };

  return permissions[user.role]?.[resource]?.includes(action) || false;
};