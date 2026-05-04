import Link from 'next/link';

import { Logo } from '../../(auth)/_components/logo';
import { MobileNavigation } from './mobile-navigation';

const routes = [{ name: 'Docs', href: 'https://docs.formbase.dev' }] as const;

type LandingHeaderProps = {
  isLoggedIn?: boolean;
};

export const Header = ({ isLoggedIn = false }: LandingHeaderProps) => {
  const showAuthLinks = process.env['ALLOW_SIGNIN_SIGNUP']?.trim() !== 'false';

  return (
    <header>
      <nav className="z-20 w-full border-b border-(--ui-light-border-color) bg-white/80 backdrop-blur-sm dark:border-(--ui-dark-border-color) dark:bg-gray-950/75 dark:shadow-md dark:shadow-gray-950/10">
        <div className="m-auto max-w-5xl px-6 2xl:px-0">
          <div className="flex justify-between py-2 sm:py-4">
            <div className="flex w-full items-center justify-between lg:w-auto">
              <Link
                className="text flex items-center justify-center gap-2 font-semibold"
                href={isLoggedIn ? '/dashboard' : '/'}
              >
                <Logo className="h-6 w-6" /> Formbase
              </Link>
            </div>
            <div className="flex">
              <div className="hidden w-full flex-wrap items-center justify-end space-y-8 md:flex md:w-fit md:h-fit md:flex-nowrap md:space-y-0">
                <div className="mt-6 text-gray-600 dark:text-gray-300 md:-ml-4 md:mt-0 lg:pr-4">
                  <ul className="space-y-6 text-base tracking-wide md:flex md:space-y-0 md:text-sm">
                    {routes.map(({ name, href }) => (
                      <li key={href}>
                        <Link
                          href={href}
                          className="block transition hover:text-primary-600 dark:hover:text-primary-400 md:px-4"
                        >
                          <span>{name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <>
                  {showAuthLinks ? (
                    <>
                      {isLoggedIn ? (
                        <Link
                          href="/dashboard"
                          className="flex w-full flex-col items-center gap-2 space-y-2 border-t border-(--ui-light-border-color) pb-4 pt-6 dark:border-(--ui-dark-border-color) md:w-fit md:flex-row md:space-y-0 md:border-l md:border-t-0 md:pb-0 md:pl-2 md:pt-0"
                        >
                          <button className="group relative flex h-9 w-full items-center justify-center rounded-(--btn-border-radius) border border-gray-950 bg-gray-600 px-3 text-white *:select-none before:absolute before:inset-0 before:rounded-[calc(var(--btn-border-radius)-1px)] before:border before:border-gray-600 before:bg-linear-to-b before:from-gray-800 hover:bg-gray-900 active:bg-gray-950 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-950/40 *:disabled:text-gray-300 disabled:*:opacity-20 disabled:before:border-transparent disabled:before:bg-gray-100 disabled:before:from-transparent dark:border-0 dark:bg-white dark:text-gray-950 dark:before:border-0 dark:before:border-t dark:before:border-gray-200 dark:before:from-gray-200 dark:before:shadow-inner dark:before:shadow-white/10 dark:hover:bg-gray-100 dark:active:bg-gray-300 dark:active:before:from-gray-200 dark:disabled:border dark:disabled:border-gray-800/50 dark:disabled:bg-gray-900 dark:disabled:*:text-white! dark:*:disabled:text-gray-700 dark:disabled:before:bg-gray-900 dark:disabled:before:from-gray-900 dark:disabled:before:shadow-none md:h-8 md:w-fit md:text-sm [&>*:not(.sr-only)]:relative">
                            <span>Dashboard</span>
                          </button>
                        </Link>
                      ) : (
                        <div className="flex w-full flex-col items-center gap-2 space-y-2 border-t border-(--ui-light-border-color) pb-4 pt-6 dark:border-(--ui-dark-border-color) lg:w-fit lg:flex-row lg:space-y-0 lg:border-l lg:border-t-0 lg:pb-0 lg:pl-2 lg:pt-0">
                          <Link href="/login">
                            <button className="group flex h-9 w-full items-center justify-center rounded-(--btn-border-radius) px-3.5 text-gray-800 *:select-none hover:bg-gray-100 active:bg-gray-200/75 disabled:border disabled:border-gray-200 disabled:bg-gray-100 disabled:*:text-gray-950 disabled:*:opacity-20 dark:text-gray-300 dark:hover:bg-gray-500/10 dark:active:bg-gray-500/15 dark:disabled:border dark:disabled:border-gray-800 dark:disabled:bg-gray-900 dark:disabled:*:text-white! lg:h-8 lg:w-fit lg:text-sm [&>*:not(.sr-only)]:relative">
                              <span>Login</span>
                            </button>
                          </Link>
                          <Link href="/signup">
                            <button className="group relative flex h-9 w-full items-center justify-center rounded-(--btn-border-radius) border border-gray-950 bg-gray-600 px-3 text-white *:select-none before:absolute before:inset-0 before:rounded-[calc(var(--btn-border-radius)-1px)] before:border before:border-gray-600 before:bg-linear-to-b before:from-gray-800 hover:bg-gray-900 active:bg-gray-950 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-950/40 *:disabled:text-gray-300 disabled:*:opacity-20 disabled:before:border-transparent disabled:before:bg-gray-100 disabled:before:from-transparent dark:border-0 dark:bg-white dark:text-gray-950 dark:before:border-0 dark:before:border-t dark:before:border-gray-200 dark:before:from-gray-200 dark:before:shadow-inner dark:before:shadow-white/10 dark:hover:bg-gray-100 dark:active:bg-gray-300 dark:active:before:from-gray-200 dark:disabled:border dark:disabled:border-gray-800/50 dark:disabled:bg-gray-900 dark:disabled:*:text-white! dark:*:disabled:text-gray-700 dark:disabled:before:bg-gray-900 dark:disabled:before:from-gray-900 dark:disabled:before:shadow-none lg:h-8 lg:w-fit lg:text-sm [&>*:not(.sr-only)]:relative">
                              <span>Sign Up</span>
                            </button>
                          </Link>
                        </div>
                      )}
                    </>
                  ) : null}
                </>
              </div>

              <MobileNavigation />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
