import React, { useState, Fragment, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaHome, FaList } from 'react-icons/fa';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ConfirmationModal';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const navRef = React.useRef(null);

    const navLinks = useMemo(() => {
        if (!user) return [];
        return [
            { name: 'Home', path: '/', icon: <FaHome size={18} /> },
            { name: 'Tasks', path: '/tasks', icon: <FaList size={18} /> },
        ];
    }, [user]);

    const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);
    const closeMenu = useCallback(() => setIsOpen(false), []);

    const userInitials = useMemo(() =>
        user?.name ? user.name.charAt(0).toUpperCase() : 'U',
        [user?.name]);

    // The path !== '/' guard prevents the startsWith check from making the
    // Home link appear active on every route
    const getLinkStyle = (path, isMobile = false) => {
        const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
        if (isMobile) {
            return isActive
                ? 'border-blue-500 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-600 hover:bg-gray-50';
        }
        return isActive
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300';
    };

    return (
        <nav ref={navRef} className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-30 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600 tracking-tight">
                                <img src="/logo-57.png" alt="Task Manager Logo" className="h-9 w-9" />
                                <span>TaskManager</span>
                            </Link>
                        </div>
                        <div className="hidden md:ml-8 md:flex md:space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`inline-flex items-center px-1 pt-1 text-sm font-semibold border-b-2 transition duration-200 ${getLinkStyle(link.path)}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <Menu as="div" className="relative hidden md:block">
                                <Menu.Button className="flex items-center space-x-2 focus:outline-none p-1 rounded-full hover:bg-blue-50/50 cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-300 group">
                                    <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center shadow-sm ring-2 ring-white group-hover:scale-105 group-hover:shadow-md group-hover:ring-blue-100 transition-all duration-300">
                                        {user?.hasProfilePic ? (
                                            // ?t= is a cache-buster timestamp written by updateUser() in AuthContext after upload
                                            <img
                                                src={`${import.meta.env.VITE_API_URL || '/api'}/users/${user.id}/profile-pic?t=${user._picTs || ''}`}
                                                alt={user.name}
                                                width="36"
                                                height="36"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                                {userInitials}
                                            </div>
                                        )}
                                    </div>
                                    <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                                </Menu.Button>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                >
                                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-2xl shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden">
                                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link to="/profile" className={`flex items-center px-4 py-2.5 text-sm font-medium ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                                                        <FaUser className="mr-3 text-gray-400" size={14} /> My Profile
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button onClick={() => setShowLogoutConfirm(true)} className={`flex w-full items-center px-4 py-2.5 text-sm font-medium cursor-pointer hover:opacity-90 ${active ? 'bg-red-50 text-red-700' : 'text-gray-700'}`}>
                                                        <FaSignOutAlt className="mr-3 text-gray-400" size={14} /> Logout
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        ) : (
                            <Link to="/login" className="hidden md:block text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors">
                                Sign In
                            </Link>
                        )}

                        <button onClick={toggleMenu} className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer hover:opacity-90 focus:outline-none transition-colors">
                            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            <Transition
                show={isOpen}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-2"
            >
                <div className="md:hidden bg-white border-b border-gray-100 shadow-xl overflow-hidden">
                    <div className="px-4 py-6 space-y-4">
                        {user && (
                            <div className="flex items-center gap-4 mb-6 p-2 bg-gray-50 rounded-2xl">
                                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden">
                                    {user?.hasProfilePic ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL || '/api'}/users/${user.id}/profile-pic?t=${user._picTs || ''}`}
                                            alt={user.name}
                                            width="48"
                                            height="48"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        userInitials
                                    )}
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center pl-4 pr-4 py-3 border-l-4 text-base font-bold transition-all rounded-r-xl ${getLinkStyle(link.path, true)}`}
                                    onClick={closeMenu}
                                >
                                    <span className="mr-3 opacity-70">{link.icon}</span>
                                    {link.name}
                                </Link>
                            ))}
                            {user && (
                                <Link
                                    to="/profile"
                                    className={`flex items-center pl-4 pr-4 py-3 border-l-4 text-base font-bold rounded-r-xl transition-all ${getLinkStyle('/profile', true)}`}
                                    onClick={closeMenu}
                                >
                                    <FaUser className="mr-3 opacity-70" size={18} /> Profile
                                </Link>
                            )}
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                            {user ? (
                                <button onClick={() => { setShowLogoutConfirm(true); closeMenu(); }} className="flex w-full items-center px-4 py-3 text-base font-bold text-red-600 hover:bg-red-50 cursor-pointer hover:opacity-90 active:scale-95 rounded-2xl transition-all">
                                    <FaSignOutAlt className="mr-3" size={18} /> Logout
                                </button>
                            ) : (
                                <Link to="/login" className="flex w-full justify-center py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg" onClick={closeMenu}>
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </Transition>

            <ConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                title="Sign Out"
                message="Are you sure you want to log out? Your session will be ended."
                confirmText="Logout"
                onConfirm={() => {
                    logout();
                    setShowLogoutConfirm(false);
                }}
            />
        </nav>
    );
};

export default Navbar;