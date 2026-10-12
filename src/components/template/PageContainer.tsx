import classNames from 'classnames'
import {
    PAGE_CONTAINER_GUTTER_X,
    PAGE_CONTAINER_GUTTER_Y,
} from '@/constants/theme.constant'
import type { CommonProps } from '@/@types/common'

/** Área de contenido de cada página: márgenes y ancho máximo comunes. */
const PageContainer = ({ children }: CommonProps) => (
    <main
        className={classNames(
            'page-container relative mx-auto flex w-full max-w-[1600px] flex-auto flex-col',
            PAGE_CONTAINER_GUTTER_X,
            PAGE_CONTAINER_GUTTER_Y
        )}
    >
        {children}
    </main>
)

export default PageContainer
