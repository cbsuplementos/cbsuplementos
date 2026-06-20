import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "@/contexts/CartContext";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton
          phoneNumber="559199266197"
          message="Olá! Vim pelo site e gostaria de mais informações."
        />
      </div>
    </CartProvider>
  );
}
