import Side from './Side'
import View from '@app/AppViews'

const AuthLayout = () => {
    return (
        <div className="app-layout-auth flex min-h-screen flex-auto flex-col">
            <Side>
                <View />
            </Side>
        </div>
    )
}

export default AuthLayout
