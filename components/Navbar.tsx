'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Session } from '@supabase/supabase-js';
import { Menu, X, Sun, Moon, Settings, Flag, LogOut, User as UserIcon } from 'lucide-react';
import appIcon from '@/app/icon.png';

interface NavbarProps {
    session: Session | null;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    onOpenSettings?: () => void;
    onOpenReport?: () => void;
    onOpenLogin?: () => void;
    onLogout?: () => void;
}

export default function Navbar({
    session,
    isDarkMode,
    toggleDarkMode,
    onOpenSettings,
    onOpenReport,
    onOpenLogin,
    onLogout,
}: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const navLinks = [
        { href: '/plan', label: 'Plan' },
        { href: '/friends', label: 'Friends' },
        { href: '/groups', label: 'Groups' },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo & Desktop Nav */}
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
                            <Image
                                src={appIcon}
                                alt="Pomofomo"
                                width={32}
                                height={32}
                                className="rounded-lg"
                            />
                            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                                Pomofomo
                            </span>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex ml-10 space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right Side Icons (Desktop) */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Toggle Dark Mode"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {onOpenReport && (
                            <button
                                onClick={onOpenReport}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors"
                                aria-label="Report"
                            >
                                <Flag className="w-5 h-5" />
                            </button>
                        )}

                        {onOpenSettings && (
                            <button
                                onClick={onOpenSettings}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors"
                                aria-label="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        )}

                        {session ? (
                            <div className="relative ml-3">
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <Image
                                        src={
                                            session.user.user_metadata.avatar_url ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                session.user.email?.split('@')[0] || 'User'
                                            )}&background=random&color=fff`
                                        }
                                        alt="User"
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                                    />
                                </button>

                                {isProfileMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10 cursor-default"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        ></div>
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                                            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700 mb-1">
                                                {session.user.email}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false);
                                                    onLogout?.();
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign out
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={onOpenLogin}
                                className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                Sign In
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 animate-fade-in">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-800 block px-3 py-2 rounded-md text-base font-medium"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="pt-4 pb-4 border-t border-gray-200 dark:border-slate-800">
                        <div className="flex items-center px-5 mb-3">
                            {session ? (
                                <div className="flex-shrink-0">
                                    <Image
                                        src={
                                            session.user.user_metadata.avatar_url ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                session.user.email?.split('@')[0] || 'User'
                                            )}&background=random&color=fff`
                                        }
                                        alt="User"
                                        width={40}
                                        height={40}
                                        className="h-10 w-10 rounded-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                </div>
                            )}
                            <div className="ml-3">
                                <div className="text-base font-medium leading-none text-gray-800 dark:text-white">
                                    {session ? session.user.email?.split('@')[0] : 'Guest'}
                                </div>
                                <div className="text-sm font-medium leading-none text-gray-500 dark:text-gray-400 mt-1">
                                    {session ? session.user.email : 'Please sign in'}
                                </div>
                            </div>
                        </div>

                        <div className="px-2 space-y-1">
                            <button
                                onClick={toggleDarkMode}
                                className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-800"
                            >
                                {isDarkMode ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
                                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                            </button>

                            {onOpenSettings && (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onOpenSettings();
                                    }}
                                    className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-800"
                                >
                                    <Settings className="w-5 h-5 mr-3" />
                                    Settings
                                </button>
                            )}

                            {onOpenReport && (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onOpenReport();
                                    }}
                                    className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-800"
                                >
                                    <Flag className="w-5 h-5 mr-3" />
                                    Report Issue
                                </button>
                            )}

                            {session ? (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onLogout?.();
                                    }}
                                    className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <LogOut className="w-5 h-5 mr-3" />
                                    Sign out
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onOpenLogin?.();
                                    }}
                                    className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                                >
                                    <UserIcon className="w-5 h-5 mr-3" />
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
