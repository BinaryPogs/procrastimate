import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export type SearchFilter = 'all' | 'name' | 'email'

interface FriendSearchFiltersProps {
  currentFilter: SearchFilter
  onFilterChange: (filter: SearchFilter) => void
}

export default function FriendSearchFilters({ currentFilter, onFilterChange }: FriendSearchFiltersProps) {
  return (
    <RadioGroup
      value={currentFilter}
      onValueChange={(value: string) => onFilterChange(value as SearchFilter)}
      className="flex space-x-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="all" id="all" />
        <Label htmlFor="all">All</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="name" id="name" />
        <Label htmlFor="name">Name</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="email" id="email" />
        <Label htmlFor="email">Email</Label>
      </div>
    </RadioGroup>
  )
} 