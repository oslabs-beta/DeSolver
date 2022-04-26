import React from 'react';
import logo from '../assets/orangesphere_web.gif';

const Header = () => {
  return (
    <div>
      <footer className='bg-light-blue-navbar h-auto overflow-noscroll '>
        <div className='max-w-4xl mx-auto justify-center flex flex-row'>
          <img className='h-16 mt-4' src={logo} alt='logo'></img>
          <div className='mt-9'>
            <a
              className='text-dark-blue  ml-0 hover:bg-orange px-1 py-1 rounded-md text-sm font-medium'
              href='https://github.com/oslabs-beta/DeSolver'
            >
              GitHub: DeSolver
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Header;
