import jwt from 'jsonwebtoken';
import Employee, { EmployeeType } from '@/models/Employee';
import connect from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// 驗證JWT TOKEN並回傳對象
export const authenticateToken = async (token: string): Promise<EmployeeType | null> => {
  try {
    await connect();
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = (await Employee.findById(decoded.id).select(
      '-password',
    )) as EmployeeType | null;
    return user; // 找到員工資訊就回傳
  } catch (err) {
    console.error('Token verification failed:', err);
    return null; // 驗證失敗返回null
  }
};

// 驗證使用者權限是否為管理員
export const checkAdmin = (user: EmployeeType) => {
  if (user.role !== 'admin') {
    throw new Error('權限不足');
  }
};

// 驗證使用者權限是否為管理員和行政
export const checkAdminAndAdministrative = (user: EmployeeType) => {
  if (user.role !== 'admin') {
    throw new Error('權限不足');
  }
};

export const checkSuperAdmin = (user: EmployeeType) => {
  if (String(user._id) !== process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
    throw new Error('權限不足');
  }
};
