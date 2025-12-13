import { CUSTOMER_SUPPORT_MENU_ITEMS } from '../../../../../services/constants';
import EmployeesSideBar from '../EmployeesSideBar';
import routes from '../../../../../config/routes';

const roleDisplay = (rawRole) => {
    return rawRole === 'CUSTOMER_SUPPORT' ? 'Chăm sóc khách hàng' : 'CSKH';
};

export default function CustomerSupportSideBar() {
    return (
        <EmployeesSideBar
            title="Customer Support Panel"
            subtitle="Management System"
            homePath={routes.customerSupportHome}
            menuItems={CUSTOMER_SUPPORT_MENU_ITEMS}
            roleDisplay={roleDisplay}
        />
    );
}
