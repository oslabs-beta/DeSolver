import React, { useState } from 'react';
import { Transition } from '@headlessui/react';
import { Link, animateScroll as scroll } from "react-scroll";
import brand from '../assets/desolverbold_web.gif';

function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <nav className='bg-light-blue-navbar'>
        <div className=' max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 '>
          <div className='flex items-center justify-between h-16'>
            <div className='flex flex-row'>
              <div className='flex container mx-auto px-1'>
                <div className='md:flex  px-0'>
                  <img className='h-16 ' src={brand} alt='brand' />
                </div>
              </div>
              <div className='hidden md:block mt-4 w-14 justify-center'>
                <div className=' ml-10 flex items-baseline space-x-4'>

                  <Link className='hover:bg-orange text-dark-blue px-1 py-1 rounded-md text-sm font-medium'
                      activeClass="active"
                      to="learn"
                      spy={true}
                      smooth={true}
                      offset={-70}
                      duration={500}
                    >Learn</Link>

                  <Link className='hover:bg-orange text-dark-blue px-1 py-1 rounded-md text-sm font-medium'
                      activeClass="active"
                      to="code"
                      spy={true}
                      smooth={true}
                      offset={-70}
                      duration={500}
                    >Code</Link>

                  <Link className='hover:bg-orange text-dark-blue px-1 py-1 rounded-md text-sm font-medium'
                      activeClass="active"
                      to="team"
                      spy={true}
                      smooth={true}
                      offset={-70}
                      duration={500}
                    >Team</Link>
                </div>
              </div>
              <div className='-mr-2 flex md:hidden'>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  type='button'
                  className='bg-dark-blue inline-flex items-center justify-center p-2 rounded-md text-light hover:text-orange hover:bg-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-white'
                  aria-controls='mobile-menu'
                  aria-expanded='false'
                >
                  <span className='sr-only'>Open main menu</span>
                  {!isOpen ? (
                    <svg
                      className='block h-6 w-6'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      aria-hidden='true'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M4 6h16M4 12h16M4 18h16'
                      />
                    </svg>
                  ) : (
                    <svg
                      className='block h-6 w-6'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      aria-hidden='true'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <Transition
            show={isOpen}
            enter='transition ease-out duration-100 transform'
            enterFrom='opacity-0 scale-95'
            enterTo='opacity-100 scale-100'
            leave='transition ease-in duration-75 transform'
            leaveFrom='opacity-100 scale-100'
            leaveTo='opacity-0 scale-95'
          >
            {(ref) => (
              <div className='md:hidden' id='mobile-menu'>
                <div ref={ref} className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
                  <a
                    href='#'
                    className='text-light hover:bg-orange hover:text-light block px-1 py-1 rounded-md text-sm font-medium'
                  >
                    Dashboard
                  </a>

                  <a
                    href='#'
                    className='text-light hover:bg-orange hover:text-light block px-1 py-1 rounded-md text-sm font-medium'
                  >
                    Team
                  </a>

                  <a
                    href='#'
                    className='text-light hover:bg-orange hover:text-light block px-1 py-1 rounded-md text-sm font-medium'
                  >
                    Projects
                  </a>

                  <a
                    href='#'
                    className='text-light hover:bg-orange hover:text-light block px-1 py-1 rounded-md text-sm font-medium'
                  >
                    Calendar
                  </a>

                  <a
                    href='#'
                    className='text-light hover:bg-orange hover:text-light block px-1 py-1 rounded-md text-sm font-medium'
                  >
                    Reports
                  </a>
                </div>
              </div>
            )}
          </Transition>
        </div>
      </nav>
    </div>
  );
}

export default Nav;
