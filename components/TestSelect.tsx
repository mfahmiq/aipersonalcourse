"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export default function TestSelect() {
  const [value, setValue] = useState("")

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Test Select Component</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">Tingkat Kesulitan</label>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih tingkat kesulitan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pemula">Pemula</SelectItem>
            <SelectItem value="Menengah">Menengah</SelectItem>
            <SelectItem value="Lanjutan">Lanjutan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <p>Selected value: <strong>{value || "None"}</strong></p>
      </div>

      <Button onClick={() => setValue("")}>Reset</Button>
    </div>
  )
}
