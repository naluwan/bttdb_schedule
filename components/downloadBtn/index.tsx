import React, { useState } from 'react';
import axios from 'axios';

const DownloadExcelButton = ({
  month,
  companyName,
}: {
  month: number;
  companyName: string;
}) => {
  const [loading, setLoading] = useState(false);

  const downloadExcel = async () => {
    setLoading(true);
    const data = {
      month,
      companyName,
    };
    try {
      const response = await axios.post(`/api/${companyName}/shift/download`, data, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${month}月班表.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('下載錯誤:', error);
      alert('下載失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={downloadExcel}
      className='rounded-md bg-green-500 px-4 py-2 text-white'
      disabled={loading}
    >
      {loading ? '下載中...' : '下載 Excel 班表'}
    </button>
  );
};

export default DownloadExcelButton;
