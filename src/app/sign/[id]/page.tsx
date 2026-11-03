import { SignExperience } from "@/components/SignExperience";

export default async function SignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SignExperience id={id} />;
}
