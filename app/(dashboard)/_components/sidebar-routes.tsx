'use client';
import { NotepadText, Users, BriefcaseBusiness, Blocks } from 'lucide-react';
import React from 'react';
import SidebarItem from './sidebar-item';
import useStore from '@/store';

const normalRoutes = [
  {
    icon: Blocks,
    label: '庫存系統',
    href: '/stock',
  },
  {
    icon: Users,
    label: '會員資訊',
    href: '/member',
  },
];

const adminRoutes = [
  {
    icon: NotepadText,
    label: '訂單系統',
    href: '/order',
  },
  {
    icon: BriefcaseBusiness,
    label: '員工資訊',
    href: '/employee',
  },
];

const SidebarRoutes = () => {
  const { user } = useStore((state) => {
    return { user: state.user };
  });
  const routes = user?.role === 'admin' ? normalRoutes.concat(adminRoutes) : normalRoutes;

  return (
    <div className='flex w-full flex-col'>
      {routes.map((route) => (
        <SidebarItem
          key={route.href}
          icon={route.icon}
          label={route.label}
          href={route.href}
        />
      ))}
    </div>
  );
};

export default SidebarRoutes;
