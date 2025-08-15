import { Router, Request, Response } from 'express';
import { supabase } from '../../utils/supabase';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = Router();

// JWT secret - в production используйте переменную окружения
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

interface AuthRequest extends Request {
  body: {
    email?: string;
    password?: string;
  };
}

// Регистрация продавца
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email и пароль обязательны'
      });
    }

    // Проверяем, существует ли пользователь
    const { data: existingUser } = await supabase
      .from('sellers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя в базе данных
    const { data: newUser, error } = await supabase
      .from('sellers')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({
        error: 'Ошибка при создании пользователя'
      });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Вход продавца
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email и пароль обязательны'
      });
    }

    // Получаем пользователя из базы данных
    const { data: user, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: 'Неверный email или пароль'
      });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Неверный email или пароль'
      });
    }

    // Обновляем last_login
    await supabase
      .from('sellers')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        shop_name: user.shop_name
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Отправка OTP
router.post('/send-otp', async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    return res.status(500).json({ error: 'Failed to send OTP' });
  }

  return res.json({ success: true, message: 'OTP sent' });
});

// Подтверждение OTP
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const { data, error } = await supabase.auth.verifyOtp({ 
    phone, 
    token: otp,
    type: 'sms'
  });

  if (error || !data.session) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  return res.json({ success: true, session: data.session });
});

// Проверка токена
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Токен не предоставлен'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, email: string };
    
    // Получаем актуальные данные пользователя
    const { data: user, error } = await supabase
      .from('sellers')
      .select('id, email, shop_name')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: 'Пользователь не найден'
      });
    }

    return res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Verify error:', error);
    return res.status(401).json({
      error: 'Недействительный токен'
    });
  }
});

// Выход (опционально - можно просто удалить токен на клиенте)
router.post('/logout', (req: Request, res: Response) => {
  // В JWT подходе выход обычно обрабатывается на клиенте
  // путем удаления токена из localStorage/sessionStorage
  return res.json({
    success: true,
    message: 'Вы успешно вышли из системы'
  });
});

export default router;
