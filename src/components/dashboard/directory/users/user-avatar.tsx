import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { getInitials } from "@/lib/directory/student-format"

type UserAvatarProps = {
  name: string
  photoUrl: string | null
  /** Titik hijau di pojok hanya untuk akun aktif yang sedang online. */
  showOnlineDot: boolean
}

/** Avatar akun: foto atau inisial, dengan titik online di pojok kanan bawah. */
export function UserAvatar({ name, photoUrl, showOnlineDot }: UserAvatarProps) {
  return (
    <div className="relative">
      <Avatar>
        {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      {showOnlineDot ? (
        <span
          aria-hidden="true"
          data-testid="online-dot"
          className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500"
        />
      ) : null}
    </div>
  )
}