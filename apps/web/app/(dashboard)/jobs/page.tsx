import JobList from "@/components/dashboard/JobList";

export const metadata = {
  title: "งานทั้งหมด — Kaizen",
};

export default function JobsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">งานทั้งหมด</h1>
        <p className="text-gray-500 mt-1">
          ติดตามสถานะการสร้างวิดีโอและการโพสต์
        </p>
      </div>
      <JobList />
    </div>
  );
}
