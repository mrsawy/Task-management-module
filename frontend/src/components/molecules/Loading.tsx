import { useSelector } from "react-redux";
import { type RootState } from '@/store/store';



export default function Loading() {
    const { generalIsLoading } = useSelector((s: RootState) => s.general)
    return (
        generalIsLoading ?
            <div className="fixed top-0 left-0 w-full flex justify-center items-center h-full  bg-black/80 z-[999999]">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
            </div> : <></>
    );
};
