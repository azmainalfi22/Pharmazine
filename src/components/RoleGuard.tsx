import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface RoleGuardProps {
  allow: Array<'admin' | 'manager' | 'employee' | 'salesman'>
  children: ReactNode
  fallback?: ReactNode
}

const RoleGuard = ({ allow, children, fallback = null }: RoleGuardProps) => {
  const { user } = useAuth()

  if (!user) return null

  const userRoles = (user.roles || []).map(r => r.role)
  const permitted = userRoles.some(r => allow.includes(r as any))

  if (!permitted) return <>{fallback}</>
  return <>{children}</>
}

export default RoleGuard


