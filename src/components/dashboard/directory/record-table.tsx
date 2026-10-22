"use client"

import type { ReactNode } from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CircleAlertIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRecordTable } from "@/hooks/desktop/directory/records/use-record-table"
import { cn } from "@/lib/utils"
import type { RecordColumn } from "@/types/table"

type RecordTableProps<T> = {
  title: string
  description: string
  rows: readonly T[]
  columns: readonly RecordColumn<T>[]
  getRowKey: (row: T) => string
  /** Teks yang dicari kotak pencarian untuk satu baris. Harus stabil. */
  searchText: (row: T) => string
  searchPlaceholder?: string
  isLoading: boolean
  errorMessage: string | null
  onRetry: () => void
  emptyMessage?: string
  /** Slot tombol aksi (mis. "Tambah Kelas") di sisi kanan header. */
  actions?: ReactNode
  pageSize?: number
}

const SKELETON_ROWS = 5

/**
 * Tabel generik Directory: header, pencarian, tabel, dan halaman.
 *
 * Komponen ini hanya menampilkan. Data, izin, dan aksi datang dari
 * halaman lewat props; tombol aksi disisipkan lewat slot `actions`
 * sehingga tabel tidak perlu tahu soal hak akses.
 */
export function RecordTable<T>({
  title,
  description,
  rows,
  columns,
  getRowKey,
  searchText,
  searchPlaceholder = "Cari...",
  isLoading,
  errorMessage,
  onRetry,
  emptyMessage = "Belum ada data.",
  actions,
  pageSize,
}: RecordTableProps<T>) {
  const table = useRecordTable(rows, { searchText, pageSize })

  const showPager = !isLoading && !errorMessage && table.totalRows > 0

  return (
    <section className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-[13px] text-muted-foreground">{description}</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2.5 md:w-auto">
            <div className="relative w-full sm:w-60">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Cari"
                placeholder={searchPlaceholder}
                value={table.query}
                onChange={(event) => table.setQuery(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="pr-8 pl-8"
              />
              {table.query !== "" && (
                <button
                  type="button"
                  aria-label="Hapus pencarian"
                  onClick={() => table.setQuery("")}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

            {actions}
          </div>
        </div>

        <div className="h-px w-full bg-linear-to-r from-border via-border/50 to-transparent" />
      </header>

      <div className="overflow-hidden rounded-xl border bg-card/40">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    "px-4 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase",
                    column.className,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <TableRow key={index} className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableCell key={column.id} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : errorMessage ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-48 px-4">
                  <div
                    role="alert"
                    className="flex flex-col items-center justify-center gap-3 text-center"
                  >
                    <CircleAlertIcon className="size-6 text-destructive" />
                    <p className="text-sm whitespace-normal text-muted-foreground">
                      {errorMessage}
                    </p>
                    <Button variant="outline" size="sm" onClick={onRetry}>
                      Coba lagi
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.totalRows === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-48 px-4 text-center text-sm text-muted-foreground"
                >
                  {table.isFiltered
                    ? `Tidak ada hasil untuk "${table.query.trim()}".`
                    : emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.pageRows.map((row) => (
                <TableRow key={getRowKey(row)}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn("px-4 py-3", column.className)}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showPager && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Menampilkan {table.firstItem}-{table.lastItem} dari{" "}
            {table.totalRows}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Halaman pertama"
              disabled={table.page <= 1}
              onClick={() => table.goToPage(1)}
            >
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Halaman sebelumnya"
              disabled={table.page <= 1}
              onClick={() => table.goToPage(table.page - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-28 px-2 text-center text-xs text-muted-foreground">
              Halaman {table.page} dari {table.pageCount}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Halaman berikutnya"
              disabled={table.page >= table.pageCount}
              onClick={() => table.goToPage(table.page + 1)}
            >
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Halaman terakhir"
              disabled={table.page >= table.pageCount}
              onClick={() => table.goToPage(table.pageCount)}
            >
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}