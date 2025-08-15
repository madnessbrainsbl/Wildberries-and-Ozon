import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Токен авторизации не предоставлен'
      });
    }

    // Сначала пытаемся проверить через Supabase
    const { data: { user: supabaseUser }, error: supabaseError } = await supabase.auth.getUser(token);
    
    if (supabaseUser && !supabaseError) {
      // Это токен Supabase
      req.user = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        phone: supabaseUser.phone
      };
      return next();
    }

    // Если не Supabase токен, проверяем JWT токен
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      
      // Проверяем, существует ли пользователь в базе данных
      const { data: user, error } = await supabase
        .from('sellers')
        .select('id, email, phone')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        return res.status(401).json({
          error: 'Пользователь не найден'
        });
      }

      // Добавляем информацию о пользователе в запрос
      req.user = {
        id: user.id,
        email: user.email,
        phone: user.phone
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Недействительный токен'
        });
      }
      
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: 'Токен истек'
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Ошибка аутентификации'
    });
  }
};

// Middleware для проверки только Supabase токенов
export const authenticateSupabase = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Токен авторизации не предоставлен'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Недействительный токен Supabase'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone
    };

    next();
  } catch (error) {
    console.error('Supabase auth middleware error:', error);
    return res.status(500).json({
      error: 'Ошибка аутентификации'
    });
  }
};
