"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePathname } from "next/navigation";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAllLogic, setIsAllLogic] = useState(false);

  useEffect(() => {
    const allLogic = window.location.hostname === "hub.alllogiconline.com.br";
    document.body.classList.toggle("agillex-theme", !allLogic);
    setIsAllLogic(allLogic);
  }, []);

  const isCheckout = pathname.startsWith("/checkout");
  const showBrandLayout = !isAllLogic && !isCheckout;

  return (
    <>
      {showBrandLayout && <Header />}
      <main
        style={{
          minHeight: "100vh",
          paddingTop: showBrandLayout ? "64px" : "0",
        }}
      >
        {children}
      </main>
      {showBrandLayout && <Footer />}
    </>
  );
}
