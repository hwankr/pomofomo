import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          {/* Brand Section */}
          <div className="text-center">
            <Link href="/" className="text-2xl font-bold text-rose-500">
              Fomopomo
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              놓치는 것에 대한 두려움 없이, 당신의 작업에 집중하세요. 심플한 타이머로 생산성을 높여보세요.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 dark:border-slate-800 pt-8">
          <p className="text-base text-gray-500 dark:text-gray-400 text-center">
            &copy; {currentYear} fomopomo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
