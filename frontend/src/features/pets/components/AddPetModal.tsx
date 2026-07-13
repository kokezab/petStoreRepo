import { useModalStore } from "@/stores/useModalStore";
import { Modal } from "antd";

export function AddPetModal() {
    const isOpen = useModalStore((state) => state.isOpen);
    
    return <Modal open={isOpen} title="Add pet">Add pet</Modal>;
}