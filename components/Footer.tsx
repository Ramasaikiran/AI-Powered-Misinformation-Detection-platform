
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-transparent mt-auto">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-black/60 dark:text-white/60 text-sm">
        <p>Copyright © {new Date().getFullYear()} CodeHustlers. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;