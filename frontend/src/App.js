import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { publicRoutes, privateRoutes } from './routes';
import { DefaultLayout } from './layouts';
import PrivateRoute from './routes/PrivateRoute';
import ScrollToTop from './components/ScrollToTop';
import AdminRedirectHandler from './components/AdminRedirectHandler';
import Notification from './components/Common/Notification';

function App() {
    return (
        <Notification>
            <Router>
                <ScrollToTop />
                {/* Tự động redirect ADMIN/STAFF khi đang ở trang chủ */}
                <AdminRedirectHandler />
                <Routes>
                    {publicRoutes.map(({ path, component: Component }) => (
                        <Route
                            key={path}
                            path={path}
                            element={
                                <DefaultLayout>
                                    <Component />
                                </DefaultLayout>
                            }
                        />
                    ))}

                    {privateRoutes.map(({ path, component: Component, layout: LayoutComponent }) => {
                        const Layout = LayoutComponent || DefaultLayout;
                        return (
                            <Route
                                key={path}
                                path={path}
                                element={
                                    <PrivateRoute>
                                        <Layout>
                                            <Component />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                        );
                    })}
                </Routes>
            </Router>
        </Notification>
    );
}

export default App;