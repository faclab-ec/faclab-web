import axios from 'axios'
import { isApiError } from '@/utils/errors/ApiError'

export function getErrorMessage(error: unknown, fallback: string): string {
    // httpClient rechaza siempre con ApiError (primer error del envelope)
    if (isApiError(error)) {
        return error.message || fallback
    }
    if (axios.isAxiosError(error)) {
        const data = error.response?.data
        if (data?.errors?.length > 0) {
            return data.errors[0].message || fallback
        }
        return data?.detail || data?.message || error.message || fallback
    }
    if (error instanceof Error) {
        return error.message || fallback
    }
    return fallback
}
