import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  getKeyValue,
} from '@heroui/react'
import logger from '../utils/logger'
import { ReactNode, useMemo, useState } from 'react'

type TableRowData = {
  key: string
  [key: string]: ReactNode | string
}

interface TableProps {
  tableHeaders: { key: string; label: string }[]
  tableData: TableRowData[]
  pagination?: boolean
  currentPage?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  'aria-label'?: string
  onRowAction?: (key: React.Key) => void
}

export function CustomTable({
  tableHeaders,
  tableData,
  pagination,
  pageSize = 7,
  onPageChange,
  onRowAction,
}: TableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (onPageChange) {
      onPageChange(page)
    }
  }
  logger.debug('Table Headers:', tableHeaders)
  logger.debug('Table Data:', tableData)
  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    const endIdx = startIdx + pageSize
    return pagination ? tableData.slice(startIdx, endIdx) : tableData
  }, [currentPage, pageSize, tableData, pagination])

  return (
    <>
      <Table
        onRowAction={onRowAction}
        bottomContent={
          pagination && (
            <div className='flex w-full justify-center'>
              <Pagination
                isCompact
                showControls
                showShadow
                color='secondary'
                page={currentPage}
                total={Math.ceil(tableData.length / pageSize)}
                onChange={handlePageChange}
              />
            </div>
          )
        }
      >
        <TableHeader columns={tableHeaders}>
          {column => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>
        <TableBody items={paginatedData} emptyContent='No rows to display.'>
          {item => (
            <TableRow key={item.key}>
              {columnKey => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  )
}
