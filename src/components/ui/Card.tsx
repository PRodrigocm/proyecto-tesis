'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
  icon?: ReactNode
  action?: ReactNode
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  subtitle?: string
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm border border-slate-200
        ${paddingClasses[padding]}
        ${hover ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', icon, action }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-slate-200 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            {icon}
          </div>
        )}
        <div>{children}</div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CardTitle({ children, className = '', subtitle }: CardTitleProps) {
  return (
    <div>
      <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>{children}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`pt-4 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`pt-4 mt-4 border-t border-slate-200 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  )
}
