import type { ReactNode } from 'react'

interface Props {
  type: 'error' | 'success'
  title: string
  message?: string
  children?: ReactNode
}

export default function Bildirim({ type, title, message, children }: Props) {
  const toneClass = type === 'success' ? 'banner success' : 'banner error'

  return (
    <div className={toneClass} role="alert">
      <strong>{title}</strong>
      {message ? <div>{message}</div> : null}
      {children}
    </div>
  )
}
