import { useState, DragEvent, BaseSyntheticEvent } from 'react'
import { useMemoizedFn } from 'ahooks'

function preventDefaults(e: BaseSyntheticEvent) {
  // e.preventDefault()
  // e.stopPropagation()
}

type HookOption = {
  dropCallback: (files?: FileList) => void
}
export default ({ dropCallback }: HookOption) => {
  const [isHighlight, setIsHighlight] = useState(false)

  const dragEnterHandler = useMemoizedFn((e: DragEvent) => {
    preventDefaults(e)
    setIsHighlight(true)
  })

  const dropHandler = useMemoizedFn((e: DragEvent) => {
    preventDefaults(e)
    setIsHighlight(false)
    const dt = e.dataTransfer
    console.log('%c e: ', 'font-size:12px;background-color: #93C0A4;color:#fff;', (e as any))
    const files = dt?.files
    dropCallback(files)
  })

  const dragOutHandler = useMemoizedFn((e: DragEvent) => {
    preventDefaults(e)
    setIsHighlight(false)
  })

  return {
    isHighlight,
    dragEnterHandler,
    dragOutHandler,
    dropHandler,
  }
}
