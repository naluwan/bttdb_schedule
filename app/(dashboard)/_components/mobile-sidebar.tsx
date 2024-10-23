import { NotepadText, Users, BriefcaseBusiness, Blocks, Menu } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import useStore from '@/store';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import sheetLogo from '@/public/dashboard.png';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

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

const MobileSidebar = () => {
  const pathName = usePathname();

  const { user } = useStore((state) => {
    return { user: state.user };
  });

  const routes = user?.role === 'admin' ? normalRoutes.concat(adminRoutes) : normalRoutes;

  return (
    <Sheet>
      <SheetTrigger className='pr-4 transition hover:opacity-75 md:hidden'>
        <Menu />
      </SheetTrigger>
      <SheetContent side='right' className='bg-white p-0'>
        <SheetTitle>
          <VisuallyHidden.Root>Mobile Sidebar</VisuallyHidden.Root>
        </SheetTitle>
        <SheetDescription>
          <VisuallyHidden.Root>Description goes here</VisuallyHidden.Root>
        </SheetDescription>
        <div className='flex h-full flex-col overflow-y-auto border-r bg-white shadow-sm'>
          <div className='p-6'>
            <Image src={sheetLogo} width={130} height={130} alt='sheet-logo' />
          </div>
          <div className='flex h-full w-full flex-col'>
            <div className={cn('flex w-full flex-col items-start gap-y-2')}>
              {routes.map((route) => {
                const isActive =
                  (pathName === '/' && route.href === '/') ||
                  pathName === route.href ||
                  pathName?.startsWith(`${route.href}/`);

                const ItemContent = (
                  <>
                    <div
                      className={cn(
                        'mr-auto h-full border-2 border-slate-400 opacity-0 transition-all duration-500',
                        isActive && 'opacity-100',
                      )}
                    />
                    <div className='flex justify-start pl-2'>{route.label}</div>
                  </>
                );

                return (
                  <SheetClose asChild key={route.label}>
                    <Link
                      href={route.href}
                      type='button'
                      className={cn(
                        'flex h-full flex-row items-center text-lg font-[500] text-black outline-none transition-all duration-500 hover:text-slate-600',
                        isActive && 'text-slate-700 hover:text-slate-600',
                      )}
                    >
                      {ItemContent}
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;
