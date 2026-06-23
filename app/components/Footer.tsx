import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap justify-center items-start gap-x-16 gap-y-8">
          <div>
            <h3 className="text-slate-800 font-semibold mb-3 flex items-center gap-2">
              <span className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </span>
              Useful Sections
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
              <li><Link href="/" className="hover:text-[#EB144C] transition">Home</Link></li>
              <li><Link href="/games" className="hover:text-[#EB144C] transition">Games</Link></li>
              <li><Link href="/apps" className="hover:text-[#EB144C] transition">Apps</Link></li>
              <li><Link href="/request" className="hover:text-[#EB144C] transition">Request</Link></li>
              <li><Link href="/report" className="hover:text-[#EB144C] transition">Report</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-800 font-semibold mb-3 flex items-center gap-2">
              <span className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </span>
              About Us
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
              <li><Link href="/about" className="hover:text-[#EB144C] transition">About APKBAY Team?</Link></li>
              <li><Link href="/contact" className="hover:text-[#EB144C] transition">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-500">
          © Copyright {new Date().getFullYear()} APKBAY.COM
        </div>
      </div>
    </footer>
  );
}
