import { BiHome, BiPackage } from 'react-icons/bi'
import {
    HiOutlineBell,
    HiOutlineCash,
    HiOutlineChartBar,
    HiOutlineClipboardCheck,
    HiOutlineCollection,
    HiOutlineCube,
    HiOutlineDocumentText,
    HiOutlineFolder,
    HiOutlineLocationMarker,
    HiOutlineLockClosed,
    HiOutlineOfficeBuilding,
    HiOutlineQrcode,
    HiOutlineReceiptRefund,
    HiOutlineReceiptTax,
    HiOutlineScale,
    HiOutlineShoppingCart,
    HiOutlineSwitchHorizontal,
    HiOutlineSwitchVertical,
    HiOutlineTruck,
    HiOutlineUserGroup,
    HiOutlineUsers,
} from 'react-icons/hi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <BiHome />,
    catalogProducts: <BiPackage />,
    catalogCategories: <HiOutlineFolder />,
    inventoryStock: <HiOutlineCube />,
    inventoryMovements: <HiOutlineSwitchHorizontal />,
    catalogUnitsOfMeasure: <HiOutlineScale />,
    inventoryWarehouses: <HiOutlineOfficeBuilding />,
    inventoryLocations: <HiOutlineLocationMarker />,
    salesCustomers: <HiOutlineUserGroup />,
    inventoryLots: <HiOutlineCollection />,
    inventorySerials: <HiOutlineQrcode />,
    purchasesSuppliers: <HiOutlineTruck />,
    purchasesPurchaseOrders: <HiOutlineDocumentText />,
    inventoryAdjustments: <HiOutlineClipboardCheck />,
    inventoryTransfers: <HiOutlineSwitchVertical />,
    inventoryReports: <HiOutlineDocumentText />,
    salesSales: <HiOutlineShoppingCart />,
    salesInvoices: <HiOutlineReceiptTax />,
    posAdminShifts: <HiOutlineCash />,
    posAdminRefunds: <HiOutlineReceiptRefund />,
    posAdminReports: <HiOutlineChartBar />,
    inventoryAlerts: <HiOutlineBell />,
    settingsUsers: <HiOutlineUsers />,
    settingsBranches: <HiOutlineLocationMarker />,
    settingsCompanyConfig: <HiOutlineOfficeBuilding />,
    settingsCertificates: <HiOutlineLockClosed />,
}

export default navigationIcon
