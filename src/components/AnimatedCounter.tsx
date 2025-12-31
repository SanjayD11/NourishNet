import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, suffix = '', duration = 2 }: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, latest => {
    if (value >= 1000) {
      return (Math.round(latest / 100) / 10).toFixed(1) + 'K';
    }
    return Math.round(latest).toString();
  });

  const displayValue = useTransform(count, latest => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { 
      duration,
      ease: "easeOut"
    });

    return controls.stop;
  }, [value, count, duration]);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {value >= 1000 ? (
        <motion.span>{rounded}</motion.span>
      ) : (
        <motion.span>{displayValue}</motion.span>
      )}
      {suffix}
    </motion.span>
  );
}