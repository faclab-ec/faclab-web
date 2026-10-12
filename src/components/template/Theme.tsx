import ConfigProvider from '@/components/ui/ConfigProvider'
import useDarkMode from '@/utils/hooks/useDarkmode'
import appConfig from '@/configs/app.config'
import type { CommonProps } from '@/@types/common'
import { themeConfig } from '@/configs/theme.config'
import { useThemeStore } from '@/stores'

const Theme = (props: CommonProps) => {
    const mode = useThemeStore((state) => state.mode)
    useDarkMode()

    return (
        <ConfigProvider
            value={{ ...themeConfig, mode, locale: appConfig.locale }}
        >
            {props.children}
        </ConfigProvider>
    )
}

export default Theme
