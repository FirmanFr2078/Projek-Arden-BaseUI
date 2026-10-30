import type { SheetData } from "write-excel-file/node"

/**
 * Template Excel import siswi. Murni: hanya menyusun isi sheet; pengunduhan
 * dilakukan hook di browser.
 *
 * Sheet "Data Siswi" hanya berisi baris judul (tanpa contoh isi) supaya
 * tidak ada siswi contoh yang ikut terimpor tanpa sengaja. Contoh dan
 * aturan ada di sheet "Petunjuk".
 */

export const TEMPLATE_DATA_SHEET = "Data Siswi"
export const TEMPLATE_GUIDE_SHEET = "Petunjuk"
export const TEMPLATE_FILE_NAME = "ARDEN_Template_Import_Siswi.xlsx"

const header = (title: string) => ({
  value: title,
  type: String,
  fontWeight: "bold" as const,
})

const text = (value: string) => ({ value, type: String })

export type TemplateSheet = {
  sheet: string
  data: SheetData
  columns: { width: number }[]
}

export function buildStudentTemplateSheets(): TemplateSheet[] {
  const dataSheet: SheetData = [
    [header("Nama Lengkap"), header("NIS"), header("Tingkat"), header("Nama Kelas")],
  ]

  const guideSheet: SheetData = [
    [header("Petunjuk Pengisian Import Siswi")],
    [text("")],
    [header("Kolom"), header("Aturan"), header("Contoh")],
    [text("Nama Lengkap"), text("Wajib. Huruf, spasi, titik, koma, apostrof, strip."), text("Siti Aminah")],
    [text("NIS"), text("Wajib. Angka 6 sampai 20 digit. Bila diawali angka 0, format kolom sebagai Teks."), text("1002938101")],
    [text("Tingkat"), text("Wajib. Angka 10, 11, atau 12 (SMP: 7, 8, 9). Boleh X, XI, XII."), text("10")],
    [text("Nama Kelas"), text("Wajib. Sama persis dengan nama kelas di Directory > Classes."), text("MIPA 1")],
    [text("")],
    [text("Tahun ajaran dipilih pada dialog Import, bukan di berkas ini.")],
    [text("Maksimal 500 baris per berkas. Siswi dengan NIS dan nama yang sama dilewati.")],
    [text("Bila ada satu baris bermasalah, tidak ada data yang diimpor dan semua masalah ditampilkan.")],
  ]

  return [
    {
      sheet: TEMPLATE_DATA_SHEET,
      data: dataSheet,
      columns: [{ width: 34 }, { width: 18 }, { width: 10 }, { width: 18 }],
    },
    {
      sheet: TEMPLATE_GUIDE_SHEET,
      data: guideSheet,
      columns: [{ width: 16 }, { width: 80 }, { width: 14 }],
    },
  ]
}