import React from 'react'
import { ResizableBox } from 'react-resizable'
import 'react-resizable/css/styles.css' // Import the styles for react-resizable

export default function ReportWidget ({
  children,
  width,
  height,
  onResize,
  minConstraints,
  maxConstraints
}) {
  return (
    <ResizableBox
      width={width}
      height={height}
      onResize={onResize}
      minConstraints={minConstraints}
      maxConstraints={maxConstraints}
      className='box'
      handle={<span className='react-resizable-handle' />}
    >
      <div className='widget-content'>{children}</div>
    </ResizableBox>
  )
}
