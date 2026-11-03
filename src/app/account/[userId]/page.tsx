import { CustomerPortal } from "@/components/CustomerPortal";

export default async function AccountPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <CustomerPortal userId={userId} />;
}
