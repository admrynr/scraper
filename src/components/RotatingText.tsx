'use client';

import { useState, useEffect } from 'react';

const words = [
  'Freelancer',
  'Sales',
  'Supplier',
  'Eksportir',
  'Pemilik Bisnis',
  'Agen Properti',
  'Tim Marketing'
];

export default function RotatingText() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    const timeout = setTimeout(() => setBlink((prev) => !prev), 500);
    return () => clearTimeout(timeout);
  }, [blink]);

  // Typewriter effect
  useEffect(() => {
    if (index >= words.length) {
      setIndex(0);
      return;
    }

    if (
      subIndex === words[index].length + 1 && 
      !reverse
    ) {
      setTimeout(() => setReverse(true), 1500); // Wait before deleting
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? 50 : 100, parseInt((Math.random() * 50).toString())));

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <span className="text-primary inline-block min-w-[150px] md:min-w-[250px] text-left">
      {`${words[index].substring(0, subIndex)}${blink ? '|' : ' '}`}
    </span>
  );
}
