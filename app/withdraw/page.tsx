import React from 'react';
import Sidebar from "@/components/ui/sidebar/Sidebar";
import TablePayoutRequestsPage from "@/components/withdraw/TablePayoutRequests";

const Withdraw = () => {
    return (
        <Sidebar activeLink="Pengajuan Tarik Tunai">
            <TablePayoutRequestsPage />
        </Sidebar>
    );
};

export default Withdraw;
