"use client"

import { useEffect, useState } from "react"
import { IconMapPin, IconUsers, IconFileText, IconClock, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ResponseTimeCard } from "@/components/response-time-card"
import { getDataSummary, getResponseTimeStats, DataSummary, ResponseTimeStats } from "@/lib/api/client"

interface JotiHuntStats {
  totalSubscriptions: number
  activeAreas: number
  totalArticles: number
  avgResponseTime: number
  status: 'good' | 'warning' | 'error'
}

export function SectionCards() {
  const [stats, setStats] = useState<JotiHuntStats>({
    totalSubscriptions: 0,
    activeAreas: 0,
    totalArticles: 0,
    avgResponseTime: 0,
    status: 'good'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const [summaryData, responseStats] = await Promise.all([
          getDataSummary(),
          getResponseTimeStats()
        ])

        const avgResponseTime = responseStats.length > 0 
          ? Math.round(responseStats.reduce((sum, stat) => sum + stat.avg_response_time, 0) / responseStats.length)
          : 0

        const responseStatus = avgResponseTime < 500 ? 'good' : avgResponseTime < 1000 ? 'warning' : 'error'

        setStats({
          totalSubscriptions: summaryData.counts.subscriptions,
          activeAreas: summaryData.areaStats.withStatus,
          totalArticles: summaryData.counts.articles,
          avgResponseTime,
          status: responseStatus
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        
        setStats({
          totalSubscriptions: 0,
          activeAreas: 0,
          totalArticles: 0,
          avgResponseTime: 0,
          status: 'error'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge variant="outline" className="text-green-600">Good</Badge>
      case 'warning':
        return <Badge variant="outline" className="text-yellow-600">Slow</Badge>
      case 'error':
        return <Badge variant="outline" className="text-red-600">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="@container/card animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardHeader>
              <CardFooter>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6">
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Participants</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.totalSubscriptions}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconUsers className="size-3" />
                Teams
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              <IconUsers className="size-4" />
              Scouting groups registered
            </div>
            <div className="text-muted-foreground">
              Active JotiHunt participants
            </div>
          </CardFooter>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Active Areas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.activeAreas}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="text-green-600">
                <IconMapPin className="size-3" />
                Available
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              <IconMapPin className="size-4" />
              Huntable areas available
            </div>
            <div className="text-muted-foreground">
              Areas currently active for hunting
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Articles</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.totalArticles}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconFileText className="size-3" />
                Published
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              <IconFileText className="size-4" />
              News & announcements
            </div>
            <div className="text-muted-foreground">
              Game updates and information
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>API Response Time</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.avgResponseTime}ms
            </CardTitle>
            <CardAction>
              {getStatusBadge(stats.status)}
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              <IconClock className="size-4" />
              Average response time
            </div>
            <div className="text-muted-foreground">
              JotiHunt API performance
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <ResponseTimeCard />
    </div>
  )
}
