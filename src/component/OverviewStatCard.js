export default function OverviewStatCard ({ title, value, sub }) {
  return (
    <div className='bg-[#1f2435] rounded-lg p-2   hover:border-t-2 hover:border-[#3885CC] '>
      <p className='text-sm text-gray-400 mb-1'>{title}</p>
      <p className='text-[9pxpx] font-semibold text-white'>{value}</p>
      {sub && <p className='text-xs text-gray-500 mt-1'>{sub}</p>}
    </div>
  )
}
