import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import Employee, { EmployeeType } from '@/models/Employee';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connect from './mongodb';
import Company from '@/models/Company';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', passReqToCallback: true },
    async (req, email, password, done) => {
      try {
        await connect();

        const { companyName } = req.body;

        const company = await Company.findOne({ enName: companyName });
        const employee: EmployeeType | null = await Employee.findOne({
          email,
        });

        if (!employee) {
          return done(null, false, { message: '帳號錯誤' });
        }

        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
          return done(null, false, { message: '密碼錯誤' });
        }

        if (!company || employee.company.toString() !== company._id.toString()) {
          return done(null, false, { message: '請確認登入網址是否正確' });
        }

        if (employee.isLock) {
          return done(null, false, { message: '帳號已被鎖定，請洽管理員' });
        }

        const payload = { id: employee._id, email: employee.email, role: employee.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        return done(null, { user: employee, token });
      } catch (err) {
        console.log('err', err);
        return done(err);
      }
    },
  ),
);

export default passport;
