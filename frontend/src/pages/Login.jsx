import { useState } from "react";
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom";
import { PenTool, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {

    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    //Fucntion to handle the submit after login
    const handleSubmit = async (event) => {
        event.preventDefault();

        const result = await login(formData);

        if (result && result.success) {
            toast.success("Login Successful !", {
                duration: 4000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            })
            navigate("/editor/home");
        } else {
            toast.error(result?.message || "Login Failed", {
                duration: 4000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            })
        }
    }


    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
           
            <div className="flex items-center gap-2 mb-8 text-indigo-600">
                <PenTool className="w-8 h-8" />
                <span className="text-2xl font-bold tracking-tight text-slate-900">CollabDocs</span>
            </div>

            {/* Login Card */}
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-8 lg:p-10">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
                    <p className="text-slate-500 mt-2 text-sm">Enter your details to access your workspace.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Forgot?</a>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group mt-2"
                    >
                        Sign In
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                {/* REDIRECT FIELD */}
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500">
                        New to CollabDocs?{' '}
                        <a href="/signup" className="text-indigo-600 font-semibold hover:underline">Create an account</a>
                    </p>
                </div>
            </div>

            <p className="mt-8 text-xs text-slate-400 uppercase tracking-widest font-medium">Trusted by 10,000+ teams</p>
        </div>

    );
}