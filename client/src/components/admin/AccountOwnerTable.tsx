'use client';

export default function AccountOwnerTable() {
  const accounts = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyena@example.com', status: 'Hoạt động', joinDate: '2024-01-15' },
    { id: 2, name: 'Trần Thị B', email: 'tranb@example.com', status: 'Hoạt động', joinDate: '2024-02-20' },
    { id: 3, name: 'Lê Văn C', email: 'levanc@example.com', status: 'Bị khóa', joinDate: '2024-03-10' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tên</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trạng Thái</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ngày Tham Gia</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-800">{account.id}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{account.name}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{account.email}</td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  account.status === 'Hoạt động' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {account.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-800">{account.joinDate}</td>
              <td className="px-6 py-4 text-sm space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Sửa</button>
                <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}