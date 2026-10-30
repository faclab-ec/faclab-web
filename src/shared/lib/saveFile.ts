/** Hace que el navegador guarde `blob` con el nombre `fileName` */
export function saveFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Después del clic: el navegador ya tomó el archivo
    setTimeout(() => URL.revokeObjectURL(url), 0)
}
