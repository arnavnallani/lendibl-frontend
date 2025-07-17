export default function DebugHome() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Debug Home Page</h1>
      <p className="text-gray-600 mb-4">This is a minimal home page to test if the basic routing works.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold">Test Item 1</h3>
          <p>$25/day</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold">Test Item 2</h3>
          <p>$35/day</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold">Test Item 3</h3>
          <p>$45/day</p>
        </div>
      </div>
    </div>
  );
}