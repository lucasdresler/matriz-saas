"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePathname } from "next/navigation";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCheckout = pathname.startsWith("/checkout");

  return (
    <>
      {!isCheckout && <Header />}
      <main style={{ minHeight: "100vh", paddingTop: "64px" }}>{children}</main>
      {!isCheckout && <Footer />}
    </>
  );
}
