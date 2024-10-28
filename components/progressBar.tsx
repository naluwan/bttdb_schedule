import React from 'react';

const ProgressBar = ({ uploadProgress }: { uploadProgress: number }) => {
  return (
    <div className='flex h-full w-full items-center justify-center space-x-2'>
      <div className='h-2.5 w-full rounded-full bg-gray-200'>
        <div
          className={'h-2.5 rounded-full bg-black'}
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
      <span className='text-sm font-medium'>{Math.round(uploadProgress)}%</span>
    </div>
  );
};

export default ProgressBar;
