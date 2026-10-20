import Image from "next/image"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      {/* Memanggil icon dari folder public */}
      <div className="relative size-8"> 
        <Image 
          src="/icon.ico"   // <--- Perhatikan ini, langsung slash nama file
          alt="Arden Logo"
          fill              // Agar gambar mengikuti ukuran parent (div size-8)
          sizes="32px"
          className="object-contain" // Agar gambar tidak gepeng
          priority          // Agar logo di-load duluan (karena di atas layar)
        />
      </div>
      
      {/* Teks Logo */}
      <span className="font-bold text-xl text-gray-200 tracking-tight">
        ARDEN
      </span>
    </Link>
  )
}