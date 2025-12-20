import { STAFF_MENU_ITEMS } from '../../../../../services/constants';
import EmployeesSideBar from '../EmployeesSideBar';
import routes from '../../../../../config/routes';

const roleDisplay = (rawRole) => {
    return rawRole === 'CUSTOMER_SUPPORT' ? 'Chăm sóc khách hàng' : 'Nhân viên';
};

export default function StaffSideBar() {
    return (
        <EmployeesSideBar
            title="Staff Panel"
            subtitle="Management System"
            homePath={routes.staff}
            menuItems={STAFF_MENU_ITEMS}
            roleDisplay={roleDisplay}
        />
    );
}
