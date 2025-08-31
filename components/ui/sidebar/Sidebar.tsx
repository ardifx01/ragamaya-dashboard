"use client";
import React, { useState } from "react";
import {
    IconDashboard,
    IconWallet
} from "@tabler/icons-react";
import SidebarContent from "@/components/ui/sidebar/SidebarContent";

interface SidebarProps {
    activeLink: string;
    children: React.ReactNode;
}

export default function Sidebar(props: SidebarProps) {
    const [open, setOpen] = useState(false);

    const links = [
        {
            label: "Dashboard",
            href: "/", // Update to the actual route
            icon: <IconDashboard className="h-5 w-5 shrink-0 text-gray-300" />,
        },
        {
            label: "Pengajuan Tarik Tunai",
            href: "/withdraw", // Update to the actual route
            icon: <IconWallet className="h-5 w-5 shrink-0 text-gray-300" />,
        },
    ];

    return (
        <div className="px-0 flex min-h-screen flex-1 flex-col overflow-hidden border border-gray-800 md:flex-row bg-black h-screen">
            <SidebarContent open={open} setOpen={setOpen} activeLink={props.activeLink} links={links} />

            {/* Main Content Area */}
            <div className="flex flex-1">
                <div className="flex h-full w-full flex-1 flex-col border border-gray-800 bg-black">
                    {/* Content Header */}
                    <div className="border-b border-gray-800 p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-white">
                                    {props.activeLink}
                                </h2>
                                <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                                    {new Date().toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Content Placeholder */}
                    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                        <div className="h-full">
                            {/* Content will be rendered based on the route in the corresponding page.tsx */}
                            {props.children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}