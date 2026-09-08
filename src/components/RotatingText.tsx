'use client';

import { useState, useEffect } from 'react';

const words = [
  'Freelancer',
  'Sales B2B',
  'Supplier',
  'Eksportir',
  'Pemilik Toko',
  'Agen Properti',
  'Tim Marketing',
];

interface RotatingTextProps {
  className?: string;
}

export default function RotatingText({ className = 'text-indigo-600 dark:text-indigo-400' }: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setBlink((v) => !v), 500);
    return () => clearTimeout(timeout);
  }, [blink]);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      const t = setTimeout(() => setReverse(true), 1400);
      return () => clearTimeout(t);
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((v) => (v + 1) % words.length);
      return;
    }
    const speed = reverse ? 45 : 90 + Math.random() * 40;
    const t = setTimeout(() => setSubIndex((v) => v + (reverse ? -1 : 1)), speed);
    return () => clearTimeout(t);
  }, [subIndex, index, reverse]);

  return (
    <span
      className={`${className} inline-block min-w-[160px] md:min-w-[280px] text-left`}
      aria-label={words[index]}
    >
      {words[index].substring(0, subIndex)}
      <span className={`transition-opacity ${blink ? 'opacity-100' : 'opacity-0'}`}>|</span>
    </span>
  );
}
