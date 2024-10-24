'use client';
import { BriefcaseBusiness, House, CalendarCheck } from 'lucide-react';
import React from 'react';
import SidebarItem from './sidebar-item';
import useStore from '@/store';

const normalRoutes = [
  {
    icon: House,
    label: '首頁',
    href: '/schedule',
  },
  {
    icon: CalendarCheck,
    label: '排班',
    href: '/personalSchedule',
  },
];

const adminRoutes = [
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
