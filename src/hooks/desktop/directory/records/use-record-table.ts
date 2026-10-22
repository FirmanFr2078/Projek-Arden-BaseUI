"use client"

import { useCallback, useMemo, useState } from "react"

type UseRecordTableOptions<T> = {
  /**
   * Teks yang dicari kotak pencarian untuk satu baris.
   * Definisikan di luar komponen (atau useCallback) agar stabil.
   */
  searchText: (row: T) => string
  /** Jumlah baris per halaman. Default 10. */
  pageSize?: number
}

/**
 * Pencarian dan halaman untuk tabel Directory.
 *
 * Seluruh data sudah ada di browser (skala sekolah), jadi pencarian dan
 * pembagian halaman dilakukan di sisi client.
 *
 * Nomor halaman dihitung (diturunkan), bukan disinkronkan lewat efek:
 * bila data berkurang (mis. setelah hapus) halaman otomatis tidak
 * melewati halaman terakhir.
 */
export function useRecordTable<T>(
  rows: readonly T[],
  { searchText, pageSize = 10 }: UseRecordTableOptions<T>,
) {
  const [query, setQueryState] = useState("")
  const [requestedPage, setRequestedPage] = useState(1)

  const normalizedQuery = query.trim().toLowerCase()

  const filteredRows = useMemo(
    () =>
      normalizedQuery === ""
        ? rows
        : rows.filter((row) =>
            searchText(row).toLowerCase().includes(normalizedQuery),
          ),
    [rows, normalizedQuery, searchText],
  )

  const totalRows = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize))
  const page = Math.min(requestedPage, pageCount)
  const startIndex = (page - 1) * pageSize

  const pageRows = useMemo(
    () => filteredRows.slice(startIndex, startIndex + pageSize),
    [filteredRows, startIndex, pageSize],
  )

  /** Mengubah kata kunci selalu kembali ke halaman pertama. */
  const setQuery = useCallback((value: string) => {
    setQueryState(value)
    setRequestedPage(1)
  }, [])

  const goToPage = useCallback(
    (next: number) => setRequestedPage(Math.min(Math.max(1, next), pageCount)),
    [pageCount],
  )

  return {
    query,
    setQuery,
    isFiltered: normalizedQuery !== "",
    pageRows,
    totalRows,
    page,
    pageCount,
    /** Nomor baris pertama dan terakhir di halaman ini (untuk "1-10 dari 25"). */
    firstItem: totalRows === 0 ? 0 : startIndex + 1,
    lastItem: Math.min(startIndex + pageSize, totalRows),
    goToPage,
  }
}