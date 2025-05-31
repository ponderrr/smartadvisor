import React from 'react';

const FloatingShapes: React.FC = () => {
    return (
        <div className="floating-background">
            <div className="floating-shapes">
                <div
                    className="shape"
                    style={{
                        top: "10%",
                        left: "10%",
                        width: "100px",
                        height: "100px",
                        animationDelay: "0s",
                    }}
                ></div>
                <div
                    className="shape"
                    style={{
                        top: "20%",
                        right: "15%",
                        width: "80px",
                        height: "80px",
                        animationDelay: "5s",
                    }}
                ></div>
                <div
                    className="shape"
                    style={{
                        bottom: "30%",
                        left: "20%",
                        width: "60px",
                        height: "60px",
                        animationDelay: "10s",
                    }}
                ></div>
                <div
                    className="shape"
                    style={{
                        bottom: "10%",
                        right: "10%",
                        width: "120px",
                        height: "120px",
                        animationDelay: "15s",
                    }}
                ></div>
                <div
                    className="shape"
                    style={{
                        top: "50%",
                        left: "5%",
                        width: "70px",
                        height: "70px",
                        animationDelay: "20s",
                    }}
                ></div>
                <div
                    className="shape"
                    style={{
                        top: "60%",
                        right: "25%",
                        width: "90px",
                        height: "90px",
                        animationDelay: "25s",
                    }}
                ></div>
            </div>
        </div>
    );
};

export default FloatingShapes;