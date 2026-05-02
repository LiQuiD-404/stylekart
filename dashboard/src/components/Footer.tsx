export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-8">
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-gray-600">
        <span>StyleKart Ops Dashboard — V1</span>
        <div className="flex items-center gap-4">
          <span>Built in ~4 hrs · Claude Code</span>
          <span className="text-gray-700">|</span>
          <span>Data: Feb–Mar 2026 · {new Date().toLocaleDateString('en-IN')}</span>
        </div>
      </div>
    </footer>
  );
}
