/**
 * Memicu unduhan berkas di browser dari sebuah Blob.
 *
 * Hanya untuk dipanggil dari event handler di client (butuh `document`).
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  // Beri browser kesempatan memulai unduhan sebelum alamat dilepas.
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}