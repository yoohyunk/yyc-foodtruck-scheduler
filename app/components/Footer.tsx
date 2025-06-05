'use client';

import React from 'react';
import { TutorialButton } from '../tutorial';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-primary-dark text-white py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href="/" className="hover:text-primary-light transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-primary-light transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-primary-light transition-colors">
            Contact
          </Link>
          <TutorialButton />
        </div>
        
        <div className="text-sm text-primary-light">
          © {new Date().getFullYear()} YYC Food Trucks
        </div>
      </div>
    </footer>
  );
} 