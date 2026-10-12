import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import { HiOutlineSearch } from 'react-icons/hi'
import { usePOSStore } from '../store/usePOSStore'

const SearchBar = () => {
    const searchTerm = usePOSStore((s) => s.searchTerm)
    const setSearchTerm = usePOSStore((s) => s.setSearchTerm)
    const [localTerm, setLocalTerm] = useState(searchTerm)

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(localTerm)
        }, 300)
        return () => clearTimeout(timer)
    }, [localTerm, setSearchTerm])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalTerm(searchTerm)
    }, [searchTerm])

    return (
        <div className="mb-3">
            <Input
                type="search"
                aria-label="Buscar productos"
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={localTerm}
                prefix={<HiOutlineSearch className="text-lg" />}
                onChange={(e) => setLocalTerm(e.target.value)}
            />
        </div>
    )
}

export default SearchBar
