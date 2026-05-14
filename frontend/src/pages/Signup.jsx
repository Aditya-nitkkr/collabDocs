import { useState } from "react";
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom";
import { PenTool, Users, Zap } from 'lucide-react';
import toast from "react-hot-toast";

export const Signup = () => {

    const { signup } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    })

    //Function to Handle the Sigup after Submit
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Password should be same as the confirm password", {
                duration: 4000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            })
            return;
        }

        const result = await signup(formData);

        if (result && result.success) {
            toast.success("Signup Successful!", {
                duration: 4000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            })
            navigate("/editor/home");
        } else {
            toast.error(result?.message || "Signup Failed", {
                duration: 4000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            })
            navigate("/signup");
        }
    }


    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            {/* Main Card */}
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl flex overflow-hidden border border-slate-200">

                {/* Left Side:*/}
                <div className="hidden md:flex md:w-1/2 bg-indigo-600 p-12 flex-col justify-between text-white">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <PenTool className="w-8 h-8" /> CollabDocs
                        </h1>
                        <p className="mt-4 text-indigo-100 text-lg">
                            Draft, brainstorm, and publish—together in real-time.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-500 p-2 rounded-lg"><Users className="w-5 h-5" /></div>
                            <div>
                                <h3 className="font-semibold">Real-time Collaboration</h3>
                                <p className="text-sm text-indigo-200">See cursors move as your team types.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-500 p-2 rounded-lg"><Zap className="w-5 h-5" /></div>
                            <div>
                                <h3 className="font-semibold">Instant Sync</h3>
                                <p className="text-sm text-indigo-200">Never hit save again. Everything stays in sync.</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-indigo-300">© 2024 CollabDocs Inc. All rights reserved.</p>
                </div>

                {/* Right Side */}
                <div className="w-full md:w-1/2 p-8 lg:p-12">
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800">Create your workspace</h2>
                        <p className="text-slate-500 mt-2">Start collaborating with your team today.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Work Email</label>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] mt-4"
                        >
                            Get Started Free
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-8">
                        Already have an account? <a href="/login" className="text-indigo-600 font-semibold hover:underline">Log in</a>
                    </p>
                </div>
            </div>
        </div>

    );
}