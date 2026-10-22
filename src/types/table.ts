import type { ReactNode } from "react"

/**
 * Definisi satu kolom RecordTable.
 *
 * Murni deklaratif: kolom hanya menjelaskan cara menampilkan sel.
 * Pencarian ditentukan terpisah lewat `searchText` pada RecordTable.
 */
export type RecordColumn<T> = {
  /** Identitas kolom (dipakai sebagai key). */
  id: string
  /** Isi header kolom. Gunakan null untuk kolom tanpa judul. */
  header: ReactNode
  /** Isi sel untuk satu baris. */
  cell: (row: T) => ReactNode
  /** Kelas tambahan untuk header dan sel (lebar, rata tengah). */
  className?: string
}