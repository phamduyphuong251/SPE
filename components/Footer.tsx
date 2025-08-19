import React, { FC } from 'react';

const Footer: FC = () => {
  return (
    <footer className="bg-white mt-auto py-4">
      <div className="container mx-auto px-6 text-center">
        <a
          href="https://aka.ms/start-spe"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-secondary hover:underline"
        >
          Get Started with SharePoint Embedded
        </a>
      </div>
    </footer>
  );
};

export default Footer;