'use client';

export default function SubscriptionPlanCard({ name, price, features }: { name: string; price: string; features: string[] }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold text-gray-800 mb-2">{name}</h3>
      <p className="text-3xl font-bold text-blue-600 mb-4">{price}/tháng</p>

      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="text-gray-600 flex items-center gap-2">
            <span className="text-green-500">✓</span> {feature}
          </li>
        ))}
      </ul>

      <div className="space-x-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Sửa</button>
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Xóa</button>
      </div>
    </div>
  );
}