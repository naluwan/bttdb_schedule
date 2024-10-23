import Image from 'next/image';

const logo = () => {
  return (
    <Image
      height={130}
      width={130}
      alt='logo'
      className='h-auto w-auto'
      src='/dashboard.png'
      priority
    />
  );
};

export default logo;
