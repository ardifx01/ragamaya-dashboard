import React from 'react';
import Sidebar from "@/components/ui/sidebar/Sidebar";
import TableQuiz from "@/components/quiz/TableQuiz";

const Article = () => {
    return (
        <Sidebar activeLink="Kuis">
            <TableQuiz />
        </Sidebar>
    );
};

export default Article;