'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getResponseTimeStats, ResponseTimeStats } from '@/lib/api/client'
import { Activity, Clock, CheckCircle, XCircle } from 'lucide-react'

export function ResponseTimeCard() {
  const [stats, setStats] = useState<ResponseTimeStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getResponseTimeStats()
        setStats(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch response time stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            JotiHunt API Response Times
          </CardTitle>
          <CardDescription>
            API endpoint performance metrics (last 24 hours)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            JotiHunt API Response Times
          </CardTitle>
          <CardDescription>
            API endpoint performance metrics (last 24 hours)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (successRate: number) => {
    if (successRate >= 98) return 'bg-green-500'
    if (successRate >= 95) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getResponseTimeColor = (avgTime: number) => {
    if (avgTime < 500) return 'text-green-600'
    if (avgTime < 1000) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          JotiHunt API Response Times
        </CardTitle>
        <CardDescription>
          API endpoint performance metrics (last 24 hours)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">No response time data available</span>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.endpoint} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(stat.success_rate)}`} />
                  <div>
                    <p className="font-medium capitalize">{stat.endpoint}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.total_requests} requests
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className={`font-medium ${getResponseTimeColor(stat.avg_response_time)}`}>
                      {stat.avg_response_time}ms
                    </p>
                    <p className="text-muted-foreground">avg</p>
                  </div>
                  <div className="text-center">
                    <Badge 
                      variant={stat.success_rate >= 98 ? "default" : stat.success_rate >= 95 ? "secondary" : "destructive"}
                      className="font-mono"
                    >
                      {stat.success_rate}%
                    </Badge>
                    <p className="text-muted-foreground mt-1">success</p>
                  </div>
                  {stat.failed_requests > 0 && (
                    <div className="text-center">
                      <p className="font-medium text-red-600">{stat.failed_requests}</p>
                      <p className="text-muted-foreground">failed</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Auto-refreshes every 30 seconds
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
