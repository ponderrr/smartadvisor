import React from 'react';
import FloatingShapes from './FloatingShapes';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <>
            <FloatingShapes />
            {children}
        </>
    );
};

export default Layout;