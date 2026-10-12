import Input from '@/components/ui/Input'
import { HiOutlineSearch } from 'react-icons/hi'

interface ListSearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder: string
}

/** Text box that filters a paginated list on the server (`?search=`) */
const ListSearchInput = ({
    value,
    onChange,
    placeholder,
}: ListSearchInputProps) => (
    <Input
        type="search"
        size="sm"
        className="w-full sm:w-80"
        aria-label={placeholder}
        prefix={<HiOutlineSearch className="text-lg" />}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
    />
)

export default ListSearchInput
