// SidebarLayout.tsx
import React from "react";
import { IconUserBolt } from "@tabler/icons-react";
import { SidebarLayout, SidebarBody, SidebarLink } from "@/components/ui/sidebar/SidebarLayout";
import { cn } from "@/lib/utils";
import {GetUserData} from "@/lib/GetUserData";

interface Link {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface SidebarProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    activeLink: string;
    links: Link[];
}

const SidebarContent: React.FC<SidebarProps> = ({ open, setOpen, activeLink, links }) => {
    const userData = GetUserData();

    return (
        <SidebarLayout open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
                <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
                    <div className="mb-8">
                        <span className="font-bold text-white text-xl">
                            {open ? 'RagaMaya' : 'RM'}
                        </span>
                        {open && (
                            <div className="text-sm text-gray-400 mt-1">
                                Seller Dashboard
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        {links.map((link, idx) => (
                            <div key={idx}>
                                <SidebarLink
                                    link={{
                                        ...link,
                                        href: link.href,
                                    }}
                                    className={cn(
                                        "transition-all duration-200",
                                        activeLink === link.label
                                            ? "bg-blue-600/20 border-r-2 border-blue-500 text-blue-400"
                                            : "hover:bg-gray-800/50"
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Profile Section */}
                <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <IconUserBolt className="h-4 w-4 text-white" />
                        </div>
                        {open && (
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white">{userData.name}</div>
                            </div>
                        )}
                    </div>
                </div>
            </SidebarBody>
        </SidebarLayout>
    );
};

export default SidebarContent;
