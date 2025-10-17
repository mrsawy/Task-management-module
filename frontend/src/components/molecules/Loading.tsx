"use client"

import { useSelector } from "react-redux";
import { type RootState } from '@/store/store';
import { Loader2 } from "lucide-react";



export default function Loading() {
    const { generalIsLoading } = useSelector((s: RootState) => s.general)
    return (
        generalIsLoading ?
            <div className="fixed top-0 left-0 w-full flex justify-center items-center h-full  bg-black/80 z-[999999]">
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className=" size-6 animate-spin border-black text-black dark:border-white dark:text-white" /> 
                </div>
            </div> : <></>
    );
};
