import React from 'react'
import { FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import './AddWidgetModal.css'

const AddWidgetModal = ({ widgets, onAddWidget, onClose }) => {
  const { t } = useTranslation()

  return (
    <div className='modal-overlay'>
      <div className='modal-content'>
        <div className='modal-header'>
          <h2>{t('dashboard.add_widget')}</h2>
          <button onClick={onClose} className='close-button'>
            <FiX />
          </button>
        </div>
        <div className='modal-body'>
          {widgets.map(widget => (
            <div
              key={widget.id}
              className='widget-card'
              onClick={() => onAddWidget(widget.id)}
            >
              <h3>{t(widget.titleKey)}</h3>
              <p>{widget.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AddWidgetModal
