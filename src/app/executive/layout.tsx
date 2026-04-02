import { GatedPage } from "@/components/gated-page";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <GatedPage feature="Executive Dashboard">{children}</GatedPage>;
}
