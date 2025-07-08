"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
  IconCopy,
  IconDownload,
  IconExternalLink,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { getArticles, getArticle, transformArticlesForTable, handleApiError, type Assignment } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CopyButton } from "@/components/animate-ui/buttons/copy"
import { DownloadButton } from "@/components/animate-ui/buttons/download"
import { OpenButton } from "@/components/animate-ui/buttons/open"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export const schema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.string(),
  publish_at: z.string(),
  status: z.string().optional().default("Not Started"),
  reviewer: z.string().optional().default(""),
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// Skeleton loading component for table rows
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="size-7" />
          </TableCell>
          <TableCell>
            <Skeleton className="size-4" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="size-8" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

// Edit Assignment Modal Component
function EditAssignmentModal({ 
  item, 
  onStatusChange, 
  onAssigneeChange 
}: { 
  item: z.infer<typeof schema>
  onStatusChange: (id: number, status: string) => void
  onAssigneeChange: (id: number, assignee: string) => void
}) {
  const [status, setStatus] = React.useState(item.status || "Not Started")
  const [assignee, setAssignee] = React.useState(item.reviewer && item.reviewer !== "" ? item.reviewer : "unassigned")
  const isMobile = useIsMobile()

  const handleSave = () => {
    onStatusChange(item.id, status)
    onAssigneeChange(item.id, assignee)
    toast.success("Assignment updated successfully")
  }

  const scoutingMembers = [
    "Emma van der Berg", "Lars Hendriksen", "Sophie de Vries", "Daan Jansen",
    "Lotte Smit", "Finn van der Meer", "Noa Bakker", "Thijs de Jong",
    "Isa Verschuur", "Sem van Leeuwen", "Mila Koning", "Bram Peters",
    "Zoe van Dam", "Jesse Mulder", "Roos de Boer", "Max van der Laan",
    "Luna Jacobs", "Niels Willems", "Julia van Dijk", "Tom Visser",
    "Eva de Wit", "Jasper Hoekstra", "Saar van der Berg", "Koen Brouwer",
    "Fleur Dijkstra"
  ]

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Edit
        </DropdownMenuItem>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Assignment</DrawerTitle>
          <DrawerDescription>
            Update the status and assigned user for this assignment.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="assignment-title">Assignment</Label>
            <Input id="assignment-title" value={item.title} disabled />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="task-type">Task Type</Label>
            <Input id="task-type" value={item.type} disabled />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="edit-assignee">Assigned User</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger id="edit-assignee">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {scoutingMembers.map((member) => (
                  <SelectItem key={member} value={member}>
                    {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={handleSave}>Save Changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function DraggableRow({ row }: { row: Row<Assignment> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable() {
  const [data, setData] = React.useState<Assignment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [assignments, setAssignments] = React.useState<Record<number, { status: string; reviewer: string }>>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Fetch articles using the new API client
  React.useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true)
        const articles = await getArticles()
        const transformedData = transformArticlesForTable(articles, assignments)
        setData(transformedData)
      } catch (error) {
        console.error('Error fetching articles:', error)
        toast.error(handleApiError(error))
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [assignments])

  // Update assignment status
  const handleStatusChange = React.useCallback((id: number, status: string) => {
    setAssignments(prev => ({
      ...prev,
      [id]: { ...prev[id], status }
    }))
    
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, status } : item
    ))
  }, [])

  // Update assignment reviewer
  const handleAssigneeChange = React.useCallback((id: number, reviewer: string) => {
    const actualReviewer = reviewer === "unassigned" ? "" : reviewer
    setAssignments(prev => ({
      ...prev,
      [id]: { ...prev[id], reviewer: actualReviewer }
    }))
    
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, reviewer: actualReviewer } : item
    ))
  }, [])

  // Create columns with callback functions
  const columns: ColumnDef<Assignment>[] = React.useMemo(() => [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
    },
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Assignment",
      cell: ({ row }) => {
        return <TableCellViewer item={row.original} />
      },
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: "Task Type",
      cell: ({ row }) => (
        <div className="w-32">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.type}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.status === "Done" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          ) : (
            <IconLoader className="animate-spin" />
          )}
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "reviewer",
      header: "Assigned User",
      cell: ({ row }) => {
        const isAssigned = row.original.reviewer && row.original.reviewer !== ""

        if (!isAssigned) {
          return (
            <>
              <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
                Assigned User
              </Label>
              <Select onValueChange={(value) => handleAssigneeChange(row.original.id, value)}>
                <SelectTrigger
                  className="w-48 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
                  size="sm"
                  id={`${row.original.id}-reviewer`}
                >
                  <SelectValue placeholder="Assign to user" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="Emma van der Berg">Emma van der Berg</SelectItem>
                  <SelectItem value="Lars Hendriksen">Lars Hendriksen</SelectItem>
                  <SelectItem value="Sophie de Vries">Sophie de Vries</SelectItem>
                  <SelectItem value="Daan Jansen">Daan Jansen</SelectItem>
                  <SelectItem value="Lotte Smit">Lotte Smit</SelectItem>
                  <SelectItem value="Finn van der Meer">Finn van der Meer</SelectItem>
                  <SelectItem value="Noa Bakker">Noa Bakker</SelectItem>
                  <SelectItem value="Thijs de Jong">Thijs de Jong</SelectItem>
                  <SelectItem value="Isa Verschuur">Isa Verschuur</SelectItem>
                  <SelectItem value="Sem van Leeuwen">Sem van Leeuwen</SelectItem>
                  <SelectItem value="Mila Koning">Mila Koning</SelectItem>
                  <SelectItem value="Bram Peters">Bram Peters</SelectItem>
                  <SelectItem value="Zoe van Dam">Zoe van Dam</SelectItem>
                  <SelectItem value="Jesse Mulder">Jesse Mulder</SelectItem>
                  <SelectItem value="Roos de Boer">Roos de Boer</SelectItem>
                  <SelectItem value="Max van der Laan">Max van der Laan</SelectItem>
                  <SelectItem value="Luna Jacobs">Luna Jacobs</SelectItem>
                  <SelectItem value="Niels Willems">Niels Willems</SelectItem>
                  <SelectItem value="Julia van Dijk">Julia van Dijk</SelectItem>
                  <SelectItem value="Tom Visser">Tom Visser</SelectItem>
                  <SelectItem value="Eva de Wit">Eva de Wit</SelectItem>
                  <SelectItem value="Jasper Hoekstra">Jasper Hoekstra</SelectItem>
                  <SelectItem value="Saar van der Berg">Saar van der Berg</SelectItem>
                  <SelectItem value="Koen Brouwer">Koen Brouwer</SelectItem>
                  <SelectItem value="Fleur Dijkstra">Fleur Dijkstra</SelectItem>
                </SelectContent>
              </Select>
            </>
          )
        }

        return (
          <span className="text-sm">
            {row.original.reviewer}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <EditAssignmentModal 
              item={row.original} 
              onStatusChange={handleStatusChange}
              onAssigneeChange={handleAssigneeChange}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [handleStatusChange, handleAssigneeChange])

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  if (loading) {
    return (
      <Tabs
        defaultValue="outline"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select defaultValue="outline" disabled>
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="outline" disabled>Assignments</TabsTrigger>
            <TabsTrigger value="past-performance" disabled>
              Photo Tasks <Badge variant="secondary">8</Badge>
            </TabsTrigger>
            <TabsTrigger value="key-personnel" disabled>
              Location Tasks <Badge variant="secondary">5</Badge>
            </TabsTrigger>
            <TabsTrigger value="focus-documents" disabled>Challenges</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <IconLayoutColumns />
              <span className="hidden lg:inline">Customize Columns</span>
              <span className="lg:hidden">Columns</span>
              <IconChevronDown />
            </Button>
            <Button variant="outline" size="sm" disabled>
              <IconPlus />
              <span className="hidden lg:inline">Add Assignment</span>
            </Button>
          </div>
        </div>
        <TabsContent
          value="outline"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>
                    <div className="flex items-center justify-center">
                      <Skeleton className="size-4" />
                    </div>
                  </TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned User</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                <TableSkeleton />
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Assignments</SelectItem>
            <SelectItem value="past-performance">Photo Tasks</SelectItem>
            <SelectItem value="key-personnel">Location Tasks</SelectItem>
            <SelectItem value="focus-documents">Challenges</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Assignments</TabsTrigger>
          <TabsTrigger value="past-performance">
            Photo Tasks <Badge variant="secondary">8</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Location Tasks <Badge variant="secondary">5</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Challenges</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Assignment</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: Assignment }) {
  const [articleDetails, setArticleDetails] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const fetchArticleDetails = async () => {
    if (articleDetails) return
    
    try {
      setLoading(true)
      const article = await getArticle(item.id)
      if (article) {
        setArticleDetails(article)
      }
    } catch (error) {
      console.error('Error fetching article details:', error)
      toast.error(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'news': return 'default'
      case 'hint': return 'secondary' 
      case 'opdracht': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Done': return 'default'
      case 'In Progress': return 'secondary'
      case 'Not Started': return 'outline'
      default: return 'outline'
    }
  }

function ArticleContent({ htmlContent }: { htmlContent: string }) {
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!contentRef.current || !htmlContent) return

    const processImages = () => {
      const images = contentRef.current!.querySelectorAll('img')
      
      images.forEach((img) => {
        const wrapper = document.createElement('div')
        wrapper.className = 'relative inline-block group'
        
        const newImg = document.createElement('img')
        newImg.src = img.src
        newImg.alt = img.alt || ''
        newImg.className = 'max-w-xs h-auto rounded-lg shadow-md cursor-default pointer-events-none'
        
        const buttonsContainer = document.createElement('div')
        buttonsContainer.className = 'absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex gap-2 pointer-events-auto z-10'
        
        // Add event listeners to the wrapper to prevent all clicks
        wrapper.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
        })
        
        wrapper.addEventListener('contextmenu', (e) => {
          e.preventDefault()
        })
        
        const copyButtonContainer = document.createElement('div')
        const downloadButtonContainer = document.createElement('div')
        const openButtonContainer = document.createElement('div')
        
        // Ensure button containers don't propagate clicks
        copyButtonContainer.className = 'pointer-events-auto'
        downloadButtonContainer.className = 'pointer-events-auto'
        openButtonContainer.className = 'pointer-events-auto'
        
        buttonsContainer.appendChild(copyButtonContainer)
        buttonsContainer.appendChild(downloadButtonContainer)
        buttonsContainer.appendChild(openButtonContainer)
        wrapper.appendChild(newImg)
        wrapper.appendChild(buttonsContainer)
        
        if (img.parentNode) {
          img.parentNode.replaceChild(wrapper, img)
        }

        // Mount React components
        import('react-dom/client').then(({ createRoot }) => {
          const copyRoot = createRoot(copyButtonContainer)
          const downloadRoot = createRoot(downloadButtonContainer)
          const openRoot = createRoot(openButtonContainer)
          
          copyRoot.render(
            React.createElement(CopyButton, {
              content: img.src,
              variant: 'secondary',
              size: 'default',
              className: 'shadow-lg pointer-events-auto',
              onCopy: () => toast.success('Image URL copied to clipboard')
            })
          )
          
          downloadRoot.render(
            React.createElement(DownloadButton, {
              url: img.src,
              variant: 'secondary',
              size: 'default',
              className: 'shadow-lg pointer-events-auto',
              onDownload: () => toast.success('Image download started')
            })
          )
          
          openRoot.render(
            React.createElement(OpenButton, {
              url: img.src,
              variant: 'outline',
              size: 'default',
              className: 'shadow-lg pointer-events-auto',
              onOpen: () => toast.success('Image opened in new tab')
            })
          )
        })
      })
    }

    const timer = setTimeout(processImages, 100)
    return () => clearTimeout(timer)
  }, [htmlContent])

  return (
    <div 
      ref={contentRef}
      className="article-content prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-muted prose-pre:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-hr:border-border"
      dangerouslySetInnerHTML={{ 
        __html: htmlContent 
      }}
    />
  )
}

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="link" 
          className="text-foreground w-fit px-0 text-left justify-start h-auto"
          onClick={fetchArticleDetails}
        >
          {item.title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col sm:max-w-[1400px] p-0 gap-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={getTypeBadgeVariant(item.type)} className="font-medium">
                {item.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                #{item.id}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Published {formatDate(item.publish_at)}
              </span>
            </div>
            <div>
              <DialogTitle className="text-left text-2xl font-bold leading-tight">
                {item.title}
              </DialogTitle>
              <DialogDescription className="text-left mt-2">
                JotiHunt Article Details and Assignment Information
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="flex flex-col items-center gap-3">
                <IconLoader className="animate-spin size-8" />
                <span className="text-lg">Loading article content...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-shrink-0 p-6 pb-4 border-b bg-muted/30">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant={getStatusBadgeVariant(item.status || 'Not Started')}>
                      {item.status === 'Done' && <IconCircleCheckFilled className="size-3 mr-1" />}
                      {item.status || 'Not Started'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Assigned to:</span>
                    {item.reviewer ? (
                      <Badge variant="secondary" className="font-medium">
                        {item.reviewer}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Unassigned
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Type:</span>
                    <Badge variant={getTypeBadgeVariant(item.type)} className="capitalize">
                      {item.type}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-none">
                  <div className="flex items-center gap-2 mb-6">
                    <h3 className="text-xl font-semibold">Article Content</h3>
                    <Separator orientation="horizontal" className="flex-1" />
                  </div>
                  
                  {articleDetails?.message?.content ? (
                    <ArticleContent htmlContent={articleDetails.message.content} />
                  ) : (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                      <div className="text-center">
                        <IconLoader className="animate-spin size-8 mx-auto mb-4" />
                        <p className="text-lg">Loading article content...</p>
                        <p className="text-sm mt-2">Fetching latest content from JotiHunt API</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
