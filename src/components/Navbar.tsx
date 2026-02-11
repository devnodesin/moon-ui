import { ThemeToggle } from './ThemeToggle';
import { ConnectionSwitcher } from './ConnectionSwitcher';

export function Navbar() {
  return (
    <div className="navbar bg-base-100 border-b border-base-300">
      <div className="flex-1">
        <label
          htmlFor="app-drawer"
          className="btn btn-ghost btn-circle lg:hidden"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </label>
        <a className="btn btn-ghost text-xl" href="/#/admin">
          🌙 Moon Admin
        </a>
      </div>
      <div className="flex-none gap-2">
        <ConnectionSwitcher />
        <ThemeToggle />
      </div>
    </div>
  );
}
