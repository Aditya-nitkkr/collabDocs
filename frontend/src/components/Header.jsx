import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "./Header.css";
import { PenTool, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';

export const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/editor/home');
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    <div className="flex items-center">
                        <Link
                            to="/editor/home"
                            className="flex items-center gap-2 group transition-all"
                        >
                            <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:rotate-3 transition-transform">
                                <PenTool className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">
                                CollabDocs
                            </span>
                        </Link>
                    </div>

                    <nav className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3 md:gap-6">
                                <Link
                                    to="/editor/home"
                                    className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>

                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <UserIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="hidden md:block text-xs font-bold text-slate-700">
                                        {user.name}
                                    </span>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
                                >
                                    <LogOut className="w-4 h-4 cursor-pointer" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all transform active:scale-95"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </nav>

                </div>
            </div>
        </header>
    );
};