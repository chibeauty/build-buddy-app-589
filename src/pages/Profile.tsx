import { MainLayout } from "@/components/layout/MainLayout";

export default function Profile() {
  return (
    <MainLayout>
      <div className="container max-w-screen-xl mx-auto p-4 space-y-6">
        <h2 className="text-3xl font-heading font-bold">My Profile</h2>
      </div>
    </MainLayout>
  );
}
