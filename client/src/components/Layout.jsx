import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen min-h-[100dvh] bg-gray-50 font-sans text-gray-900 flex flex-col">
            <Navbar />
            <main className="flex-grow flex flex-col">
                {children || <Outlet />}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
