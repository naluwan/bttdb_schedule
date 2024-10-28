'use client';
import { BriefcaseBusiness, House, CalendarCheck } from 'lucide-react';
import React from 'react';
import SidebarItem from './sidebar-item';
import useStore from '@/store';
import { useParams } from 'next/navigation';

const SidebarRoutes = () => {
  const { user } = useStore((state) => {
    return { user: state.user };
  });
  const { cpnyName } = useParams();
  const normalRoutes = [
    {
      icon: House,
      label: '首頁',
      href: `/${cpnyName}/schedule`,
    },
    {
      icon: CalendarCheck,
      label: '排班',
      href: `/${cpnyName}/personalSchedule`,
    },
  ];

  const adminRoutes = [
    {
      icon: BriefcaseBusiness,
      label: '員工資訊',
      href: `/${cpnyName}/employee`,
    },
  ];

  const routes =
    user?.role === 'admin' || user?.role === 'super-admin'
      ? normalRoutes.concat(adminRoutes)
      : normalRoutes;

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
