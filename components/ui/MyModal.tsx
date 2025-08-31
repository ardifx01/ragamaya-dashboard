import React from "react";
import {
    Modal,
    ModalContent,
    ModalBody,
    ModalHeader,
} from "@heroui/react";

interface MyModalProps {
    title: string;
    onOpen: () => void;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
    children: React.ReactNode;
}

export default function MyModal(props: MyModalProps) {

    // --- Styling untuk tema hitam ---
    const modalClassNames = {
        backdrop: "bg-black/70 backdrop-blur-sm",
        base: "border-zinc-900 bg-black text-zinc-300",
        header: "border-b border-zinc-900",
        body: "py-6",
        footer: "border-t border-zinc-900",
    };

    return (
        <>
            <Modal scrollBehavior="inside" classNames={modalClassNames} size={props.size} isOpen={props.isOpen} onOpenChange={props.onOpenChange} title={props.title}>
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">{props.title}</ModalHeader>
                    <ModalBody>
                        {props.children}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
