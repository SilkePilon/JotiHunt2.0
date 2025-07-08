"use client"

import { useEffect, useState } from "react"
import { IconFileText, IconCalendar, IconTag, IconRefresh, IconAward } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

import { 
  getArticles, 
  getAreas, 
  getUserAssignments,
  getDataSummary,
  Article, 
  Area, 
  Assignment, 
  handleApiError 
} from "@/lib/api/client"

export function JotiHuntArticlesTable() {
  const [articles, setArticles] = useState<Article[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = async () => {
    setLoading(true)
    try {
      const [articlesResponse, areasData] = await Promise.all([
        getArticles({ limit: 10 }),
        getAreas()
      ])

      const articlesData = articlesResponse.articles || []
      
      setArticles(articlesData)
      setAreas(areasData)
      
      try {
        const assignmentsResponse = await getUserAssignments('default')
        const assignmentsData = assignmentsResponse.assignments || []
        setAssignments(assignmentsData)
      } catch (assignmentError) {
        console.warn('Failed to fetch assignments:', assignmentError)
        setAssignments([])
      }
      
      setLastUpdated(new Date())
      toast.success('Data refreshed successfully')
    } catch (error) {
      toast.error(handleApiError(error))
      console.error('Failed to fetch JotiHunt data:', error)
      
      if (articles.length === 0) {
        setArticles([
          {
            id: 1,
            title: "Game Start Announcement",
            type: "news",
            publish_at: "2025-07-08T10:00:00Z",
            message: { content: "The JotiHunt has officially started! Good luck to all teams." }
          },
          {
            id: 2,
            title: "Area Status Update",
            type: "hint",
            publish_at: "2025-07-08T11:30:00Z",
            message: { content: "Alpha area is now available for hunting." },
            points: 2,
            max_points: 3
          }
        ])
      }
      
      if (areas.length === 0) {
        setAreas([
          { id: 1, name: "Alpha", status: "green", color: "green" },
          { id: 2, name: "Bravo", status: "red", color: "red" },
          { id: 3, name: "Charlie", status: "green", color: "green" }
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getArticleTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'news':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'hint':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'assignment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'announcement':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getAreaStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'green':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'red':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'orange':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'not started':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="grid gap-6 px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-4 p-3 rounded-lg border">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-full" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 px-4 lg:px-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconFileText className="size-5" />
                Recent Articles
              </CardTitle>
              <CardDescription>Latest JotiHunt news and announcements</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <IconRefresh className="size-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {articles.slice(0, 5).map((article) => (
                <div key={article.id} className="flex items-start space-x-4 p-3 rounded-lg border">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium leading-none">{article.title}</h4>
                      <Badge className={getArticleTypeColor(article.type)}>
                        {article.type}
                      </Badge>
                      {(article.type === 'hint' || article.type === 'opdracht') && article.pointsDisplay && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 flex items-center gap-1">
                                <IconAward className="size-3" />
                                {article.pointsDisplay || `0/${article.type === 'hint' ? 3 : 5}`}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Points earned/maximum</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {article.message?.content || article.content || "No content available"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconCalendar className="size-3" />
                      {formatDate(article.publish_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTag className="size-5" />
              Area Status
            </CardTitle>
            <CardDescription>Current status of hunting areas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.name}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>
                      <Badge className={getAreaStatusColor(area.status || 'unknown')}>
                        {(area.status || 'UNKNOWN').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {area.updated_at ? formatDate(area.updated_at) : 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Progress</CardTitle>
          <CardDescription>
            Track progress of assignments - Last updated: {lastUpdated.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length > 0 ? (
                assignments.slice(0, 5).map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>
                      <Badge className={getArticleTypeColor(assignment.type || 'assignment')}>
                        {assignment.type || 'assignment'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(assignment.status || 'Not Started')}>
                        {assignment.status || 'Not Started'}
                      </Badge>
                    </TableCell>
                    <TableCell>{assignment.user_name || assignment.userName || assignment.reviewer || 'Not Assigned'}</TableCell>
                    <TableCell>
                      {assignment.pointsDisplay ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 flex items-center gap-1">
                                <IconAward className="size-3" />
                                {assignment.pointsDisplay}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Points earned/maximum</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge variant="outline">
                          {assignment.pointsEarned || 0}/{assignment.max_points || 'N/A'}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                articles
                  .filter(article => article.type === 'hint' || article.type === 'opdracht')
                  .slice(0, 5)
                  .map(article => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell>
                        <Badge className={getArticleTypeColor(article.type)}>
                          {article.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(article.status || 'Not Started')}>
                          {article.status || 'Not Started'}
                        </Badge>
                      </TableCell>
                      <TableCell>{article.reviewer || 'Not Assigned'}</TableCell>
                      <TableCell>
                        {article.pointsDisplay ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 flex items-center gap-1">
                                  <IconAward className="size-3" />
                                  {article.pointsDisplay}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Points earned/maximum</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Badge variant="outline">0/{article.type === 'hint' ? 3 : 5}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}
                
              {assignments.length === 0 && articles.filter(article => article.type === 'hint' || article.type === 'opdracht').length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No assignments available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
