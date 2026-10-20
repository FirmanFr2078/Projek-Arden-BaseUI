"use client"

import { Link2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type ConnectionsButtonProps = {
  disabled?: boolean
}

export function ConnectionsButton({
  disabled = false,
}: ConnectionsButtonProps) {
  const router = useRouter()

  function handleClick() {
    router.push("/connections")
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={handleClick}
      className="w-full"
    >
      <Link2 className="size-4" />
      Connections
    </Button>
  )
}