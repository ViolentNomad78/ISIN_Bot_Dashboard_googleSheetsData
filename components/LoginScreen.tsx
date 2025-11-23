import React from 'react';
import { Icons } from '../Icons';
import { Logo } from './Logo';

export const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                <div className="flex justify-center mb-6">
                    <Logo className="h-20 w-auto" />
                </div>
                <h1 className="text-xl font-bold text-[#9F8A79] mb-2 font-serif tracking-wide">MONOPOLI.MEIER & SON'S.</h1>
                <p className="text-gray-500 mb-8 text-sm">Sign in to access the Dashboard</p>
                
                <button 
                    onClick={onLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-full transition-all duration-200 shadow-sm"
                >
                    <Icons.Google />
                    <span>Sign in with Google</span>
                </button>
                
                <div className="mt-8 text-xs text-gray-400">
                    Protected by MMS Security Systems
                </div>
            </div>
        </div>
    );
};
