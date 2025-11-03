import React from 'react'
import { useSelector } from 'react-redux'
import AlertItem from './alertlist'
import StatisticsChart from './statisticsalerts'

const Alerts = () => {
  const { alerts, wsConnected } = useSelector(state => state.alerts)

  return (
    <div className='min-h-screen bg-[#1a1d29] p-6  w-full'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-white text-3xl font-bold'>Alertas</h1>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-gray-700 overflow-hidden'>
              <img
                src='/api/placeholder/40/40'
                alt='User'
                className='w-full h-full object-cover'
              />
            </div>
            {wsConnected && (
              <span className='w-2 h-2 bg-green-500 rounded-full'></span>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 w-full'>
          {/* <StatisticsChart /> */}
          <div className='bg-[#2a2f45] w-full rounded-lg p-4'>
            <h2 className='text-white text-xl font-semibold mb-4'>
              Últimos Alertas
            </h2>
            <div className='space-y-4'>
              {alerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Alerts
