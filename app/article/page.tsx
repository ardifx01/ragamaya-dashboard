import React from 'react';
import Sidebar from "@/components/ui/sidebar/Sidebar";
import TableArticle from "@/components/article/TableArticle";

const Article = () => {
    return (
        <Sidebar activeLink="Artikel">
            <TableArticle />
        </Sidebar>
    );
};

export default Article;